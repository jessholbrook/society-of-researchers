import Foundation

@MainActor @Observable
final class AgentManagementViewModel {
    let projectId: String

    var agents: [AgentConfig] = []
    var isLoading = false
    var error: String?

    init(projectId: String) {
        self.projectId = projectId
    }

    func loadAgents() async {
        isLoading = true
        error = nil
        do {
            agents = try await APIClient.shared.listAgents(projectId: projectId)
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }

    var agentsByStage: [(stage: Int, agents: [AgentConfig])] {
        let grouped = Dictionary(grouping: agents) { $0.stage }
        return (1...6).compactMap { stage in
            guard let stageAgents = grouped[stage], !stageAgents.isEmpty else { return nil }
            return (stage: stage, agents: stageAgents)
        }
    }

    func toggleAgent(_ agent: AgentConfig) async {
        do {
            let response = try await APIClient.shared.toggleAgent(id: agent.id)
            if let index = agents.firstIndex(where: { $0.id == agent.id }) {
                agents[index].enabled = response.enabled
            }
        } catch {
            self.error = error.localizedDescription
        }
    }

    func deleteAgent(_ agent: AgentConfig) async {
        do {
            _ = try await APIClient.shared.deleteAgent(id: agent.id)
            agents.removeAll { $0.id == agent.id }
        } catch {
            self.error = error.localizedDescription
        }
    }

    func createAgent(_ req: CreateAgentRequest) async {
        do {
            let agent = try await APIClient.shared.createAgent(req)
            agents.append(agent)
        } catch {
            self.error = error.localizedDescription
        }
    }

    func updateAgent(id: String, _ req: UpdateAgentRequest) async {
        do {
            _ = try await APIClient.shared.updateAgent(id: id, req)
            await loadAgents()
        } catch {
            self.error = error.localizedDescription
        }
    }
}
