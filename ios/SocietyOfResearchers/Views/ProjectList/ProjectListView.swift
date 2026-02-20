import SwiftUI

struct ProjectListView: View {
    @State private var viewModel = ProjectListViewModel()
    @State private var showCreateSheet = false

    var body: some View {
        Group {
            if viewModel.isLoading && viewModel.projects.isEmpty {
                ProgressView("Loading projects...")
            } else if viewModel.projects.isEmpty {
                ContentUnavailableView(
                    "No Projects",
                    systemImage: "flask",
                    description: Text("Create a research project to get started.")
                )
            } else {
                List {
                    ForEach(viewModel.projects) { project in
                        NavigationLink(value: project) {
                            ProjectRowView(project: project)
                        }
                    }
                    .onDelete(perform: viewModel.deleteProject)
                }
                .refreshable {
                    await viewModel.loadProjects()
                }
            }
        }
        .navigationTitle("Research Projects")
        .navigationDestination(for: Project.self) { project in
            ProjectDetailView(project: project)
        }
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button {
                    showCreateSheet = true
                } label: {
                    Image(systemName: "plus")
                }
            }
        }
        .sheet(isPresented: $showCreateSheet) {
            CreateProjectView(viewModel: viewModel)
        }
        .overlay {
            if let error = viewModel.error {
                ErrorBanner(message: error) {
                    viewModel.error = nil
                }
            }
        }
        .task {
            await viewModel.loadProjects()
        }
        .onAppear {
            Task { await viewModel.loadProjects() }
        }
    }
}

extension Project: Hashable {
    static func == (lhs: Project, rhs: Project) -> Bool {
        lhs.id == rhs.id
    }

    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}
