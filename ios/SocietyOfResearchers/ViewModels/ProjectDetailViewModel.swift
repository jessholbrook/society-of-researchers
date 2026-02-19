import Foundation

@MainActor @Observable
final class ProjectDetailViewModel {
    var project: Project
    var isLoading = false
    var error: String?

    init(project: Project) {
        self.project = project
    }

    func refresh() async {
        isLoading = true
        error = nil
        do {
            project = try await APIClient.shared.getProject(id: project.id)
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }

    func stageResult(for number: Int) -> StageResult? {
        project.stageResults.first { $0.stageNumber == number }
    }

    var isComplete: Bool {
        project.state == .complete
    }

    var hasReport: Bool {
        isComplete
    }

    var completedStages: [StageResult] {
        project.stageResults
            .filter { $0.status == .approved || $0.status == .complete }
            .sorted { $0.stageNumber < $1.stageNumber }
    }

    var currentStageInfo: StageInfo? {
        guard !isComplete else { return nil }
        return StageInfo.all.first { $0.number == project.currentStage }
    }
}
