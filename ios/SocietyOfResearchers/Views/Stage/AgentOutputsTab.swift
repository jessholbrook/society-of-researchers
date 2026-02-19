import SwiftUI

struct AgentOutputsTab: View {
    let viewModel: StageViewModel

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                // Streaming outputs (during run)
                if viewModel.isRunning || !viewModel.streamingOutputs.isEmpty {
                    ForEach(Array(viewModel.streamingOutputs.values).sorted(by: { $0.agentName < $1.agentName })) { output in
                        StreamingAgentCard(output: output)
                    }
                }

                // Persisted outputs (after run)
                if !viewModel.isRunning && !viewModel.allOutputs.isEmpty {
                    ForEach(viewModel.allOutputs) { output in
                        AgentOutputCard(output: output)
                    }
                }

                if !viewModel.isRunning && viewModel.allOutputs.isEmpty && viewModel.streamingOutputs.isEmpty {
                    ContentUnavailableView(
                        "No Outputs",
                        systemImage: "text.bubble",
                        description: Text("Run this stage to see agent outputs.")
                    )
                }
            }
            .padding()
        }
    }
}

// MARK: - Agent Output Card (persisted)

struct AgentOutputCard: View {
    let output: AgentOutput
    @State private var isExpanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                agentAvatar
                VStack(alignment: .leading) {
                    Text(output.agentName)
                        .font(.headline)
                    Text(output.status.capitalized)
                        .font(.caption)
                        .foregroundStyle(statusColor)
                }
                Spacer()

                if output.status == "error" {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundStyle(.red)
                }

                Button {
                    withAnimation { isExpanded.toggle() }
                } label: {
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .foregroundStyle(.secondary)
                }
            }

            if let error = output.error {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
                    .padding(8)
                    .background(.red.opacity(0.1), in: RoundedRectangle(cornerRadius: 8))
            }

            if isExpanded && !output.content.isEmpty {
                Text(output.content)
                    .font(.body)
                    .padding(.top, 4)
            } else if !output.content.isEmpty {
                Text(output.content)
                    .font(.body)
                    .lineLimit(4)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 12))
    }

    private var agentAvatar: some View {
        Text(String(output.agentName.prefix(1)).uppercased())
            .font(.caption.bold())
            .foregroundStyle(.white)
            .frame(width: 32, height: 32)
            .background(avatarColor, in: Circle())
    }

    private var avatarColor: Color {
        let colors: [Color] = [.blue, .purple, .orange, .teal, .pink, .indigo, .mint, .cyan]
        let index = abs(output.agentName.hashValue) % colors.count
        return colors[index]
    }

    private var statusColor: Color {
        switch output.status {
        case "complete": return .green
        case "error": return .red
        case "running": return .orange
        default: return .secondary
        }
    }
}

// MARK: - Streaming Agent Card

struct StreamingAgentCard: View {
    let output: StreamingAgentOutput

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(String(output.agentName.prefix(1)).uppercased())
                    .font(.caption.bold())
                    .foregroundStyle(.white)
                    .frame(width: 32, height: 32)
                    .background(.blue, in: Circle())

                Text(output.agentName)
                    .font(.headline)

                Spacer()

                switch output.status {
                case .running:
                    ProgressView()
                        .scaleEffect(0.8)
                case .complete:
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(.green)
                case .error:
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(.red)
                }
            }

            if !output.content.isEmpty {
                Text(output.content)
                    .font(.body)
                    .lineLimit(4)
                    .foregroundStyle(.secondary)
            }

            if let error = output.error {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 12))
    }
}
