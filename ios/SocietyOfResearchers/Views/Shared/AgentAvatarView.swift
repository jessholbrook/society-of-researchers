import SwiftUI

struct AgentAvatarView: View {
    let agentId: String
    var size: CGFloat = 32

    var body: some View {
        Image(systemName: symbolName)
            .font(.system(size: size * 0.45))
            .foregroundStyle(.white)
            .frame(width: size, height: size)
            .background(avatarColor, in: Circle())
    }

    private var symbolName: String {
        let base = parseBaseId(agentId)
        return Self.agentSymbols[base] ?? "person.fill"
    }

    private var avatarColor: Color {
        let base = parseBaseId(agentId)
        if let index = Self.orderedKeys.firstIndex(of: base) {
            return Self.palette[index % Self.palette.count]
        }
        let colors: [Color] = [.blue, .purple, .orange, .teal, .pink, .indigo, .mint, .cyan]
        return colors[abs(agentId.hashValue) % colors.count]
    }

    /// Agent IDs follow the pattern `{base_id}-{project_hash}`.
    /// Parse the base ID by matching known prefixes.
    private func parseBaseId(_ id: String) -> String {
        for key in Self.orderedKeys {
            if id.hasPrefix(key) {
                return key
            }
        }
        return id
    }

    // MARK: - Mappings

    private static let agentSymbols: [String: String] = [
        "scoper": "magnifyingglass.circle.fill",
        "expander": "arrow.up.left.and.arrow.down.right.circle.fill",
        "stakeholder-mapper": "person.3.fill",
        "archivist": "books.vertical.fill",
        "fieldworker": "figure.walk.circle.fill",
        "quantifier": "chart.bar.fill",
        "skeptic": "exclamationmark.triangle.fill",
        "pattern-finder": "link.circle.fill",
        "connector": "link.circle.fill",
        "devils-advocate": "flame.fill",
        "contrarian": "flame.fill",
        "historian": "clock.fill",
        "futurist": "sparkles",
        "ethicist": "scale.balanced.fill",
        "methodologist": "gearshape.2.fill",
        "outsider": "eye.fill",
        "strategist": "target",
        "visualizer": "chart.pie.fill",
        "solution-sketcher": "lightbulb.fill",
        "experiment-designer": "flask.fill",
    ]

    // Ordered longest-first so prefix matching picks the most specific match
    private static let orderedKeys: [String] = agentSymbols.keys.sorted { $0.count > $1.count }

    private static let palette: [Color] = [
        .blue, .purple, .orange, .teal, .pink, .indigo, .mint, .cyan,
        .red, .green, .brown, .yellow,
    ]
}
