import SwiftUI

struct PipelineView: View {
    let currentStage: Int
    let stageResults: [StageResult]
    let projectId: String

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(StageInfo.all, id: \.number) { info in
                    let result = stageResults.first { $0.stageNumber == info.number }
                    PipelineStageCard(
                        info: info,
                        status: result?.status,
                        isCurrent: info.number == currentStage
                    )
                }
            }
            .padding(.horizontal, 4)
        }
    }
}

struct PipelineStageCard: View {
    let info: StageInfo
    let status: StageStatus?
    let isCurrent: Bool

    var body: some View {
        VStack(spacing: 6) {
            ZStack {
                Circle()
                    .fill(backgroundColor)
                    .frame(width: 36, height: 36)

                if status == .approved {
                    Image(systemName: "checkmark")
                        .font(.caption.bold())
                        .foregroundStyle(.white)
                } else if status == .running {
                    ProgressView()
                        .scaleEffect(0.6)
                } else {
                    Text("\(info.number)")
                        .font(.caption.bold())
                        .foregroundStyle(isCurrent ? .white : .secondary)
                }
            }

            Text(info.name)
                .font(.system(size: 10))
                .foregroundStyle(isCurrent ? .primary : .secondary)
                .lineLimit(2)
                .multilineTextAlignment(.center)
                .frame(width: 64)
        }
        .frame(width: 72)
    }

    private var backgroundColor: Color {
        switch status {
        case .approved: return .green
        case .complete: return .blue
        case .running: return .orange
        default:
            return isCurrent ? .blue : Color(.systemGray5)
        }
    }
}
