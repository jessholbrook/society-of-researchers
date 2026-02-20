import SwiftUI

struct AgentCardView: View {
    let agent: AgentConfig
    let onToggle: () -> Void
    let onEdit: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                AgentAvatarView(agentId: agent.id, size: 36)

                VStack(alignment: .leading, spacing: 2) {
                    Text(agent.name)
                        .font(.headline)
                    Text(agent.role)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Toggle("", isOn: Binding(
                    get: { agent.enabled },
                    set: { _ in onToggle() }
                ))
                .labelsHidden()
            }

            HStack(spacing: 12) {
                Label(String(format: "%.1f", agent.temperature), systemImage: "thermometer")
                    .font(.caption2)
                    .foregroundStyle(.secondary)

                if !agent.conflictPartners.isEmpty {
                    HStack(spacing: 4) {
                        Image(systemName: "bolt.fill")
                            .font(.caption2)
                        ForEach(agent.conflictPartners, id: \.self) { partner in
                            Text(partner)
                                .font(.caption2)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(.orange.opacity(0.15), in: Capsule())
                        }
                    }
                    .foregroundStyle(.orange)
                }
            }

            Button("Edit", action: onEdit)
                .font(.caption)
        }
        .padding(.vertical, 4)
        .opacity(agent.enabled ? 1.0 : 0.5)
    }
}
