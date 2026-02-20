import SwiftUI
import UniformTypeIdentifiers

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

            // Documents bar for Stage 2 (Evidence Gathering)
            if viewModel.stageNumber == 2 {
                DocumentsBar(projectId: viewModel.projectId)
            }

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

// MARK: - Documents Bar

struct DocumentsBar: View {
    let projectId: String

    @State private var documents: [DocumentResponse] = []
    @State private var isShowingFilePicker = false
    @State private var isUploading = false
    @State private var uploadError: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Label("Evidence Files", systemImage: "doc.fill")
                    .font(.subheadline.bold())
                Spacer()

                if isUploading {
                    ProgressView()
                        .scaleEffect(0.7)
                }

                Button {
                    isShowingFilePicker = true
                } label: {
                    Label("Upload", systemImage: "plus.circle.fill")
                        .font(.caption)
                }
                .disabled(isUploading)
            }

            if !documents.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(documents) { doc in
                            DocumentChip(doc: doc) {
                                Task { await deleteDocument(doc.id) }
                            }
                        }
                    }
                }
            }

            if let error = uploadError {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(Color(.secondarySystemBackground))
        .fileImporter(
            isPresented: $isShowingFilePicker,
            allowedContentTypes: [.pdf, .plainText, .commaSeparatedText],
            allowsMultipleSelection: false
        ) { result in
            Task { await handleFileImport(result) }
        }
        .task {
            await loadDocuments()
        }
    }

    private func loadDocuments() async {
        do {
            documents = try await APIClient.shared.listDocuments(projectId: projectId)
        } catch {
            // Silently fail on load — empty list is fine
        }
    }

    private func handleFileImport(_ result: Result<[URL], Error>) async {
        guard case .success(let urls) = result, let url = urls.first else { return }

        guard url.startAccessingSecurityScopedResource() else {
            uploadError = "Cannot access file"
            return
        }
        defer { url.stopAccessingSecurityScopedResource() }

        isUploading = true
        uploadError = nil

        do {
            let data = try Data(contentsOf: url)
            let filename = url.lastPathComponent
            let contentType: String
            switch url.pathExtension.lowercased() {
            case "pdf": contentType = "application/pdf"
            case "csv": contentType = "text/csv"
            default: contentType = "text/plain"
            }

            _ = try await APIClient.shared.uploadDocument(
                projectId: projectId,
                fileData: data,
                filename: filename,
                contentType: contentType
            )
            await loadDocuments()
        } catch {
            uploadError = error.localizedDescription
        }

        isUploading = false
    }

    private func deleteDocument(_ docId: String) async {
        do {
            _ = try await APIClient.shared.deleteDocument(projectId: projectId, docId: docId)
            documents.removeAll { $0.id == docId }
        } catch {
            uploadError = error.localizedDescription
        }
    }
}

// MARK: - Document Chip

private struct DocumentChip: View {
    let doc: DocumentResponse
    let onDelete: () -> Void

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: iconName)
                .font(.caption2)
            Text(doc.filename)
                .font(.caption)
                .lineLimit(1)

            Button(action: onDelete) {
                Image(systemName: "xmark.circle.fill")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(.blue.opacity(0.1), in: Capsule())
    }

    private var iconName: String {
        if doc.filename.hasSuffix(".pdf") { return "doc.richtext" }
        if doc.filename.hasSuffix(".csv") { return "tablecells" }
        return "doc.text"
    }
}
