import SwiftUI

struct AgentFormView: View {
    let projectId: String
    let editing: AgentConfig?
    let onSave: (CreateAgentRequest) async -> Void

    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var role = ""
    @State private var perspective = ""
    @State private var systemPrompt = ""
    @State private var temperature = 0.7
    @State private var stage = 1
    @State private var enabled = true
    @State private var isSaving = false

    init(projectId: String, editing: AgentConfig? = nil, onSave: @escaping (CreateAgentRequest) async -> Void) {
        self.projectId = projectId
        self.editing = editing
        self.onSave = onSave
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Identity") {
                    TextField("Name", text: $name)
                    TextField("Role", text: $role)
                    TextField("Perspective", text: $perspective, axis: .vertical)
                        .lineLimit(2...4)
                }

                Section("System Prompt") {
                    TextEditor(text: $systemPrompt)
                        .frame(minHeight: 120)
                }

                Section("Configuration") {
                    Picker("Stage", selection: $stage) {
                        ForEach(1...6, id: \.self) { num in
                            Text("Stage \(num): \(StageInfo.name(for: num))").tag(num)
                        }
                    }

                    VStack(alignment: .leading) {
                        Text("Temperature: \(String(format: "%.2f", temperature))")
                            .font(.subheadline)
                        Slider(value: $temperature, in: 0...1, step: 0.05)
                    }

                    Toggle("Enabled", isOn: $enabled)
                }
            }
            .navigationTitle(editing == nil ? "New Agent" : "Edit Agent")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { save() }
                        .disabled(name.isEmpty || role.isEmpty || systemPrompt.isEmpty || isSaving)
                }
            }
            .onAppear {
                if let agent = editing {
                    name = agent.name
                    role = agent.role
                    perspective = agent.perspective
                    systemPrompt = agent.systemPrompt
                    temperature = agent.temperature
                    stage = agent.stage
                    enabled = agent.enabled
                }
            }
        }
    }

    private func save() {
        isSaving = true
        Task {
            let req = CreateAgentRequest(
                name: name,
                role: role,
                perspective: perspective,
                systemPrompt: systemPrompt,
                stage: stage,
                temperature: temperature,
                enabled: enabled,
                projectId: projectId
            )
            await onSave(req)
            dismiss()
        }
    }
}
