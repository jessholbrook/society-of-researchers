import Foundation

enum StageStatus: String, Codable, Sendable {
    case pending
    case running
    case complete
    case approved
    case skipped
}

struct StageResult: Codable, Identifiable, Sendable {
    let id: String
    let projectId: String
    let stageNumber: Int
    var status: StageStatus
    var agentOutputs: [AgentOutput]
    var conflictReport: ConflictReport?
    var humanOverride: String?
    var humanNotes: String
    var approvedAt: String?
    var createdAt: String

    enum CodingKeys: String, CodingKey {
        case id, status
        case projectId = "project_id"
        case stageNumber = "stage_number"
        case agentOutputs = "agent_outputs"
        case conflictReport = "conflict_report"
        case humanOverride = "human_override"
        case humanNotes = "human_notes"
        case approvedAt = "approved_at"
        case createdAt = "created_at"
    }
}

struct StageInfo: Sendable {
    let number: Int
    let name: String
    let description: String

    static let all: [StageInfo] = [
        StageInfo(number: 1, name: "Problem Framing", description: "Define the research question, scope, and stakeholder landscape."),
        StageInfo(number: 2, name: "Evidence Gathering", description: "Identify and gather evidence from multiple sources."),
        StageInfo(number: 3, name: "Analysis & Interpretation", description: "Analyze evidence through multiple lenses, surface patterns and conflicts."),
        StageInfo(number: 4, name: "Insight Synthesis", description: "Synthesize findings into actionable insights with confidence levels."),
        StageInfo(number: 5, name: "Communication", description: "Generate tailored deliverables for different audiences."),
        StageInfo(number: 6, name: "Prototype & Intervention Design", description: "Design interventions and prototypes grounded in research findings."),
    ]

    static func name(for number: Int) -> String {
        all.first { $0.number == number }?.name ?? "Stage \(number)"
    }

    static func description(for number: Int) -> String {
        all.first { $0.number == number }?.description ?? ""
    }
}

struct ApproveResponse: Decodable, Sendable {
    let ok: Bool
    var complete: Bool?
    var nextStage: Int?

    enum CodingKeys: String, CodingKey {
        case ok, complete
        case nextStage = "next_stage"
    }
}

struct OverrideRequest: Encodable, Sendable {
    let content: String
    var notes: String = ""
}
