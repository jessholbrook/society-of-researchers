import SwiftUI

struct DebateTab: View {
    let viewModel: StageViewModel

    var body: some View {
        ScrollView {
            if let report = viewModel.conflictReport {
                VStack(alignment: .leading, spacing: 20) {
                    // Agreements
                    if !report.agreements.isEmpty {
                        debateSection(
                            title: "Agreements",
                            icon: "checkmark.circle.fill",
                            color: .green,
                            count: report.agreements.count
                        ) {
                            ForEach(report.agreements) { agreement in
                                AgreementCard(agreement: agreement)
                            }
                        }
                    }

                    // Disagreements
                    if !report.disagreements.isEmpty {
                        debateSection(
                            title: "Disagreements",
                            icon: "xmark.circle.fill",
                            color: .red,
                            count: report.disagreements.count
                        ) {
                            ForEach(report.disagreements) { disagreement in
                                DisagreementCard(disagreement: disagreement)
                            }
                        }
                    }

                    // Unresolved Tensions
                    if !report.unresolvedTensions.isEmpty {
                        debateSection(
                            title: "Unresolved Tensions",
                            icon: "exclamationmark.triangle.fill",
                            color: .orange,
                            count: report.unresolvedTensions.count
                        ) {
                            ForEach(report.unresolvedTensions, id: \.self) { tension in
                                Text(tension)
                                    .font(.body)
                                    .padding()
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .background(.orange.opacity(0.1), in: RoundedRectangle(cornerRadius: 8))
                            }
                        }
                    }

                    // Within-Agent Contradictions
                    if !report.withinAgentContradictions.isEmpty {
                        debateSection(
                            title: "Self-Contradictions",
                            icon: "arrow.triangle.2.circlepath",
                            color: .purple,
                            count: report.withinAgentContradictions.count
                        ) {
                            ForEach(report.withinAgentContradictions, id: \.self) { contradiction in
                                Text(contradiction)
                                    .font(.body)
                                    .padding()
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .background(.purple.opacity(0.1), in: RoundedRectangle(cornerRadius: 8))
                            }
                        }
                    }

                    // Evidence Chain Breaks
                    if !report.evidenceChainBreaks.isEmpty {
                        debateSection(
                            title: "Evidence Gaps",
                            icon: "link.badge.plus",
                            color: .pink,
                            count: report.evidenceChainBreaks.count
                        ) {
                            ForEach(report.evidenceChainBreaks, id: \.self) { gap in
                                Text(gap)
                                    .font(.body)
                                    .padding()
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .background(.pink.opacity(0.1), in: RoundedRectangle(cornerRadius: 8))
                            }
                        }
                    }

                    // Synthesis
                    if !report.synthesis.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Label("Synthesis", systemImage: "sparkles")
                                .font(.headline)
                                .foregroundStyle(.indigo)

                            Text(report.synthesis)
                                .font(.body)
                                .padding()
                                .background(.indigo.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
                        }
                    }
                }
                .padding()
            } else if viewModel.isRunning {
                VStack(spacing: 12) {
                    ProgressView()
                    Text("Analyzing agent outputs...")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .padding(.top, 60)
            } else {
                ContentUnavailableView(
                    "No Debate Data",
                    systemImage: "bubble.left.and.bubble.right",
                    description: Text("Run the stage to see agreements and disagreements between agents.")
                )
            }
        }
    }

    private func debateSection<Content: View>(
        title: String,
        icon: String,
        color: Color,
        count: Int,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Label(title, systemImage: icon)
                    .font(.headline)
                    .foregroundStyle(color)
                Spacer()
                Text("\(count)")
                    .font(.caption)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(color.opacity(0.2), in: Capsule())
            }
            content()
        }
    }
}

// MARK: - Agreement Card

struct AgreementCard: View {
    let agreement: AgreementPoint

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(agreement.topic)
                .font(.subheadline.bold())

            Text(agreement.summary)
                .font(.body)
                .foregroundStyle(.secondary)

            if !agreement.supportingAgents.isEmpty {
                FlowLayout(spacing: 6) {
                    ForEach(agreement.supportingAgents, id: \.self) { agent in
                        Text(agent)
                            .font(.caption2)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(.green.opacity(0.15), in: Capsule())
                    }
                }
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.green.opacity(0.05), in: RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Disagreement Card

struct DisagreementCard: View {
    let disagreement: DisagreementPoint

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(disagreement.topic)
                .font(.subheadline.bold())

            Text(disagreement.summary)
                .font(.body)
                .foregroundStyle(.secondary)

            ForEach(disagreement.positions, id: \.agentName) { position in
                HStack(alignment: .top, spacing: 8) {
                    Text(position.agentName)
                        .font(.caption.bold())
                        .frame(width: 80, alignment: .trailing)

                    VStack(alignment: .leading, spacing: 2) {
                        Text(position.position)
                            .font(.caption)

                        if position.confidence > 0 {
                            HStack(spacing: 4) {
                                ProgressView(value: position.confidence, total: 1.0)
                                    .frame(width: 60)
                                Text("\(Int(position.confidence * 100))%")
                                    .font(.caption2)
                                    .foregroundStyle(.tertiary)
                            }
                        }
                    }
                }
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.red.opacity(0.05), in: RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Flow Layout

struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = layout(proposal: proposal, subviews: subviews)
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = layout(proposal: proposal, subviews: subviews)
        for (index, position) in result.positions.enumerated() {
            subviews[index].place(at: CGPoint(x: bounds.minX + position.x, y: bounds.minY + position.y), proposal: .unspecified)
        }
    }

    private func layout(proposal: ProposedViewSize, subviews: Subviews) -> (size: CGSize, positions: [CGPoint]) {
        let maxWidth = proposal.width ?? .infinity
        var positions: [CGPoint] = []
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > maxWidth && x > 0 {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }
            positions.append(CGPoint(x: x, y: y))
            rowHeight = max(rowHeight, size.height)
            x += size.width + spacing
        }

        return (CGSize(width: maxWidth, height: y + rowHeight), positions)
    }
}
