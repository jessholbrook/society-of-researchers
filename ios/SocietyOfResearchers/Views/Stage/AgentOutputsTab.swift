import SwiftUI

struct AgentOutputsTab: View {
    let viewModel: StageViewModel

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                // Running header with bubble grid
                if viewModel.isRunning && !viewModel.streamingOutputs.isEmpty {
                    StageRunningHeader(viewModel: viewModel)
                }

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
        AgentAvatarView(agentId: output.agentId)
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
                AgentAvatarView(agentId: output.agentId)

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

// MARK: - Stage Running Header

struct StageRunningHeader: View {
    let viewModel: StageViewModel

    private var sortedOutputs: [StreamingAgentOutput] {
        Array(viewModel.streamingOutputs.values).sorted { $0.agentName < $1.agentName }
    }

    var body: some View {
        VStack(spacing: 12) {
            // Phase indicator
            HStack(spacing: 6) {
                if viewModel.isConflictDetecting {
                    Image(systemName: "waveform")
                        .foregroundStyle(.purple)
                    Text("Analyzing agreements...")
                        .font(.subheadline.bold())
                        .foregroundStyle(.purple)
                } else {
                    let runningCount = viewModel.activeAgents.count
                    Image(systemName: "brain")
                        .foregroundStyle(.orange)
                    Text("\(runningCount) agent\(runningCount == 1 ? "" : "s") working")
                        .font(.subheadline.bold())
                        .foregroundStyle(.primary)
                    PulsingDots()
                }
            }

            // Agent bubble grid
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: min(sortedOutputs.count, 6)), spacing: 12) {
                ForEach(sortedOutputs) { output in
                    AgentBubble(output: output)
                }
            }
        }
        .padding()
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Agent Bubble

private struct AgentBubble: View {
    let output: StreamingAgentOutput

    var body: some View {
        VStack(spacing: 4) {
            ZStack {
                AgentAvatarView(agentId: output.agentId, size: 40)

                switch output.status {
                case .running:
                    Circle()
                        .stroke(lineWidth: 2)
                        .foregroundStyle(.orange)
                        .frame(width: 48, height: 48)
                        .modifier(PulseRingModifier())

                case .complete:
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 14))
                        .foregroundStyle(.green)
                        .background(.white, in: Circle())
                        .offset(x: 14, y: 14)

                case .error:
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 14))
                        .foregroundStyle(.red)
                        .background(.white, in: Circle())
                        .offset(x: 14, y: 14)
                }
            }

            Text(shortName(output.agentName))
                .font(.caption2)
                .lineLimit(1)
                .foregroundStyle(.secondary)
        }
    }

    private func shortName(_ name: String) -> String {
        let words = name.split(separator: " ")
        return String(words.last ?? Substring(name))
    }
}

// MARK: - Pulsing Dots Animation

private struct PulsingDots: View {
    @State private var animating = false

    var body: some View {
        HStack(spacing: 3) {
            ForEach(0..<3, id: \.self) { index in
                Circle()
                    .fill(.orange)
                    .frame(width: 4, height: 4)
                    .opacity(animating ? 1.0 : 0.3)
                    .animation(
                        .easeInOut(duration: 0.6)
                            .repeatForever(autoreverses: true)
                            .delay(Double(index) * 0.2),
                        value: animating
                    )
            }
        }
        .onAppear { animating = true }
    }
}

// MARK: - Pulse Ring Modifier

private struct PulseRingModifier: ViewModifier {
    @State private var isPulsing = false

    func body(content: Content) -> some View {
        content
            .scaleEffect(isPulsing ? 1.15 : 1.0)
            .opacity(isPulsing ? 0.4 : 0.8)
            .animation(
                .easeInOut(duration: 1.0).repeatForever(autoreverses: true),
                value: isPulsing
            )
            .onAppear { isPulsing = true }
    }
}
