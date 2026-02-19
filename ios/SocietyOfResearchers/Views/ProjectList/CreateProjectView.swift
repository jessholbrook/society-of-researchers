import SwiftUI

struct CreateProjectView: View {
    let viewModel: ProjectListViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var question = ""
    @State private var context = ""
    @State private var isCreating = false

    var body: some View {
        NavigationStack {
            Form {
                Section("Project Name") {
                    TextField("e.g. Remote Work Productivity", text: $name)
                }

                Section("Research Question") {
                    TextField("What do you want to investigate?", text: $question, axis: .vertical)
                        .lineLimit(3...6)
                }

                Section("Context (Optional)") {
                    TextField("Background, constraints, audience...", text: $context, axis: .vertical)
                        .lineLimit(3...6)
                }
            }
            .navigationTitle("New Project")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Create") {
                        createProject()
                    }
                    .disabled(name.isEmpty || question.isEmpty || isCreating)
                }
            }
            .overlay {
                if isCreating {
                    ProgressView()
                }
            }
        }
    }

    private func createProject() {
        isCreating = true
        Task {
            if let _ = await viewModel.createProject(name: name, question: question, context: context) {
                dismiss()
            }
            isCreating = false
        }
    }
}
