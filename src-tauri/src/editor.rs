//! An external editor is a user-selected application, never a command supplied by
//! a document. Only the application's path is persisted; filenames stay arguments.

use serde::{Deserialize, Serialize};
use std::{
    fs::{self, OpenOptions},
    io::{Read, Write},
    path::{Path, PathBuf},
    process::{Command, Stdio},
    sync::atomic::{AtomicU64, Ordering},
};
use tauri::{AppHandle, Manager};
use tauri_plugin_dialog::DialogExt;

const SETTINGS_FILE: &str = "editor.json";
const MAX_SETTINGS_BYTES: u64 = 64 * 1024;
const SELF_ERROR: &str = "Folio is a viewer. Choose a different application for editing.";
static TEMP_SEQUENCE: AtomicU64 = AtomicU64::new(0);

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct EditorInfo {
    pub name: String,
    pub path: String,
}

#[tauri::command]
pub async fn get_editor(app: AppHandle) -> Result<Option<EditorInfo>, String> {
    tauri::async_runtime::spawn_blocking(move || read_settings(&settings_path(&app)?))
        .await
        .map_err(|_| "The saved editor could not be loaded. Please try again.".to_owned())?
}

#[tauri::command]
pub async fn choose_editor(app: AppHandle) -> Result<Option<EditorInfo>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let picker = app
            .dialog()
            .file()
            .set_title("Choose your editor application");
        #[cfg(target_os = "macos")]
        let picker = picker
            .set_directory("/Applications")
            .add_filter("Applications", &["app"]);
        #[cfg(target_os = "windows")]
        let picker = picker.add_filter("Applications", &["exe"]);

        let Some(selected) = picker.blocking_pick_file() else {
            return Ok(None);
        };
        let path = selected
            .into_path()
            .map_err(|_| "Choose an application installed on this computer.".to_owned())?;
        let current_executable = std::env::current_exe()
            .map_err(|error| format!("Folio could not check the selected application: {error}"))?;
        let editor = validate_editor(&path, &current_executable, &app.config().identifier)?;
        // Do not report success or launch until this choice has been saved.
        write_settings(&settings_path(&app)?, &editor)?;
        Ok(Some(editor))
    })
    .await
    .map_err(|_| "The application picker could not finish. Please try again.".to_owned())?
}

/// The caller must first authorize and canonicalize `document` using the
/// document store. Run this blocking helper off the UI thread.
pub fn launch_editor(app: &AppHandle, document: &Path) -> Result<EditorInfo, String> {
    let saved = read_settings(&settings_path(app)?)?
        .ok_or("Choose an editor before opening this document for editing.")?;
    let current_executable = std::env::current_exe()
        .map_err(|error| format!("Folio could not check the selected application: {error}"))?;
    let editor = validate_editor(
        Path::new(&saved.path),
        &current_executable,
        &app.config().identifier,
    )?;
    if !document.is_absolute() || !document.is_file() {
        return Err("This document is no longer available. Open it again to continue.".to_owned());
    }
    let mut command = editor_command(Path::new(&editor.path), document);
    command.stdin(Stdio::null());

    #[cfg(target_os = "macos")]
    {
        // `open` returns after handing the document to Launch Services, without
        // waiting for the editor to close. Capture errors such as broken bundles.
        let result = command
            .output()
            .map_err(|error| format!("{} could not be opened: {error}", editor.name))?;
        if !result.status.success() {
            return Err(format!(
                "{} could not open this document. Check that the application is installed, or choose another editor.",
                editor.name
            ));
        }
    }
    #[cfg(not(target_os = "macos"))]
    {
        let mut child = command
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|error| format!("{} could not be opened: {error}", editor.name))?;
        // Reap the child on Unix without holding up the reader for the lifetime
        // of an editor process. Windows also releases the process handle here.
        std::thread::spawn(move || {
            let _ = child.wait();
        });
    }
    Ok(editor)
}

fn settings_path(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_config_dir()
        .map(|folder| folder.join(SETTINGS_FILE))
        .map_err(|error| format!("Folio's preferences folder could not be located: {error}"))
}

fn read_settings(path: &Path) -> Result<Option<EditorInfo>, String> {
    let file = match fs::File::open(path) {
        Ok(file) => file,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(error) => return Err(format!("The saved editor could not be read: {error}")),
    };
    let metadata = file
        .metadata()
        .map_err(|error| format!("The saved editor could not be inspected: {error}"))?;
    if !metadata.is_file() || metadata.len() > MAX_SETTINGS_BYTES {
        return Err("The saved editor preference is invalid. Choose your editor again.".to_owned());
    }
    let mut bytes = Vec::new();
    file.take(MAX_SETTINGS_BYTES + 1)
        .read_to_end(&mut bytes)
        .map_err(|error| format!("The saved editor could not be read: {error}"))?;
    if bytes.len() as u64 > MAX_SETTINGS_BYTES {
        return Err("The saved editor preference is invalid. Choose your editor again.".to_owned());
    }
    let editor: EditorInfo = serde_json::from_slice(&bytes).map_err(|_| {
        "The saved editor preference is invalid. Choose your editor again.".to_owned()
    })?;
    if editor.name.trim().is_empty() || !Path::new(&editor.path).is_absolute() {
        return Err("The saved editor preference is invalid. Choose your editor again.".to_owned());
    }
    // A removed application remains visible as the preference. Launch performs
    // fresh validation and guides the user to choose its replacement.
    Ok(Some(editor))
}

fn write_settings(path: &Path, editor: &EditorInfo) -> Result<(), String> {
    let parent = path
        .parent()
        .ok_or("The editor preferences path is invalid.")?;
    let bytes = serde_json::to_vec_pretty(editor)
        .map_err(|error| format!("The editor preference could not be encoded: {error}"))?;
    if bytes.len() as u64 > MAX_SETTINGS_BYTES {
        return Err("The application path is too long to save.".to_owned());
    }
    fs::create_dir_all(parent)
        .map_err(|error| format!("The editor preference could not be saved: {error}"))?;
    let temporary = parent.join(format!(
        ".editor-{}-{}.tmp",
        std::process::id(),
        TEMP_SEQUENCE.fetch_add(1, Ordering::Relaxed)
    ));
    let mut options = OpenOptions::new();
    options.write(true).create_new(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }
    let mut file = options
        .open(&temporary)
        .map_err(|error| format!("The editor preference could not be saved: {error}"))?;
    let result = (|| {
        file.write_all(&bytes)?;
        file.sync_all()?;
        drop(file);
        fs::rename(&temporary, path)
    })();
    if let Err(error) = result {
        let _ = fs::remove_file(&temporary);
        return Err(format!("The editor preference could not be saved: {error}"));
    }
    Ok(())
}

fn validate_editor(
    selected: &Path,
    current_executable: &Path,
    bundle_identifier: &str,
) -> Result<EditorInfo, String> {
    let path = selected.canonicalize().map_err(|_| {
        "The selected editor is no longer available. Choose it again or choose another editor."
            .to_owned()
    })?;
    if same_executable(&path, current_executable) {
        return Err(SELF_ERROR.to_owned());
    }

    #[cfg(target_os = "macos")]
    let name = {
        if !path.is_dir()
            || !path
                .extension()
                .is_some_and(|value| value.eq_ignore_ascii_case("app"))
        {
            return Err("Choose a macOS application (.app), such as your text editor.".to_owned());
        }
        let info = read_application_info(&path)?;
        if info
            .get("CFBundleIdentifier")
            .and_then(|value| value.as_str())
            == Some(bundle_identifier)
        {
            return Err(SELF_ERROR.to_owned());
        }
        let executable_name = info
            .get("CFBundleExecutable")
            .and_then(|value| value.as_str())
            .filter(|value| !value.is_empty())
            .ok_or("This application has no executable. Choose another editor.")?;
        let component = Path::new(executable_name);
        if component.components().count() != 1
            || !matches!(
                component.components().next(),
                Some(std::path::Component::Normal(_))
            )
        {
            return Err("This application's executable path is invalid.".to_owned());
        }
        let executable = path.join("Contents/MacOS").join(executable_name);
        validate_executable_file(&executable)?;
        if same_executable(&executable, current_executable) {
            return Err(SELF_ERROR.to_owned());
        }
        info.get("CFBundleDisplayName")
            .or_else(|| info.get("CFBundleName"))
            .and_then(|value| value.as_str())
            .filter(|value| !value.trim().is_empty())
            .map(str::to_owned)
            .unwrap_or_else(|| display_name(&path))
    };

    #[cfg(not(target_os = "macos"))]
    let name = {
        let _ = bundle_identifier;
        validate_executable_file(&path)?;
        #[cfg(target_os = "windows")]
        if !path
            .extension()
            .is_some_and(|value| value.eq_ignore_ascii_case("exe"))
        {
            return Err("Choose the editor's application executable (.exe).".to_owned());
        }
        display_name(&path)
    };

    let path = path
        .to_str()
        .ok_or("The selected editor path is not valid Unicode.")?
        .to_owned();
    Ok(EditorInfo { name, path })
}

fn validate_executable_file(path: &Path) -> Result<(), String> {
    let metadata = fs::metadata(path).map_err(|_| {
        "This application's executable is missing. Choose another editor.".to_owned()
    })?;
    if !metadata.is_file() {
        return Err("Choose an application executable, rather than a folder.".to_owned());
    }
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        if metadata.permissions().mode() & 0o111 == 0 {
            return Err(
                "This file is not executable. Choose an installed editor application.".to_owned(),
            );
        }
    }
    Ok(())
}

fn same_executable(candidate: &Path, current: &Path) -> bool {
    if let (Ok(candidate), Ok(current)) = (candidate.canonicalize(), current.canonicalize()) {
        if candidate == current {
            return true;
        }
        #[cfg(unix)]
        {
            use std::os::unix::fs::MetadataExt;
            if let (Ok(candidate), Ok(current)) = (fs::metadata(candidate), fs::metadata(current)) {
                return candidate.dev() == current.dev() && candidate.ino() == current.ino();
            }
        }
    }
    false
}

fn display_name(path: &Path) -> String {
    path.file_stem()
        .unwrap_or_default()
        .to_string_lossy()
        .into_owned()
}

#[cfg(target_os = "macos")]
fn read_application_info(application: &Path) -> Result<serde_json::Value, String> {
    let plist = application.join("Contents/Info.plist");
    let metadata = fs::metadata(&plist)
        .map_err(|_| "This application has no Info.plist. Choose another editor.".to_owned())?;
    if !metadata.is_file() || metadata.len() > 1024 * 1024 {
        return Err("This application's Info.plist is invalid.".to_owned());
    }
    // plutil reads both binary and XML plists. The fixed program and separate
    // arguments prevent application names from being interpreted as commands.
    let output = Command::new("/usr/bin/plutil")
        .args(["-convert", "json", "-o", "-", "--"])
        .arg(plist)
        .output()
        .map_err(|error| format!("The selected application could not be checked: {error}"))?;
    if !output.status.success() {
        return Err(
            "This application's Info.plist could not be read. Choose another editor.".to_owned(),
        );
    }
    serde_json::from_slice(&output.stdout)
        .map_err(|_| "This application's metadata is invalid. Choose another editor.".to_owned())
}

fn editor_command(editor: &Path, document: &Path) -> Command {
    #[cfg(target_os = "macos")]
    {
        let mut command = Command::new("/usr/bin/open");
        command.arg("-a").arg(editor).arg("--").arg(document);
        command
    }
    #[cfg(not(target_os = "macos"))]
    {
        let mut command = Command::new(editor);
        command.arg(document);
        command
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn document_and_editor_names_remain_literal_arguments() {
        let editor = Path::new("/Applications/Editor With Spaces.app");
        let document = Path::new("/Documents/notes $(touch unwanted); --draft.md");
        let command = editor_command(editor, document);
        let arguments = command.get_args().collect::<Vec<_>>();
        #[cfg(target_os = "macos")]
        {
            assert_eq!(command.get_program(), "/usr/bin/open");
            assert_eq!(
                arguments,
                [
                    std::ffi::OsStr::new("-a"),
                    editor.as_os_str(),
                    std::ffi::OsStr::new("--"),
                    document.as_os_str()
                ]
            );
        }
        #[cfg(not(target_os = "macos"))]
        {
            assert_eq!(command.get_program(), editor.as_os_str());
            assert_eq!(arguments, [document.as_os_str()]);
        }
    }

    #[test]
    fn preferences_survive_replacement_and_are_only_written_to_requested_file() {
        let folder = tempfile::tempdir().unwrap();
        let path = folder.path().join("config/editor.json");
        assert_eq!(read_settings(&path).unwrap(), None);
        let first = EditorInfo {
            name: "Editor One".to_owned(),
            path: folder
                .path()
                .join("Editor One.app")
                .to_str()
                .unwrap()
                .to_owned(),
        };
        write_settings(&path, &first).unwrap();
        assert_eq!(read_settings(&path).unwrap(), Some(first));
        let replacement = EditorInfo {
            name: "Editor Two".to_owned(),
            path: folder
                .path()
                .join("Editor Two.app")
                .to_str()
                .unwrap()
                .to_owned(),
        };
        write_settings(&path, &replacement).unwrap();
        assert_eq!(read_settings(&path).unwrap(), Some(replacement));
        assert_eq!(fs::read_dir(path.parent().unwrap()).unwrap().count(), 1);
    }

    #[test]
    fn invalid_preferences_fail_with_recovery_instructions() {
        let folder = tempfile::tempdir().unwrap();
        let path = folder.path().join("editor.json");
        for contents in [
            "not JSON",
            r#"{"name":"Editor","path":"relative/path"}"#,
            r#"{"name":"","path":"/Applications/Editor.app"}"#,
        ] {
            fs::write(&path, contents).unwrap();
            assert!(read_settings(&path)
                .unwrap_err()
                .contains("Choose your editor again"));
        }
        fs::File::create(&path)
            .unwrap()
            .set_len(MAX_SETTINGS_BYTES + 1)
            .unwrap();
        assert!(read_settings(&path).is_err());
    }

    #[test]
    fn failed_preference_write_keeps_existing_data() {
        let folder = tempfile::tempdir().unwrap();
        let path = folder.path().join("editor.json");
        let editor = EditorInfo {
            name: "Editor".to_owned(),
            path: folder
                .path()
                .join("Editor.app")
                .to_str()
                .unwrap()
                .to_owned(),
        };
        write_settings(&path, &editor).unwrap();
        let original = fs::read(&path).unwrap();
        let too_large = EditorInfo {
            name: "x".repeat(MAX_SETTINGS_BYTES as usize),
            path: editor.path,
        };
        assert!(write_settings(&path, &too_large).is_err());
        assert_eq!(fs::read(&path).unwrap(), original);
    }

    #[test]
    fn rejects_missing_editor_and_current_executable() {
        let folder = tempfile::tempdir().unwrap();
        let current = std::env::current_exe().unwrap();
        assert!(validate_editor(
            &folder.path().join("gone"),
            &current,
            "dev.mdquickviewer.folio"
        )
        .unwrap_err()
        .contains("no longer available"));
        assert_eq!(
            validate_editor(&current, &current, "dev.mdquickviewer.folio").unwrap_err(),
            SELF_ERROR
        );
    }

    #[cfg(unix)]
    #[test]
    fn executable_validation_rejects_plain_files_and_self_symlinks() {
        use std::os::unix::fs::{symlink, PermissionsExt};
        let folder = tempfile::tempdir().unwrap();
        let file = folder.path().join("notes.txt");
        fs::write(&file, "not executable").unwrap();
        fs::set_permissions(&file, fs::Permissions::from_mode(0o644)).unwrap();
        assert!(validate_executable_file(&file).is_err());
        assert!(validate_executable_file(folder.path()).is_err());
        let current = std::env::current_exe().unwrap();
        let alias = folder.path().join("Renamed Folio");
        symlink(&current, &alias).unwrap();
        assert_eq!(
            validate_editor(&alias, &current, "dev.mdquickviewer.folio").unwrap_err(),
            SELF_ERROR
        );
    }

    #[cfg(target_os = "macos")]
    #[test]
    fn mac_editor_validation_checks_bundle_identity_even_when_renamed() {
        use std::os::unix::fs::PermissionsExt;
        let folder = tempfile::tempdir().unwrap();
        let app = folder.path().join("Renamed App.app");
        fs::create_dir_all(app.join("Contents/MacOS")).unwrap();
        let executable = app.join("Contents/MacOS/Editor");
        fs::write(&executable, "test fixture, never executed").unwrap();
        fs::set_permissions(&executable, fs::Permissions::from_mode(0o755)).unwrap();
        let plist = |identifier: &str| {
            format!(
                r#"<?xml version="1.0"?><plist version="1.0"><dict><key>CFBundleIdentifier</key><string>{identifier}</string><key>CFBundleName</key><string>Example Editor</string><key>CFBundleExecutable</key><string>Editor</string></dict></plist>"#
            )
        };
        fs::write(
            app.join("Contents/Info.plist"),
            plist("dev.mdquickviewer.folio"),
        )
        .unwrap();
        let current = std::env::current_exe().unwrap();
        assert_eq!(
            validate_editor(&app, &current, "dev.mdquickviewer.folio").unwrap_err(),
            SELF_ERROR
        );
        fs::write(app.join("Contents/Info.plist"), plist("example.editor")).unwrap();
        assert_eq!(
            validate_editor(&app, &current, "dev.mdquickviewer.folio")
                .unwrap()
                .name,
            "Example Editor"
        );
        fs::remove_file(executable).unwrap();
        assert!(validate_editor(&app, &current, "dev.mdquickviewer.folio").is_err());
    }

    #[cfg(target_os = "macos")]
    #[test]
    fn installed_textedit_bundle_can_be_selected_when_available() {
        let application = Path::new("/System/Applications/TextEdit.app");
        if !application.exists() {
            return;
        }
        let editor = validate_editor(
            application,
            &std::env::current_exe().unwrap(),
            "dev.mdquickviewer.folio",
        )
        .unwrap();
        assert!(!editor.name.is_empty());
        assert_eq!(Path::new(&editor.path), application);
    }
}
