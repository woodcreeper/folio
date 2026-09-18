use base64::{engine::general_purpose::STANDARD, Engine};
use percent_encoding::percent_decode_str;
use serde::Serialize;
use std::{
    collections::HashSet,
    fs::File,
    io::Read,
    path::{Path, PathBuf},
};

pub const MAX_DOCUMENT_BYTES: u64 = 10 * 1024 * 1024;
const MAX_IMAGE_BYTES: u64 = 10 * 1024 * 1024;

#[derive(Clone, Debug, Serialize)]
pub struct Document {
    pub name: String,
    pub path: String,
    pub content: String,
}

#[derive(Default)]
pub struct DocumentStore {
    authorized: HashSet<PathBuf>,
    current: Option<Document>,
    error: Option<String>,
}

impl DocumentStore {
    pub fn open(&mut self, path: &Path) -> Result<Document, String> {
        let canonical = canonical_document(path)?;
        let document = read_document(&canonical)?;
        self.authorized.clear();
        self.authorized.insert(canonical);
        self.current = Some(document.clone());
        self.error = None;
        Ok(document)
    }

    pub fn close(&mut self, path: &Path) {
        // The frontend uses the canonical path returned by open(). Avoid
        // canonicalizing again: a deleted file must still be closable.
        self.authorized.remove(path);
        if self
            .current
            .as_ref()
            .is_some_and(|doc| Path::new(&doc.path) == path)
        {
            self.current = None;
            self.error = None;
        }
    }

    pub fn reload(&mut self, path: &Path) -> Result<Document, String> {
        let canonical = self.authorized_path(path)?;
        let document = read_document(&canonical)?;
        if self
            .current
            .as_ref()
            .is_some_and(|current| current.path == document.path)
        {
            self.current = Some(document.clone());
            self.error = None;
        }
        Ok(document)
    }

    pub fn initial(&self) -> Result<Option<Document>, String> {
        match &self.error {
            Some(error) => Err(error.clone()),
            None => Ok(self.current.clone()),
        }
    }

    pub fn record_error(&mut self, error: String) {
        self.error = Some(error);
    }

    pub fn read_image(&self, document_path: &Path, relative_path: &str) -> Result<String, String> {
        let document = self.authorized_path(document_path)?;
        let parent = document
            .parent()
            .ok_or("This document has no parent folder.")?;
        let relative = decode_relative_image_path(relative_path)?;
        let path = parent
            .join(relative)
            .canonicalize()
            .map_err(|_| "This local image could not be found.".to_owned())?;
        if !path.starts_with(parent) {
            return Err("Images must be inside the document's folder.".to_owned());
        }
        let extension = path
            .extension()
            .and_then(|value| value.to_str())
            .unwrap_or("")
            .to_ascii_lowercase();
        if !matches!(
            extension.as_str(),
            "png" | "jpg" | "jpeg" | "gif" | "webp" | "bmp"
        ) {
            return Err("Local images must be PNG, JPEG, GIF, WebP, or BMP files.".to_owned());
        }
        let bytes = read_bounded(&path, MAX_IMAGE_BYTES, "Image")?;
        let mime = raster_mime(&extension, &bytes)
            .ok_or("The image contents do not match a supported raster format.")?;
        Ok(format!("data:{mime};base64,{}", STANDARD.encode(bytes)))
    }

    pub(crate) fn authorized_path(&self, path: &Path) -> Result<PathBuf, String> {
        let canonical = path.canonicalize().map_err(|_| {
            "This document is no longer available. Open it again to continue.".to_owned()
        })?;
        if !self.authorized.contains(&canonical) {
            return Err("Open this document in Folio before accessing it.".to_owned());
        }
        Ok(canonical)
    }
}

pub fn is_markdown(path: &Path) -> bool {
    path.extension()
        .and_then(|extension| extension.to_str())
        .map(|extension| {
            matches!(
                extension.to_ascii_lowercase().as_str(),
                "md" | "markdown" | "mdown" | "mkd"
            )
        })
        .unwrap_or(false)
}

fn canonical_document(path: &Path) -> Result<PathBuf, String> {
    if !is_markdown(path) {
        return Err("Choose a Markdown file (.md, .markdown, .mdown, or .mkd).".to_owned());
    }
    path.canonicalize()
        .map_err(|error| format!("Couldn't open this document: {error}"))
}

fn read_document(path: &Path) -> Result<Document, String> {
    let bytes = read_bounded(path, MAX_DOCUMENT_BYTES, "Document")?;
    let content = String::from_utf8(bytes).map_err(|_| {
        "This file isn't UTF-8 text. Save it as UTF-8 Markdown and open it again.".to_owned()
    })?;
    if content.contains('\0') {
        return Err("This file contains binary data. Choose a UTF-8 Markdown document.".to_owned());
    }
    Ok(Document {
        name: path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .into_owned(),
        path: path.to_string_lossy().into_owned(),
        content: content
            .strip_prefix('\u{feff}')
            .unwrap_or(&content)
            .to_owned(),
    })
}

fn read_bounded(path: &Path, limit: u64, label: &str) -> Result<Vec<u8>, String> {
    let preflight =
        std::fs::metadata(path).map_err(|error| format!("Couldn't inspect this file: {error}"))?;
    if !preflight.is_file() {
        return Err("Choose a file, rather than a folder or device.".to_owned());
    }
    let file = File::open(path)
        .map_err(|error| format!("Couldn't read this {}: {error}", label.to_lowercase()))?;
    let metadata = file
        .metadata()
        .map_err(|error| format!("Couldn't inspect this file: {error}"))?;
    if !metadata.is_file() {
        return Err("Choose a file, rather than a folder or device.".to_owned());
    }
    if metadata.len() > limit {
        return Err(format!(
            "{label} is too large. Folio supports files up to {} MiB.",
            limit / 1024 / 1024
        ));
    }
    // A second limit protects against a file growing between metadata and read.
    let mut bytes = Vec::with_capacity(metadata.len() as usize);
    file.take(limit + 1)
        .read_to_end(&mut bytes)
        .map_err(|error| format!("Couldn't read this file: {error}"))?;
    if bytes.len() as u64 > limit {
        return Err(format!(
            "{label} is too large. Folio supports files up to {} MiB.",
            limit / 1024 / 1024
        ));
    }
    Ok(bytes)
}

fn decode_relative_image_path(source: &str) -> Result<PathBuf, String> {
    let source = source.split(['?', '#']).next().unwrap_or("");
    let decoded = percent_decode_str(source)
        .decode_utf8()
        .map_err(|_| "This image path isn't valid UTF-8.".to_owned())?;
    let path = Path::new(decoded.as_ref());
    // Reject schemes, UNC/absolute paths and Windows separators on every OS.
    if decoded.is_empty() || decoded.contains([':', '\\', '\0']) || path.is_absolute() {
        return Err("Only relative local image paths are supported.".to_owned());
    }
    Ok(path.to_path_buf())
}

fn raster_mime(extension: &str, bytes: &[u8]) -> Option<&'static str> {
    match extension {
        "png" if bytes.starts_with(b"\x89PNG\r\n\x1a\n") => Some("image/png"),
        "jpg" | "jpeg" if bytes.starts_with(b"\xff\xd8\xff") => Some("image/jpeg"),
        "gif" if bytes.starts_with(b"GIF87a") || bytes.starts_with(b"GIF89a") => Some("image/gif"),
        "webp" if bytes.starts_with(b"RIFF") && bytes.get(8..12) == Some(b"WEBP") => {
            Some("image/webp")
        }
        "bmp" if bytes.starts_with(b"BM") => Some("image/bmp"),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn replacing_and_closing_releases_the_previous_document() {
        let temp = tempfile::tempdir().unwrap();
        let first = temp.path().join("first.md");
        let second = temp.path().join("second.md");
        fs::write(&first, "# First").unwrap();
        fs::write(&second, "# Second").unwrap();
        let mut store = DocumentStore::default();
        let old = store.open(&first).unwrap();
        let current = store.open(&second).unwrap();
        assert!(store.reload(&first).is_err());
        store.close(Path::new(&old.path));
        assert_eq!(store.initial().unwrap().unwrap().path, current.path);
        fs::remove_file(&second).unwrap();
        store.close(Path::new(&current.path));
        assert!(store.initial().unwrap().is_none());
        fs::write(&second, "# Restored").unwrap();
        assert!(store.reload(&second).is_err());
        assert_eq!(store.open(&second).unwrap().content, "# Restored");
    }

    #[test]
    fn opening_authorizes_reload_and_strips_utf8_bom() {
        let temp = tempfile::tempdir().unwrap();
        let path = temp.path().join("notes.MD");
        fs::write(&path, "\u{feff}# Hello").unwrap();
        let mut store = DocumentStore::default();
        assert!(store.reload(&path).is_err());
        assert_eq!(store.open(&path).unwrap().content, "# Hello");
        fs::write(&path, "# Changed").unwrap();
        assert_eq!(store.reload(&path).unwrap().content, "# Changed");
    }

    #[test]
    fn rejects_binary_and_oversized_documents() {
        let temp = tempfile::tempdir().unwrap();
        let path = temp.path().join("notes.md");
        let mut store = DocumentStore::default();
        fs::write(&path, [0xff, 0xfe]).unwrap();
        assert!(store.open(&path).unwrap_err().contains("UTF-8"));
        fs::write(&path, [0, 1, 2]).unwrap();
        assert!(store.open(&path).unwrap_err().contains("binary"));
        File::create(&path)
            .unwrap()
            .set_len(MAX_DOCUMENT_BYTES + 1)
            .unwrap();
        assert!(store.open(&path).unwrap_err().contains("too large"));
    }

    #[test]
    fn local_images_require_document_authorization_and_stay_in_its_folder() {
        let temp = tempfile::tempdir().unwrap();
        let folder = temp.path().join("docs");
        fs::create_dir(&folder).unwrap();
        let path = folder.join("notes.md");
        fs::write(&path, "# Hello").unwrap();
        let png = b"\x89PNG\r\n\x1a\n";
        fs::write(folder.join("my image.png"), png).unwrap();
        fs::write(temp.path().join("outside.png"), png).unwrap();
        let mut store = DocumentStore::default();
        assert!(store.read_image(&path, "my%20image.png").is_err());
        store.open(&path).unwrap();
        assert!(store
            .read_image(&path, "my%20image.png")
            .unwrap()
            .starts_with("data:image/png;base64,"));
        for image in [
            "../outside.png",
            "%2e%2e/outside.png",
            "https://example.com/a.png",
            "//example.com/a.png",
            "/tmp/a.png",
            "data:image/png,foo",
            "C:\\file.png",
        ] {
            assert!(store.read_image(&path, image).is_err(), "allowed {image}");
        }
        fs::write(folder.join("fake.png"), b"<svg onload='alert(1)'/>").unwrap();
        assert!(store.read_image(&path, "fake.png").is_err());
    }

    #[cfg(unix)]
    #[test]
    fn symlink_images_cannot_escape_document_folder() {
        let temp = tempfile::tempdir().unwrap();
        let folder = temp.path().join("docs");
        fs::create_dir(&folder).unwrap();
        let path = folder.join("notes.md");
        fs::write(&path, "# Hello").unwrap();
        let outside = temp.path().join("outside.png");
        fs::write(&outside, b"\x89PNG\r\n\x1a\n").unwrap();
        std::os::unix::fs::symlink(&outside, folder.join("linked.png")).unwrap();
        let mut store = DocumentStore::default();
        store.open(&path).unwrap();
        assert!(store.read_image(&path, "linked.png").is_err());
    }
}
