import Foundation

enum ProjectState: String, Codable, Sendable {
    case draft
    case inProgress = "in_progress"
    case complete
}

struct Project: Codable, Identifiable, Sendable {
    let id: String
    var name: String
    var researchQuestion: String
    var context: String
    var state: ProjectState
    var currentStage: Int
    var stageResults: [StageResult]
    var createdAt: String
    var updatedAt: String

    enum CodingKeys: String, CodingKey {
        case id, name, context, state
        case researchQuestion = "research_question"
        case currentStage = "current_stage"
        case stageResults = "stage_results"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

struct CreateProjectRequest: Encodable, Sendable {
    let name: String
    let researchQuestion: String
    var context: String = ""

    enum CodingKeys: String, CodingKey {
        case name, context
        case researchQuestion = "research_question"
    }
}

struct UpdateProjectRequest: Encodable, Sendable {
    var name: String?
    var researchQuestion: String?
    var context: String?

    enum CodingKeys: String, CodingKey {
        case name, context
        case researchQuestion = "research_question"
    }
}
