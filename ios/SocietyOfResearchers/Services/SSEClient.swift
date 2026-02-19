import Foundation

enum SSEEventType: String, Sendable {
    case stageStart = "stage_start"
    case agentStart = "agent_start"
    case agentComplete = "agent_complete"
    case agentError = "agent_error"
    case conflictStart = "conflict_start"
    case conflictComplete = "conflict_complete"
    case stageComplete = "stage_complete"
}

struct SSEEvent: Sendable {
    let type: SSEEventType
    let agentId: String?
    let agentName: String?
    let content: String?
    let error: String?

    init(type: SSEEventType, json: [String: Any]) {
        self.type = type
        self.agentId = json["agent_id"] as? String
        self.agentName = json["agent_name"] as? String
        self.content = json["content"] as? String
        self.error = json["error"] as? String
    }
}

actor SSEClient {
    private let baseURL = Configuration.baseURL

    func stream(
        projectId: String,
        stageNumber: Int,
        onEvent: @MainActor @Sendable @escaping (SSEEvent) -> Void
    ) -> Task<Void, Never> {
        let url = baseURL.appendingPathComponent("/api/projects/\(projectId)/stages/\(stageNumber)/run")

        return Task {
            do {
                var request = URLRequest(url: url)
                request.setValue("text/event-stream", forHTTPHeaderField: "Accept")
                request.timeoutInterval = 600

                let (bytes, response) = try await URLSession.shared.bytes(for: request)

                guard let httpResponse = response as? HTTPURLResponse,
                      (200...299).contains(httpResponse.statusCode) else {
                    return
                }

                var currentEvent: String?
                var currentData: String?

                for try await line in bytes.lines {
                    if line.isEmpty {
                        // Empty line = end of event
                        if let eventType = currentEvent,
                           let data = currentData,
                           let type = SSEEventType(rawValue: eventType),
                           let parsed = Self.parseJSON(data) {
                            let event = SSEEvent(type: type, json: parsed)
                            await onEvent(event)
                        }
                        currentEvent = nil
                        currentData = nil
                        continue
                    }

                    if line.hasPrefix("event:") {
                        currentEvent = String(line.dropFirst(6)).trimmingCharacters(in: .whitespaces)
                    } else if line.hasPrefix("data:") {
                        currentData = String(line.dropFirst(5)).trimmingCharacters(in: .whitespaces)
                    }
                }
            } catch {
                if !Task.isCancelled {
                    print("SSE stream error: \(error)")
                }
            }
        }
    }

    private static func parseJSON(_ string: String) -> [String: Any]? {
        guard let data = string.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return nil
        }
        return json
    }
}
