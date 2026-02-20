import SwiftUI

struct DictationButton: View {
    @Binding var text: String
    @State private var recognizer = SpeechRecognizer()

    var body: some View {
        Button {
            if recognizer.isTranscribing {
                // Append transcript and stop
                if !recognizer.transcript.isEmpty {
                    if !text.isEmpty && !text.hasSuffix(" ") {
                        text += " "
                    }
                    text += recognizer.transcript
                }
                recognizer.stopTranscribing()
            } else {
                recognizer.startTranscribing()
            }
        } label: {
            Image(systemName: recognizer.isTranscribing ? "mic.fill" : "mic")
                .foregroundStyle(recognizer.isTranscribing ? .red : .blue)
                .font(.body)
                .symbolEffect(.pulse, isActive: recognizer.isTranscribing)
        }
        .buttonStyle(.plain)
        .onChange(of: recognizer.transcript) { _, newValue in
            // Live update: show partial results as they come in
            // Final append happens on stop
        }
    }
}
