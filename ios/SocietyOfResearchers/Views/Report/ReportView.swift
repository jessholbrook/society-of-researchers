import SwiftUI

struct ReportView: View {
    @State private var viewModel: ReportViewModel

    init(projectId: String, projectName: String) {
        _viewModel = State(initialValue: ReportViewModel(projectId: projectId, projectName: projectName))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Hero header
                heroHeader

                if viewModel.isGenerating {
                    generatingView
                } else if let report = viewModel.report {
                    // Rendered markdown
                    MarkdownRenderer(markdown: report)
                        .padding(.horizontal)
                        .fixedSize(horizontal: false, vertical: true)

                    // Regenerate button
                    Button {
                        Task { await viewModel.generateReport() }
                    } label: {
                        Label("Regenerate Report", systemImage: "arrow.clockwise")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                    .padding()
                    .padding(.bottom, 40)
                } else {
                    // No report yet
                    VStack(spacing: 16) {
                        Image(systemName: "doc.text.magnifyingglass")
                            .font(.system(size: 48))
                            .foregroundStyle(.secondary)

                        Text("No report generated yet")
                            .font(.headline)

                        Button {
                            Task { await viewModel.generateReport() }
                        } label: {
                            Label("Generate Report", systemImage: "sparkles")
                        }
                        .buttonStyle(.borderedProminent)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.top, 40)
                }
            }
        }
        .scrollIndicators(.visible)
        .navigationTitle("Report")
        .navigationBarTitleDisplayMode(.inline)
        .overlay {
            if let error = viewModel.error {
                ErrorBanner(message: error) {
                    viewModel.error = nil
                }
            }
        }
    }

    private var heroHeader: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "flask.fill")
                    .font(.title2)
                    .foregroundStyle(.white)
                Text("Research Report")
                    .font(.title2.bold())
                    .foregroundStyle(.white)
            }

            if !viewModel.projectName.isEmpty {
                Text(viewModel.projectName)
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.8))
            }

            // Pipeline strip
            HStack(spacing: 4) {
                ForEach(1...6, id: \.self) { stage in
                    RoundedRectangle(cornerRadius: 2)
                        .fill(.white.opacity(0.3))
                        .frame(height: 4)
                }
            }
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            LinearGradient(
                colors: [.indigo, .purple],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .padding(.horizontal)
    }

    private var generatingView: some View {
        VStack(spacing: 20) {
            ProgressView()
                .scaleEffect(1.5)

            Text("Generating Report...")
                .font(.headline)

            Text("This may take up to 2 minutes. The AI is synthesizing all stage outputs into a comprehensive report.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            // Animated dots
            HStack(spacing: 8) {
                ForEach(0..<3) { i in
                    Circle()
                        .fill(.indigo.opacity(0.5))
                        .frame(width: 8, height: 8)
                }
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 60)
    }
}
