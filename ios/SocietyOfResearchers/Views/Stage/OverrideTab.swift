import SwiftUI

struct OverrideTab: View {
    @Bindable var viewModel: StageViewModel

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Human Override")
                    .font(.headline)

                Text("Provide your own synthesis or corrections. This will be used alongside or instead of the agent outputs.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                VStack(alignment: .leading, spacing: 8) {
                    Text("Researcher Context")
                        .font(.subheadline.bold())

                    TextEditor(text: $viewModel.overrideContent)
                        .frame(minHeight: 200)
                        .padding(8)
                        .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 8))
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color(.separator), lineWidth: 0.5)
                        )
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("Notes to Researcher (Optional)")
                        .font(.subheadline.bold())

                    TextEditor(text: $viewModel.overrideNotes)
                        .frame(minHeight: 80)
                        .padding(8)
                        .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 8))
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color(.separator), lineWidth: 0.5)
                        )
                }

                Button {
                    Task { await viewModel.saveOverride() }
                } label: {
                    HStack {
                        if viewModel.isSavingOverride {
                            ProgressView()
                                .scaleEffect(0.8)
                        }
                        Text("Save Override")
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .disabled(viewModel.overrideContent.isEmpty || viewModel.isSavingOverride)

                if let existing = viewModel.stageResult?.humanOverride, !existing.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Saved Override", systemImage: "checkmark.circle.fill")
                            .font(.subheadline)
                            .foregroundStyle(.green)

                        Text(existing)
                            .font(.body)
                            .padding()
                            .background(.green.opacity(0.05), in: RoundedRectangle(cornerRadius: 8))
                    }
                }
            }
            .padding()
        }
    }
}
