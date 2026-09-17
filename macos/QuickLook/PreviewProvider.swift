import Cocoa
import Quartz
import UniformTypeIdentifiers

/// Finder owns this process; the desktop application does not need to be running.
final class PreviewProvider: QLPreviewProvider, QLPreviewingController {
    func providePreview(for request: QLFilePreviewRequest) async throws -> QLPreviewReply {
        let fileURL = request.fileURL
        let resources = Bundle(for: PreviewProvider.self)

        // Quick Look schedules the expensive work inside this closure.
        return QLPreviewReply(dataOfContentType: .html, contentSize: CGSize(width: 820, height: 900)) { reply in
            reply.stringEncoding = .utf8
            reply.title = fileURL.lastPathComponent
            return try MarkdownPreviewRenderer.renderDocument(at: fileURL, resources: resources)
        }
    }
}
