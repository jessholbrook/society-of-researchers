import SwiftUI

struct MarkdownRenderer: View {
    let markdown: String

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            ForEach(Array(parseBlocks().enumerated()), id: \.offset) { _, block in
                renderBlock(block)
            }
        }
    }

    // MARK: - Block Types

    private enum MarkdownBlock {
        case heading(level: Int, text: String)
        case paragraph(text: String)
        case bullet(text: String)
        case numbered(index: Int, text: String)
        case blockquote(text: String)
        case horizontalRule
        case codeBlock(text: String)
    }

    // MARK: - Parsing

    private func parseBlocks() -> [MarkdownBlock] {
        var blocks: [MarkdownBlock] = []
        var lines = markdown.components(separatedBy: "\n")
        var i = 0
        var paragraphBuffer: [String] = []

        func flushParagraph() {
            if !paragraphBuffer.isEmpty {
                blocks.append(.paragraph(text: paragraphBuffer.joined(separator: " ")))
                paragraphBuffer = []
            }
        }

        while i < lines.count {
            let line = lines[i]
            let trimmed = line.trimmingCharacters(in: .whitespaces)

            // Empty line
            if trimmed.isEmpty {
                flushParagraph()
                i += 1
                continue
            }

            // Code block
            if trimmed.hasPrefix("```") {
                flushParagraph()
                var codeLines: [String] = []
                i += 1
                while i < lines.count && !lines[i].trimmingCharacters(in: .whitespaces).hasPrefix("```") {
                    codeLines.append(lines[i])
                    i += 1
                }
                blocks.append(.codeBlock(text: codeLines.joined(separator: "\n")))
                i += 1 // skip closing ```
                continue
            }

            // Headings
            if trimmed.hasPrefix("###") {
                flushParagraph()
                blocks.append(.heading(level: 3, text: String(trimmed.dropFirst(3)).trimmingCharacters(in: .whitespaces)))
                i += 1
                continue
            }
            if trimmed.hasPrefix("##") {
                flushParagraph()
                blocks.append(.heading(level: 2, text: String(trimmed.dropFirst(2)).trimmingCharacters(in: .whitespaces)))
                i += 1
                continue
            }
            if trimmed.hasPrefix("#") {
                flushParagraph()
                blocks.append(.heading(level: 1, text: String(trimmed.dropFirst(1)).trimmingCharacters(in: .whitespaces)))
                i += 1
                continue
            }

            // Horizontal rule
            if trimmed == "---" || trimmed == "***" || trimmed == "___" {
                flushParagraph()
                blocks.append(.horizontalRule)
                i += 1
                continue
            }

            // Bullet list
            if trimmed.hasPrefix("- ") || trimmed.hasPrefix("* ") {
                flushParagraph()
                let text = String(trimmed.dropFirst(2))
                blocks.append(.bullet(text: text))
                i += 1
                continue
            }

            // Numbered list
            if let match = trimmed.firstMatch(of: /^(\d+)\.\s+(.+)/) {
                flushParagraph()
                let num = Int(match.1) ?? 1
                blocks.append(.numbered(index: num, text: String(match.2)))
                i += 1
                continue
            }

            // Blockquote
            if trimmed.hasPrefix(">") {
                flushParagraph()
                let text = String(trimmed.dropFirst(1)).trimmingCharacters(in: .whitespaces)
                blocks.append(.blockquote(text: text))
                i += 1
                continue
            }

            // Regular text → paragraph buffer
            paragraphBuffer.append(trimmed)
            i += 1
        }

        flushParagraph()
        return blocks
    }

    // MARK: - Rendering

    @ViewBuilder
    private func renderBlock(_ block: MarkdownBlock) -> some View {
        switch block {
        case .heading(let level, let text):
            switch level {
            case 1:
                Text(inlineMarkdown(text))
                    .font(.title.bold())
                    .padding(.top, 8)
            case 2:
                Text(inlineMarkdown(text))
                    .font(.title2.bold())
                    .padding(.top, 6)
            default:
                Text(inlineMarkdown(text))
                    .font(.title3.bold())
                    .padding(.top, 4)
            }

        case .paragraph(let text):
            Text(inlineMarkdown(text))
                .font(.body)

        case .bullet(let text):
            HStack(alignment: .top, spacing: 8) {
                Text("\u{2022}")
                    .font(.body)
                    .foregroundStyle(.secondary)
                Text(inlineMarkdown(text))
                    .font(.body)
            }
            .padding(.leading, 8)

        case .numbered(let index, let text):
            HStack(alignment: .top, spacing: 8) {
                Text("\(index).")
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .frame(width: 24, alignment: .trailing)
                Text(inlineMarkdown(text))
                    .font(.body)
            }
            .padding(.leading, 8)

        case .blockquote(let text):
            HStack(spacing: 0) {
                RoundedRectangle(cornerRadius: 1)
                    .fill(.secondary.opacity(0.4))
                    .frame(width: 3)
                Text(inlineMarkdown(text))
                    .font(.body.italic())
                    .foregroundStyle(.secondary)
                    .padding(.leading, 12)
            }
            .padding(.vertical, 4)

        case .horizontalRule:
            Divider()
                .padding(.vertical, 8)

        case .codeBlock(let text):
            Text(text)
                .font(.system(.caption, design: .monospaced))
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 8))
        }
    }

    private func inlineMarkdown(_ text: String) -> AttributedString {
        (try? AttributedString(markdown: text, options: .init(interpretedSyntax: .inlineOnlyPreservingWhitespace))) ?? AttributedString(text)
    }
}
