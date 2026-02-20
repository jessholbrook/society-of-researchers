import SwiftUI

struct StageDetailView: View {
    @State private var viewModel: StageViewModel
    @State private var navigateToReport = false

    init(projectId: String, stageNumber: Int, existingResult: StageResult?) {
        _viewModel = State(initialValue: StageViewModel(
            projectId: projectId,
            stageNumber: stageNumber,
            existingResult: existingResult
        ))
    }

    var body: some View {
        VStack(spacing: 0) {
            // Header
            stageHeader

            // Tab picker
            Picker("Tab", selection: $viewModel.selectedTab) {
                ForEach(StageTab.allCases, id: \.self) { tab in
                    Text(tab.rawValue).tag(tab)
                }
            }
            .pickerStyle(.segmented)
            .padding(.horizontal)
            .padding(.vertical, 8)

            // Tab content — plain switch avoids gesture conflicts with inner ScrollViews
            switch viewModel.selectedTab {
            case .outputs:
                AgentOutputsTab(viewModel: viewModel)
            case .debate:
                DebateTab(viewModel: viewModel)
            case .override:
                OverrideTab(viewModel: viewModel)
            }
        }
        .navigationTitle("Stage \(viewModel.stageNumber)")
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(isPresented: $navigateToReport) {
            ReportView(projectId: viewModel.projectId, projectName: "")
        }
        .overlay {
            if let error = viewModel.error {
                ErrorBanner(message: error) {
                    viewModel.error = nil
                }
            }
        }
        .task {
            await viewModel.load()
        }
    }

    private var stageHeader: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(viewModel.stageName)
                        .font(.headline)
                    Text(viewModel.stageDescription)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()

                if let status = viewModel.stageResult?.status {
                    StatusBadge(stageStatus: status)
                }
            }

            // Action buttons
            HStack(spacing: 12) {
                if viewModel.canRun && !viewModel.isRunning {
                    Button {
                        viewModel.runStage()
                    } label: {
                        Label("Run Stage", systemImage: "play.fill")
                    }
                    .buttonStyle(.borderedProminent)
                }

                if viewModel.isRunning {
                    Button {
                        viewModel.cancelStream()
                    } label: {
                        Label("Cancel", systemImage: "stop.fill")
                    }
                    .buttonStyle(.bordered)
                    .tint(.red)
                }

                if viewModel.canApprove {
                    Button {
                        Task {
                            if let response = await viewModel.approve() {
                                if response.complete == true && viewModel.isFinalStage {
                                    navigateToReport = true
                                }
                            }
                        }
                    } label: {
                        if viewModel.isFinalStage {
                            Label("Complete & Generate Report", systemImage: "checkmark.seal")
                        } else {
                            Label("Approve & Continue", systemImage: "checkmark.circle")
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.green)
                    .disabled(viewModel.isApproving)
                }

                if viewModel.isApproved && !viewModel.isFinalStage {
                    Label("Approved", systemImage: "checkmark.seal.fill")
                        .font(.subheadline)
                        .foregroundStyle(.green)
                }
            }
        }
        .padding()
        .background(.ultraThinMaterial)
    }
}
