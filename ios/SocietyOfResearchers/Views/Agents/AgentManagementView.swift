import SwiftUI

struct AgentManagementView: View {
    @State private var viewModel: AgentManagementViewModel
    @State private var showCreateSheet = false
    @State private var editingAgent: AgentConfig?

    init(projectId: String) {
        _viewModel = State(initialValue: AgentManagementViewModel(projectId: projectId))
    }

    var body: some View {
        Group {
            if viewModel.isLoading && viewModel.agents.isEmpty {
                ProgressView("Loading agents...")
            } else {
                List {
                    ForEach(viewModel.agentsByStage, id: \.stage) { group in
                        Section {
                            ForEach(group.agents) { agent in
                                AgentCardView(
                                    agent: agent,
                                    onToggle: {
                                        Task { await viewModel.toggleAgent(agent) }
                                    },
                                    onEdit: {
                                        editingAgent = agent
                                    }
                                )
                                .swipeActions(edge: .trailing) {
                                    Button(role: .destructive) {
                                        Task { await viewModel.deleteAgent(agent) }
                                    } label: {
                                        Label("Delete", systemImage: "trash")
                                    }
                                }
                            }
                        } header: {
                            Text("Stage \(group.stage): \(StageInfo.name(for: group.stage))")
                        }
                    }
                }
                .refreshable {
                    await viewModel.loadAgents()
                }
            }
        }
        .navigationTitle("Agents")
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button {
                    showCreateSheet = true
                } label: {
                    Image(systemName: "plus")
                }
            }
        }
        .sheet(isPresented: $showCreateSheet) {
            AgentFormView(projectId: viewModel.projectId) { req in
                await viewModel.createAgent(req)
            }
        }
        .sheet(item: $editingAgent) { agent in
            AgentFormView(projectId: viewModel.projectId, editing: agent) { req in
                let update = UpdateAgentRequest(
                    name: req.name,
                    role: req.role,
                    perspective: req.perspective,
                    systemPrompt: req.systemPrompt,
                    temperature: req.temperature,
                    conflictPartners: req.conflictPartners,
                    enabled: req.enabled
                )
                await viewModel.updateAgent(id: agent.id, update)
            }
        }
        .overlay {
            if let error = viewModel.error {
                ErrorBanner(message: error) {
                    viewModel.error = nil
                }
            }
        }
        .task {
            await viewModel.loadAgents()
        }
    }
}

extension AgentConfig: Hashable {
    static func == (lhs: AgentConfig, rhs: AgentConfig) -> Bool {
        lhs.id == rhs.id
    }

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}
