import Foundation

@MainActor @Observable
final class StageViewModel {
    let projectId: String
    private(set) var stageNumber: Int

    var stageResult: StageResult?
    var isRunning = false
    var isApproving = false
    var isSavingOverride = false
    var error: String?

    // Override form
    var overrideContent = ""
    var overrideNotes = ""

    // Streaming state
    var activeAgents: Set<String> = []
    var streamingOutputs: [String: StreamingAgentOutput] = [:]

    // Tab selection
    var selectedTab: StageTab = .outputs

    private var streamTask: Task<Void, Never>?
    private let sseClient = SSEClient()

    init(projectId: String, stageNumber: Int, existingResult: StageResult?) {
        self.projectId = projectId
        self.stageNumber = stageNumber
        self.stageResult = existingResult

        if let override = existingResult?.humanOverride {
            self.overrideContent = override
        }
        if let notes = existingResult?.humanNotes, !notes.isEmpty {
            self.overrideNotes = notes
        }
    }

    // MARK: - Load

    func load() async {
        do {
            stageResult = try await APIClient.shared.getStageResult(projectId: projectId, stageNumber: stageNumber)
        } catch {
            self.error = error.localizedDescription
        }
    }

    // MARK: - Run Stage (SSE)

    func runStage() {
        guard !isRunning else { return }
        isRunning = true
        error = nil
        activeAgents = []
        streamingOutputs = [:]

        streamTask = Task { @MainActor in
            let task = await sseClient.stream(
                projectId: projectId,
                stageNumber: stageNumber
            ) { [weak self] event in
                self?.handleSSEEvent(event)
            }
            await task.value
            // Stream ended — refresh full result
            await self.load()
            self.isRunning = false
        }
    }

    private func handleSSEEvent(_ event: SSEEvent) {
        switch event.type {
        case .stageStart:
            isRunning = true

        case .agentStart:
            if let agentId = event.agentId, let name = event.agentName {
                activeAgents.insert(agentId)
                streamingOutputs[agentId] = StreamingAgentOutput(
                    agentId: agentId,
                    agentName: name,
                    status: .running
                )
            }

        case .agentComplete:
            if let agentId = event.agentId {
                activeAgents.remove(agentId)
                streamingOutputs[agentId]?.status = .complete
                streamingOutputs[agentId]?.content = event.content ?? ""
            }

        case .agentError:
            if let agentId = event.agentId {
                activeAgents.remove(agentId)
                streamingOutputs[agentId]?.status = .error
                streamingOutputs[agentId]?.error = event.error
            }

        case .conflictStart:
            break // Could show an indicator

        case .conflictComplete:
            // Conflict report arrives — we'll get the full data on stage_complete refresh
            break

        case .stageComplete:
            isRunning = false
        }
    }

    func cancelStream() {
        streamTask?.cancel()
        isRunning = false
    }

    // MARK: - Approve

    func approve() async -> ApproveResponse? {
        isApproving = true
        error = nil
        do {
            let response = try await APIClient.shared.approveStage(projectId: projectId, stageNumber: stageNumber)
            await load() // Refresh to get approved status
            isApproving = false

            // Auto-advance to next stage if not final
            if let nextStage = response.nextStage, response.complete != true {
                advanceToStage(nextStage)
            }

            return response
        } catch {
            self.error = error.localizedDescription
            isApproving = false
            return nil
        }
    }

    /// Reset state for the next stage (user initiates the run).
    func advanceToStage(_ next: Int) {
        stageNumber = next
        stageResult = nil
        overrideContent = ""
        overrideNotes = ""
        activeAgents = []
        streamingOutputs = [:]
        selectedTab = .outputs
        error = nil
    }

    // MARK: - Override

    func saveOverride() async {
        guard !overrideContent.isEmpty else { return }
        isSavingOverride = true
        error = nil
        do {
            _ = try await APIClient.shared.saveOverride(
                projectId: projectId,
                stageNumber: stageNumber,
                content: overrideContent,
                notes: overrideNotes
            )
            await load()
        } catch {
            self.error = error.localizedDescription
        }
        isSavingOverride = false
    }

    // MARK: - Computed

    var canRun: Bool {
        stageResult == nil || stageResult?.status == .pending
    }

    var canApprove: Bool {
        stageResult?.status == .complete
    }

    var isApproved: Bool {
        stageResult?.status == .approved
    }

    var stageName: String {
        StageInfo.name(for: stageNumber)
    }

    var stageDescription: String {
        StageInfo.description(for: stageNumber)
    }

    var allOutputs: [AgentOutput] {
        stageResult?.agentOutputs ?? []
    }

    var conflictReport: ConflictReport? {
        stageResult?.conflictReport
    }

    var isFinalStage: Bool {
        stageNumber == 6
    }
}

// MARK: - Supporting Types

enum StageTab: String, CaseIterable {
    case outputs = "Outputs"
    case debate = "Debate"
    case override = "Override"
}

struct StreamingAgentOutput: Identifiable {
    let agentId: String
    let agentName: String
    var status: StreamingStatus
    var content: String = ""
    var error: String?

    var id: String { agentId }

    enum StreamingStatus {
        case running, complete, error
    }
}
