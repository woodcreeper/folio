import Foundation
import JavaScriptCore

enum PreviewError: LocalizedError {
    case missingResource(String)
    case unreadableDocument
    case documentTooLarge
    case invalidEncoding
    case rendererFailed(String)

    var errorDescription: String? {
        switch self {
        case .missingResource(let name): return "Folio's preview resource is missing: \(name)."
        case .unreadableDocument: return "This Markdown document could not be read."
        case .documentTooLarge: return "This document exceeds Folio's 10 MB preview limit. Open it in the app instead."
        case .invalidEncoding: return "Folio previews Markdown documents saved as UTF-8."
        case .rendererFailed(let message): return "Folio could not render this document: \(message)"
        }
    }
}

/// The renderer and reading stylesheet are built from the same sources as the app.
/// JavaScriptCore has no browser, filesystem, network, or desktop IPC bindings here.
enum MarkdownPreviewRenderer {
    static let maximumDocumentBytes = 10 * 1024 * 1024

    static func renderDocument(at fileURL: URL, resources: Bundle) throws -> Data {
        guard fileURL.isFileURL else { throw PreviewError.unreadableDocument }
        let file = try FileHandle(forReadingFrom: fileURL)
        defer { try? file.close() }
        // Bound the actual read instead of relying on a racy file-size preflight.
        let bytes = try file.read(upToCount: maximumDocumentBytes + 1) ?? Data()
        guard bytes.count <= maximumDocumentBytes else { throw PreviewError.documentTooLarge }
        guard let source = String(data: bytes, encoding: .utf8) else { throw PreviewError.invalidEncoding }

        let renderer = try resource("renderer", extension: "js", bundle: resources)
        let stylesheet = try resource("reader", extension: "css", bundle: resources)
        let html = try renderMarkdown(source, renderer: renderer)
        let title = escapeHTML(fileURL.lastPathComponent)

        // Document HTML cannot execute scripts, load remote images, or navigate a base URL.
        // Local images are intentionally unavailable in Quick Look's document sandbox.
        let document = """
        <!doctype html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
          <meta name="color-scheme" content="light dark">
          <title>\(title)</title>
          <style>
          \(stylesheet)
          body { margin: 0; padding: 40px clamp(24px, 6vw, 64px); background: var(--reader-paper); color: var(--reader-text); }
          .markdown-body { max-width: 760px; margin: 0 auto; overflow-wrap: anywhere; }
          img { max-width: 100%; height: auto; }
          </style>
        </head>
        <body><article class="markdown-body reader-content">\(html)</article></body>
        </html>
        """
        return Data(document.utf8)
    }

    private static func resource(_ name: String, extension ext: String, bundle: Bundle) throws -> String {
        guard let url = bundle.url(forResource: name, withExtension: ext) else {
            throw PreviewError.missingResource("\(name).\(ext)")
        }
        return try String(contentsOf: url, encoding: .utf8)
    }

    private static func renderMarkdown(_ source: String, renderer: String) throws -> String {
        guard let context = JSContext() else { throw PreviewError.rendererFailed("JavaScriptCore is unavailable.") }
        var exception: String?
        context.exceptionHandler = { _, value in exception = value?.toString() ?? "Unknown JavaScript error." }
        context.evaluateScript(renderer)
        if let exception { throw PreviewError.rendererFailed(exception) }
        guard let namespace = context.objectForKeyedSubscript("FolioRenderer"),
              !namespace.isUndefined,
              let function = namespace.objectForKeyedSubscript("renderMarkdown"),
              !function.isUndefined else {
            throw PreviewError.rendererFailed("The shared renderer export is missing.")
        }
        let result = function.call(withArguments: [source, ["preview": true]])
        if let exception { throw PreviewError.rendererFailed(exception) }
        guard let htmlValue = result?.objectForKeyedSubscript("html"), htmlValue.isString,
              let html = htmlValue.toString() else {
            throw PreviewError.rendererFailed("The shared renderer returned no HTML.")
        }
        return html
    }

    private static func escapeHTML(_ text: String) -> String {
        text.replacingOccurrences(of: "&", with: "&amp;")
            .replacingOccurrences(of: "<", with: "&lt;")
            .replacingOccurrences(of: ">", with: "&gt;")
            .replacingOccurrences(of: "\"", with: "&quot;")
            .replacingOccurrences(of: "'", with: "&#39;")
    }
}
