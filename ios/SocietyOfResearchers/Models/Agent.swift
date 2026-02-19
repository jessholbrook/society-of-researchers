import Foundation

struct Claim: Codable, Sendable {
    let text: String
    var evidence: String = ""
    var confidence: Double = 0.0
    var source: String = ""
}

struct AgentConfig: Codable, Identifiable, Sendable {
    let id: String
    var name: String
    var role: String
    var perspective: String
    var systemPrompt: String
    var stage: Int
    var temperature: Double
    var model: String
    var conflictPartners: [String]
    var enabled: Bool
    var projectId: String?

    enum CodingKeys: String, CodingKey {
        case id, name, role, perspective, stage, temperature, model, enabled
        case systemPrompt = "system_prompt"
        case conflictPartners = "conflict_partners"
        case projectId = "project_id"
    }
}

struct AgentOutput: Codable, Identifiable, Sendable {
    let id: String
    let agentId: String
    let agentName: String
    let stage: Int
    let projectId: String
    var content: String
    var claims: [Claim]
    var status: String
    var error: String?
    var createdAt: String

    enum CodingKeys: String, CodingKey {
        case id, stage, content, claims, status, error
        case agentId = "agent_id"
        case agentName = "agent_name"
        case projectId = "project_id"
        case createdAt = "created_at"
    }
}

struct CreateAgentRequest: Encodable, Sendable {
    let name: String
    let role: String
    var perspective: String = ""
    let systemPrompt: String
    let stage: Int
    var temperature: Double = 0.7
    var conflictPartners: [String] = []
    var enabled: Bool = true
    var projectId: String?

    enum CodingKeys: String, CodingKey {
        case name, role, perspective, stage, temperature, enabled
        case systemPrompt = "system_prompt"
        case conflictPartners = "conflict_partners"
        case projectId = "project_id"
    }
}

struct UpdateAgentRequest: Encodable, Sendable {
    var name: String?
    var role: String?
    var perspective: String?
    var systemPrompt: String?
    var temperature: Double?
    var conflictPartners: [String]?
    var enabled: Bool?

    enum CodingKeys: String, CodingKey {
        case name, role, perspective, temperature, enabled
        case systemPrompt = "system_prompt"
        case conflictPartners = "conflict_partners"
    }
}
