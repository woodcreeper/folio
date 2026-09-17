import Foundation

/// Exercises the actual bundled JavaScript in JavaScriptCore without registering an extension.
@main
struct SmokeTest {
    static func main() throws {
        guard CommandLine.arguments.count == 2,
              let bundle = Bundle(path: CommandLine.arguments[1]) else {
            fatalError("Usage: FolioPreviewSmokeTest /path/to/FolioQuickLook.appex")
        }
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: directory) }
        let document = directory.appendingPathComponent("A & B.md")
        let markdown = """
        # Preview smoke test

        A **strong** result with Unicode: café, 日本語, 🦋.

        | Name | Result |
        | --- | --- |
        | Quick Look | Ready |

        - [x] Render task lists

        ```swift
        let greeting = "Hello"
        ```

        <script>alert('document script')</script>

        [Unsafe](javascript:alert(1))
        """
        try Data(markdown.utf8).write(to: document)
        let output = try MarkdownPreviewRenderer.renderDocument(at: document, resources: bundle)
        let html = String(decoding: output, as: UTF8.self)
        try require(html.contains("Preview smoke test") && html.contains("<strong>strong</strong>"), "Markdown did not render")
        try require(html.contains("<table>") && html.contains("日本語"), "Tables or Unicode were lost")
        try require(html.contains("<title>A &amp; B.md</title>"), "Document title was not escaped")
        try require(!html.contains("<script>"), "Raw document HTML was executable")
        try require(!html.contains("href=\"javascript:"), "An executable link survived rendering")
        try require(html.contains("default-src 'none'") && html.contains("img-src data:"), "Preview network policy is missing")

        let invalid = directory.appendingPathComponent("invalid.md")
        try Data([0xff, 0xfe, 0xfd]).write(to: invalid)
        do {
            _ = try MarkdownPreviewRenderer.renderDocument(at: invalid, resources: bundle)
            throw SmokeError.failed("Invalid UTF-8 was accepted")
        } catch PreviewError.invalidEncoding { }

        let oversized = directory.appendingPathComponent("large.md")
        try Data(repeating: 65, count: MarkdownPreviewRenderer.maximumDocumentBytes + 1).write(to: oversized)
        do {
            _ = try MarkdownPreviewRenderer.renderDocument(at: oversized, resources: bundle)
            throw SmokeError.failed("Oversized document was accepted")
        } catch PreviewError.documentTooLarge { }

        print("Quick Look smoke test passed: shared renderer, tables, Unicode, HTML safety, CSP, UTF-8 and size limits.")
    }

    static func require(_ condition: Bool, _ message: String) throws {
        if !condition { throw SmokeError.failed(message) }
    }

    enum SmokeError: Error { case failed(String) }
}
