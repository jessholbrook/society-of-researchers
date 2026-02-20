import Foundation

actor APIClient {
    static let shared = APIClient()

    private let baseURL = Configuration.baseURL
    private let session: URLSession
    private let encoder: JSONEncoder
    private let decoder: JSONDecoder

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 300 // Report generation can take ~2 min
        config.timeoutIntervalForResource = 300
        session = URLSession(configuration: config)

        encoder = JSONEncoder()
        decoder = JSONDecoder()
    }

    // MARK: - Generic HTTP Methods

    private func request<T: Decodable>(_ method: String, path: String, body: (any Encodable)? = nil) async throws -> T {
        guard let url = URL(string: baseURL.absoluteString + path) else {
            throw APIError.invalidResponse
        }
        var req = URLRequest(url: url)
        req.httpMethod = method

        if let body {
            req.httpBody = try encoder.encode(AnyEncodable(body))
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }

        let (data, response) = try await session.data(for: req)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            let detail = (try? JSONDecoder().decode(ErrorDetail.self, from: data))?.detail
            throw APIError.httpError(statusCode: httpResponse.statusCode, detail: detail)
        }

        return try decoder.decode(T.self, from: data)
    }

    private func get<T: Decodable>(path: String) async throws -> T {
        try await request("GET", path: path)
    }

    private func post<T: Decodable>(path: String, body: (any Encodable)? = nil) async throws -> T {
        try await request("POST", path: path, body: body)
    }

    private func put<T: Decodable>(path: String, body: (any Encodable)? = nil) async throws -> T {
        try await request("PUT", path: path, body: body)
    }

    private func delete<T: Decodable>(path: String) async throws -> T {
        try await request("DELETE", path: path)
    }

    // MARK: - Health

    struct HealthResponse: Decodable {
        let status: String
        let hasApiKey: Bool
        enum CodingKeys: String, CodingKey {
            case status
            case hasApiKey = "has_api_key"
        }
    }

    func health() async throws -> HealthResponse {
        try await get(path: "/api/health")
    }

    // MARK: - Projects

    func listProjects() async throws -> [Project] {
        try await get(path: "/api/projects")
    }

    func getProject(id: String) async throws -> Project {
        try await get(path: "/api/projects/\(id)")
    }

    func createProject(_ req: CreateProjectRequest) async throws -> Project {
        try await post(path: "/api/projects", body: req)
    }

    func updateProject(id: String, _ req: UpdateProjectRequest) async throws -> OkResponse {
        try await put(path: "/api/projects/\(id)", body: req)
    }

    func deleteProject(id: String) async throws -> OkResponse {
        try await delete(path: "/api/projects/\(id)")
    }

    // MARK: - Stages

    func listStageResults(projectId: String) async throws -> [StageResult] {
        try await get(path: "/api/projects/\(projectId)/stages")
    }

    func getStageResult(projectId: String, stageNumber: Int) async throws -> StageResult? {
        try await get(path: "/api/projects/\(projectId)/stages/\(stageNumber)")
    }

    func approveStage(projectId: String, stageNumber: Int) async throws -> ApproveResponse {
        try await post(path: "/api/projects/\(projectId)/stages/\(stageNumber)/approve")
    }

    func saveOverride(projectId: String, stageNumber: Int, content: String, notes: String = "") async throws -> OkResponse {
        try await put(path: "/api/projects/\(projectId)/stages/\(stageNumber)/override", body: OverrideRequest(content: content, notes: notes))
    }

    // MARK: - Agents

    func listAgents(stage: Int? = nil, projectId: String? = nil) async throws -> [AgentConfig] {
        var path = "/api/agents"
        var params: [String] = []
        if let stage { params.append("stage=\(stage)") }
        if let projectId { params.append("project_id=\(projectId)") }
        if !params.isEmpty { path += "?" + params.joined(separator: "&") }
        return try await get(path: path)
    }

    func getAgent(id: String) async throws -> AgentConfig {
        try await get(path: "/api/agents/\(id)")
    }

    func createAgent(_ req: CreateAgentRequest) async throws -> AgentConfig {
        try await post(path: "/api/agents", body: req)
    }

    func updateAgent(id: String, _ req: UpdateAgentRequest) async throws -> OkResponse {
        try await put(path: "/api/agents/\(id)", body: req)
    }

    func deleteAgent(id: String) async throws -> OkResponse {
        try await delete(path: "/api/agents/\(id)")
    }

    func toggleAgent(id: String) async throws -> ToggleResponse {
        try await post(path: "/api/agents/\(id)/toggle")
    }

    // MARK: - Documents

    func listDocuments(projectId: String) async throws -> [DocumentResponse] {
        try await get(path: "/api/projects/\(projectId)/documents")
    }

    func uploadDocument(projectId: String, fileData: Data, filename: String, contentType: String) async throws -> DocumentResponse {
        guard let url = URL(string: baseURL.absoluteString + "/api/projects/\(projectId)/documents") else {
            throw APIError.invalidResponse
        }

        let boundary = "Boundary-\(UUID().uuidString)"
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var body = Data()
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"\(filename)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: \(contentType)\r\n\r\n".data(using: .utf8)!)
        body.append(fileData)
        body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)
        req.httpBody = body

        let (data, response) = try await session.data(for: req)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        guard (200...299).contains(httpResponse.statusCode) else {
            let detail = (try? JSONDecoder().decode(ErrorDetail.self, from: data))?.detail
            throw APIError.httpError(statusCode: httpResponse.statusCode, detail: detail)
        }
        return try decoder.decode(DocumentResponse.self, from: data)
    }

    func deleteDocument(projectId: String, docId: String) async throws -> OkResponse {
        try await delete(path: "/api/projects/\(projectId)/documents/\(docId)")
    }

    // MARK: - Report

    struct ReportResponse: Decodable {
        let ok: Bool
        let report: String
    }

    func generateReport(projectId: String) async throws -> ReportResponse {
        try await post(path: "/api/projects/\(projectId)/report")
    }
}

// MARK: - Supporting Types

struct OkResponse: Decodable {
    let ok: Bool
}

struct ToggleResponse: Decodable {
    let ok: Bool
    let enabled: Bool
}

struct ErrorDetail: Decodable {
    let detail: String?
}

struct DocumentResponse: Codable, Identifiable, Sendable {
    let id: String
    let projectId: String?
    let filename: String
    let contentType: String?
    let textLength: Int?
    let createdAt: String?

    enum CodingKeys: String, CodingKey {
        case id, filename
        case projectId = "project_id"
        case contentType = "content_type"
        case textLength = "text_length"
        case createdAt = "created_at"
    }
}

enum APIError: LocalizedError {
    case invalidResponse
    case httpError(statusCode: Int, detail: String?)

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "Invalid server response"
        case .httpError(let code, let detail):
            return detail ?? "HTTP error \(code)"
        }
    }
}

// Type-erased Encodable wrapper for the generic request method
private struct AnyEncodable: Encodable {
    private let _encode: (Encoder) throws -> Void

    init(_ value: any Encodable) {
        _encode = { encoder in try value.encode(to: encoder) }
    }

    func encode(to encoder: Encoder) throws {
        try _encode(encoder)
    }
}
