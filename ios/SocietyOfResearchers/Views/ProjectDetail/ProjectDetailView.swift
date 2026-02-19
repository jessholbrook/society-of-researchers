import SwiftUI

struct ProjectDetailView: View {
    @State private var viewModel: ProjectDetailViewModel

    init(project: Project) {
        _viewModel = State(initialValue: ProjectDetailViewModel(project: project))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Header
                projectHeader

                // Complete banner
                if viewModel.isComplete {
                    completeBanner
                }

                // Pipeline strip
                PipelineView(
                    currentStage: viewModel.project.currentStage,
                    stageResults: viewModel.project.stageResults,
                    projectId: viewModel.project.id
                )

                // Current stage card
                if let stageInfo = viewModel.currentStageInfo {
                    currentStageCard(stageInfo)
                }

                // Completed stages
                if !viewModel.completedStages.isEmpty {
                    completedStagesSection
                }

                // Actions
                actionsSection
            }
            .padding()
        }
        .navigationTitle(viewModel.project.name)
        .navigationBarTitleDisplayMode(.inline)
        .refreshable {
            await viewModel.refresh()
        }
        .overlay {
            if let error = viewModel.error {
                ErrorBanner(message: error) {
                    viewModel.error = nil
                }
            }
        }
        .task {
            await viewModel.refresh()
        }
    }

    // MARK: - Subviews

    private var projectHeader: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                StatusBadge(state: viewModel.project.state)
                Spacer()
                Text("Stage \(viewModel.project.currentStage) of 6")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Text(viewModel.project.researchQuestion)
                .font(.body)

            if !viewModel.project.context.isEmpty {
                Text(viewModel.project.context)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
    }

    private var completeBanner: some View {
        NavigationLink {
            ReportView(projectId: viewModel.project.id, projectName: viewModel.project.name)
        } label: {
            HStack {
                Image(systemName: "checkmark.seal.fill")
                    .foregroundStyle(.green)
                Text("Research Complete")
                    .font(.headline)
                Spacer()
                Text("View Report")
                    .font(.subheadline)
                Image(systemName: "chevron.right")
            }
            .padding()
            .background(.green.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
        }
        .buttonStyle(.plain)
    }

    private func currentStageCard(_ info: StageInfo) -> some View {
        NavigationLink {
            StageDetailView(
                projectId: viewModel.project.id,
                stageNumber: info.number,
                existingResult: viewModel.stageResult(for: info.number)
            )
        } label: {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Label("Current Stage", systemImage: "play.circle.fill")
                        .font(.caption)
                        .foregroundStyle(.blue)
                    Spacer()
                    Image(systemName: "chevron.right")
                        .foregroundStyle(.tertiary)
                }

                Text("Stage \(info.number): \(info.name)")
                    .font(.headline)

                Text(info.description)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .padding()
            .background(.blue.opacity(0.05), in: RoundedRectangle(cornerRadius: 12))
        }
        .buttonStyle(.plain)
    }

    private var completedStagesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Completed Stages")
                .font(.headline)

            ForEach(viewModel.completedStages) { result in
                NavigationLink {
                    StageDetailView(
                        projectId: viewModel.project.id,
                        stageNumber: result.stageNumber,
                        existingResult: result
                    )
                } label: {
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                        Text("Stage \(result.stageNumber): \(StageInfo.name(for: result.stageNumber))")
                            .font(.subheadline)
                        Spacer()
                        Text("\(result.agentOutputs.count) outputs")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Image(systemName: "chevron.right")
                            .foregroundStyle(.tertiary)
                    }
                    .padding(.vertical, 8)
                }
                .buttonStyle(.plain)
            }
        }
    }

    private var actionsSection: some View {
        VStack(spacing: 12) {
            NavigationLink {
                AgentManagementView(projectId: viewModel.project.id)
            } label: {
                Label("Manage Agents", systemImage: "person.3")
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
            }
            .buttonStyle(.plain)

            if viewModel.isComplete {
                NavigationLink {
                    ReportView(projectId: viewModel.project.id, projectName: viewModel.project.name)
                } label: {
                    Label("View Report", systemImage: "doc.text")
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding()
                        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
                }
                .buttonStyle(.plain)
            }
        }
    }
}
