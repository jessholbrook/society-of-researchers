import SwiftUI

struct HomeView: View {
    @State private var showProjects = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 32) {
                    Spacer(minLength: 40)

                    // Hero
                    VStack(spacing: 16) {
                        ZStack {
                            Circle()
                                .fill(.indigo.opacity(0.1))
                                .frame(width: 120, height: 120)
                            Image(systemName: "flask.fill")
                                .font(.system(size: 48))
                                .foregroundStyle(.indigo)
                        }

                        Text("Society of Researchers")
                            .font(.largeTitle.weight(.bold))
                            .multilineTextAlignment(.center)

                        Text("Multi-agent research powered by AI.\n23 specialized agents across 6 stages of analysis.")
                            .font(.body)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 32)
                    }

                    // Pipeline preview
                    VStack(spacing: 12) {
                        ForEach(StageInfo.all, id: \.number) { stage in
                            HStack(spacing: 12) {
                                ZStack {
                                    Circle()
                                        .fill(stageColor(stage.number).opacity(0.15))
                                        .frame(width: 36, height: 36)
                                    Text("\(stage.number)")
                                        .font(.subheadline.weight(.semibold))
                                        .foregroundStyle(stageColor(stage.number))
                                }

                                VStack(alignment: .leading, spacing: 2) {
                                    Text(stage.name)
                                        .font(.subheadline.weight(.medium))
                                    Text(stage.description)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                        .lineLimit(1)
                                }

                                Spacer()
                            }
                            .padding(.horizontal, 24)
                        }
                    }
                    .padding(.vertical, 16)
                    .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
                    .padding(.horizontal)

                    // CTA
                    NavigationLink {
                        ProjectListView()
                    } label: {
                        HStack {
                            Text("Get Started")
                                .font(.headline)
                            Image(systemName: "arrow.right")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(.indigo, in: RoundedRectangle(cornerRadius: 14))
                        .foregroundStyle(.white)
                    }
                    .padding(.horizontal, 32)

                    Spacer(minLength: 40)
                }
            }
            .navigationDestination(for: Project.self) { project in
                ProjectDetailView(project: project)
            }
        }
    }

    private func stageColor(_ number: Int) -> Color {
        switch number {
        case 1: return .blue
        case 2: return .green
        case 3: return .orange
        case 4: return .purple
        case 5: return .pink
        case 6: return .indigo
        default: return .gray
        }
    }
}
