use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use serde::Serialize;
use std::{
    path::{Path, PathBuf},
    sync::{
        atomic::{AtomicBool, Ordering},
        mpsc::{self, Receiver, RecvTimeoutError},
        Arc, Mutex,
    },
    thread::{self, JoinHandle},
    time::{Duration, Instant},
};
use tauri::{AppHandle, Emitter};

const QUIET_PERIOD: Duration = Duration::from_millis(250);
const MAX_BATCH: Duration = Duration::from_secs(2);

/// Holds one document subscription. Authorization stays in the command layer.
#[derive(Default)]
pub struct WatchState {
    active: Mutex<Option<ActiveWatch>>,
}

#[derive(Clone, Serialize)]
struct WatchErrorPayload {
    path: String,
    message: String,
}

impl WatchState {
    /// `path` must already be an authorized, canonical, absolute document path.
    /// Passing `None` synchronously stops the previous subscription and its worker.
    pub fn replace(&self, app: &AppHandle, path: Option<PathBuf>) -> Result<(), String> {
        let mut active = self
            .active
            .lock()
            .map_err(|_| "The document watcher is unavailable.".to_string())?;
        // Recreate even the same path: callers use this to recover after a native watcher error.

        // Join before installing the next watch so old queued events cannot leak
        // into the new subscription. Dropping its callback disconnects the worker.
        drop(active.take());
        let Some(path) = path else { return Ok(()) };
        let app_handle = app.clone();
        let subscription = ActiveWatch::start(path.clone(), move |notice| match notice {
            Notice::Changed(path) => {
                let _ = app_handle.emit("document-changed", path.to_string_lossy().into_owned());
            }
            Notice::Error { path, message } => {
                let _ = app_handle.emit(
                    "document-watch-error",
                    WatchErrorPayload {
                        path: path.to_string_lossy().into_owned(),
                        message,
                    },
                );
            }
        });
        match subscription {
            Ok(watch) => {
                *active = Some(watch);
                Ok(())
            }
            Err(message) => {
                let _ = app.emit(
                    "document-watch-error",
                    WatchErrorPayload {
                        path: path.to_string_lossy().into_owned(),
                        message: message.clone(),
                    },
                );
                Err(message)
            }
        }
    }
}

#[derive(Debug)]
enum Notice {
    Changed(PathBuf),
    Error { path: PathBuf, message: String },
}

enum WatchMessage {
    Changed,
    Error(String),
}

struct ActiveWatch {
    watcher: Option<RecommendedWatcher>,
    running: Arc<AtomicBool>,
    worker: Option<JoinHandle<()>>,
}

impl ActiveWatch {
    fn start(path: PathBuf, sink: impl FnMut(Notice) + Send + 'static) -> Result<Self, String> {
        if !path.is_absolute() || path.file_name().is_none() {
            return Err("The document watcher requires an absolute file path.".into());
        }
        let parent = path
            .parent()
            .ok_or_else(|| "The document has no parent folder to watch.".to_string())?;
        let watched_path = path.clone();
        let (sender, receiver) = mpsc::channel();
        let mut watcher = notify::recommended_watcher(move |result: notify::Result<Event>| {
            let message = match result {
                Ok(event) if is_document_event(&event, &watched_path) => WatchMessage::Changed,
                Ok(_) => return,
                Err(error) => WatchMessage::Error(error.to_string()),
            };
            let _ = sender.send(message);
        })
        .map_err(|error| format!("Could not start the document watcher: {error}"))?;

        // Editors often save by renaming a new file over the old one. Watching
        // the directory keeps the subscription alive when the inode is replaced.
        watcher
            .watch(parent, RecursiveMode::NonRecursive)
            .map_err(|error| format!("Could not watch the document's folder: {error}"))?;

        let running = Arc::new(AtomicBool::new(true));
        let worker_running = running.clone();
        let worker_path = path.clone();
        let worker = thread::Builder::new()
            .name("folio-document-watch".into())
            .spawn(move || debounce(receiver, worker_running, worker_path, sink))
            .map_err(|error| format!("Could not start the document watcher worker: {error}"))?;
        Ok(Self {
            watcher: Some(watcher),
            running,
            worker: Some(worker),
        })
    }
}

impl Drop for ActiveWatch {
    fn drop(&mut self) {
        self.running.store(false, Ordering::Release);
        // The callback owns the only sender. Release it before joining a worker
        // that may be blocked in recv(). No timer or idle polling is necessary.
        drop(self.watcher.take());
        if let Some(worker) = self.worker.take() {
            let _ = worker.join();
        }
    }
}

fn is_document_event(event: &Event, document: &Path) -> bool {
    if !matches!(
        event.kind,
        EventKind::Any | EventKind::Create(_) | EventKind::Modify(_) | EventKind::Remove(_)
    ) {
        return false;
    }
    event.paths.iter().any(|path| {
        if path == document {
            return true;
        }
        // Normalize the parent rather than the file: remove/rename events must
        // still match when the document temporarily does not exist. This also
        // handles aliases such as /var versus /private/var on macOS.
        match (path.parent(), path.file_name()) {
            (Some(parent), Some(name)) => parent
                .canonicalize()
                .map(|parent| parent.join(name) == document)
                .unwrap_or(false),
            _ => false,
        }
    })
}

fn debounce(
    receiver: Receiver<WatchMessage>,
    running: Arc<AtomicBool>,
    path: PathBuf,
    mut sink: impl FnMut(Notice),
) {
    let mut batch_start: Option<Instant> = None;
    let mut last_change: Option<Instant> = None;
    loop {
        if !running.load(Ordering::Acquire) {
            return;
        }
        let message = match (batch_start, last_change) {
            (Some(first), Some(last)) => {
                let deadline = (last + QUIET_PERIOD).min(first + MAX_BATCH);
                match receiver.recv_timeout(deadline.saturating_duration_since(Instant::now())) {
                    Ok(message) => Some(message),
                    Err(RecvTimeoutError::Timeout) => None,
                    Err(RecvTimeoutError::Disconnected) => return,
                }
            }
            _ => match receiver.recv() {
                Ok(message) => Some(message),
                Err(_) => return,
            },
        };
        if !running.load(Ordering::Acquire) {
            return;
        }

        match message {
            Some(WatchMessage::Changed) => {
                let now = Instant::now();
                batch_start.get_or_insert(now);
                last_change = Some(now);
            }
            Some(WatchMessage::Error(message)) => sink(Notice::Error {
                path: path.clone(),
                message,
            }),
            None => {}
        }
        if let (Some(first), Some(last)) = (batch_start, last_change) {
            let now = Instant::now();
            if now.duration_since(last) >= QUIET_PERIOD || now.duration_since(first) >= MAX_BATCH {
                sink(Notice::Changed(path.clone()));
                batch_start = None;
                last_change = None;
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use notify::event::{AccessKind, CreateKind, DataChange, ModifyKind, RemoveKind};
    use std::{fs, io::Write};

    fn document_fixture() -> (tempfile::TempDir, PathBuf) {
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path().join("notes.md");
        fs::write(&path, "# Original\n").unwrap();
        let path = path.canonicalize().unwrap();
        (directory, path)
    }

    fn expect_changed(receiver: &Receiver<Notice>, expected: &Path) {
        match receiver.recv_timeout(Duration::from_secs(5)) {
            Ok(Notice::Changed(path)) => assert_eq!(path, expected),
            other => panic!("Expected a document change, got {other:?}"),
        }
    }

    #[test]
    fn native_watcher_observes_in_place_and_atomic_saves() {
        let (_directory, path) = document_fixture();
        let (sender, receiver) = mpsc::channel();
        let _watch = ActiveWatch::start(path.clone(), move |notice| {
            let _ = sender.send(notice);
        })
        .unwrap();

        fs::write(&path, "# Updated in place\n").unwrap();
        expect_changed(&receiver, &path);

        let mut replacement = tempfile::NamedTempFile::new_in(path.parent().unwrap()).unwrap();
        replacement.write_all(b"# Replaced atomically\n").unwrap();
        replacement.persist(&path).unwrap();
        expect_changed(&receiver, &path);

        // The replacement must remain watched after the first atomic save.
        fs::write(&path, "# Updated replacement\n").unwrap();
        expect_changed(&receiver, &path);
    }

    #[test]
    fn ignores_unrelated_paths_and_access_but_matches_missing_document() {
        let (_directory, path) = document_fixture();
        let unrelated = path.with_file_name("other.md");
        let modified = EventKind::Modify(ModifyKind::Data(DataChange::Content));
        assert!(!is_document_event(
            &Event::new(modified).add_path(unrelated),
            &path
        ));
        assert!(!is_document_event(
            &Event::new(EventKind::Access(AccessKind::Read)).add_path(path.clone()),
            &path
        ));
        fs::remove_file(&path).unwrap();
        assert!(is_document_event(
            &Event::new(EventKind::Remove(RemoveKind::File)).add_path(path.clone()),
            &path
        ));
        assert!(is_document_event(
            &Event::new(EventKind::Create(CreateKind::File)).add_path(path.clone()),
            &path
        ));
    }

    #[test]
    fn dropping_watch_joins_worker_and_disconnects_sink() {
        let (_directory, path) = document_fixture();
        for _ in 0..3 {
            let (sender, receiver) = mpsc::channel();
            let watch = ActiveWatch::start(path.clone(), move |notice| {
                let _ = sender.send(notice);
            })
            .unwrap();
            drop(watch);
            // The sink's last sender is owned by the worker, so disconnection
            // proves the worker exited instead of being detached or leaked.
            assert!(matches!(
                receiver.recv_timeout(Duration::from_secs(1)),
                Err(RecvTimeoutError::Disconnected)
            ));
        }
    }

    #[test]
    fn debounces_bursts_and_reports_errors_without_document_contents() {
        let (sender, receiver) = mpsc::channel();
        let (output, notices) = mpsc::channel();
        let path = PathBuf::from("/authorized/notes.md");
        let expected = path.clone();
        let running = Arc::new(AtomicBool::new(true));
        let worker = thread::spawn(move || {
            debounce(receiver, running, path, move |notice| {
                output.send(notice).unwrap();
            })
        });
        for _ in 0..10 {
            sender.send(WatchMessage::Changed).unwrap();
        }
        expect_changed(&notices, &expected);
        assert!(matches!(notices.try_recv(), Err(mpsc::TryRecvError::Empty)));
        sender
            .send(WatchMessage::Error("Watch unavailable".into()))
            .unwrap();
        match notices.recv_timeout(Duration::from_secs(1)).unwrap() {
            Notice::Error { path, message } => {
                assert_eq!(path, expected);
                assert_eq!(message, "Watch unavailable");
            }
            other => panic!("Expected watch error, got {other:?}"),
        }
        drop(sender);
        worker.join().unwrap();
    }

    #[test]
    fn continuous_changes_flush_within_maximum_batch() {
        let (sender, receiver) = mpsc::channel();
        let (output, notices) = mpsc::channel();
        let running = Arc::new(AtomicBool::new(true));
        let producer_running = running.clone();
        let worker_running = running.clone();
        let path = PathBuf::from("/authorized/notes.md");
        let expected = path.clone();
        let worker = thread::spawn(move || {
            debounce(receiver, worker_running, path, move |notice| {
                let _ = output.send(notice);
            })
        });
        let producer = thread::spawn(move || {
            while producer_running.load(Ordering::Acquire) {
                if sender.send(WatchMessage::Changed).is_err() {
                    break;
                }
                thread::sleep(Duration::from_millis(40));
            }
        });
        // No quiet interval is possible; only the maximum batch can flush.
        let result = notices.recv_timeout(MAX_BATCH + Duration::from_secs(1));
        running.store(false, Ordering::Release);
        producer.join().unwrap();
        worker.join().unwrap();
        match result {
            Ok(Notice::Changed(path)) => assert_eq!(path, expected),
            other => panic!("Continuous writes never flushed: {other:?}"),
        }
    }
}
