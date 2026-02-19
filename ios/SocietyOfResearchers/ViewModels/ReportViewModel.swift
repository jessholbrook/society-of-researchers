import Foundation
import UIKit

@MainActor @Observable
final class ReportViewModel {
    let projectId: String
    let projectName: String

    var report: String?
    var isGenerating = false
    var error: String?

    init(projectId: String, projectName: String) {
        self.projectId = projectId
        self.projectName = projectName
    }

    func generateReport() async {
        isGenerating = true
        error = nil

        var backgroundTask = UIBackgroundTaskIdentifier.invalid
        backgroundTask = UIApplication.shared.beginBackgroundTask {
            // Cleanup on expiration
        }

        do {
            let response = try await APIClient.shared.generateReport(projectId: projectId)
            report = response.report
        } catch {
            self.error = error.localizedDescription
        }

        isGenerating = false
        if backgroundTask != .invalid {
            UIApplication.shared.endBackgroundTask(backgroundTask)
        }
    }
}
