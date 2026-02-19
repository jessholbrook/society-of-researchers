import SwiftUI

struct StatusBadge: View {
    let text: String
    let color: Color

    init(state: ProjectState) {
        switch state {
        case .draft:
            text = "Draft"
            color = .secondary
        case .inProgress:
            text = "In Progress"
            color = .blue
        case .complete:
            text = "Complete"
            color = .green
        }
    }

    init(stageStatus: StageStatus) {
        switch stageStatus {
        case .pending:
            text = "Pending"
            color = .secondary
        case .running:
            text = "Running"
            color = .orange
        case .complete:
            text = "Complete"
            color = .blue
        case .approved:
            text = "Approved"
            color = .green
        case .skipped:
            text = "Skipped"
            color = .secondary
        }
    }

    var body: some View {
        Text(text)
            .font(.caption2.bold())
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .foregroundStyle(color)
            .background(color.opacity(0.12), in: Capsule())
    }
}
