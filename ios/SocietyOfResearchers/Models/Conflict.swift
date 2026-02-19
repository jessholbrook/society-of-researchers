import Foundation

struct AgentPosition: Codable, Sendable {
    let agentName: String
    let position: String
    var evidence: String = ""
    var confidence: Double = 0.0

    enum CodingKeys: String, CodingKey {
        case position, evidence, confidence
        case agentName = "agent_name"
    }
}

struct AgreementPoint: Codable, Identifiable, Sendable {
    let topic: String
    let summary: String
    var supportingAgents: [String] = []
    var evidence: [String] = []

    var id: String { topic }

    enum CodingKeys: String, CodingKey {
        case topic, summary, evidence
        case supportingAgents = "supporting_agents"
    }
}

struct DisagreementPoint: Codable, Identifiable, Sendable {
    let topic: String
    let summary: String
    var positions: [AgentPosition] = []

    var id: String { topic }
}

struct ConflictReport: Codable, Sendable {
    let stage: Int
    var agreements: [AgreementPoint] = []
    var disagreements: [DisagreementPoint] = []
    var unresolvedTensions: [String] = []
    var synthesis: String = ""

    enum CodingKeys: String, CodingKey {
        case stage, agreements, disagreements, synthesis
        case unresolvedTensions = "unresolved_tensions"
    }
}
