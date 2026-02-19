import Foundation

@MainActor @Observable
final class ProjectListViewModel {
    var projects: [Project] = []
    var isLoading = false
    var error: String?

    func loadProjects() async {
        isLoading = true
        error = nil
        do {
            projects = try await APIClient.shared.listProjects()
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }

    func deleteProject(at offsets: IndexSet) {
        let toDelete = offsets.map { projects[$0] }
        projects.remove(atOffsets: offsets)

        Task {
            for project in toDelete {
                try? await APIClient.shared.deleteProject(id: project.id)
            }
        }
    }

    func createProject(name: String, question: String, context: String) async -> Project? {
        do {
            let req = CreateProjectRequest(name: name, researchQuestion: question, context: context)
            let project = try await APIClient.shared.createProject(req)
            projects.insert(project, at: 0)
            return project
        } catch {
            self.error = error.localizedDescription
            return nil
        }
    }
}
