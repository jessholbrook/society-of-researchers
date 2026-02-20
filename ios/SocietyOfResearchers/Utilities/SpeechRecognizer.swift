import Foundation
import Speech
import AVFoundation

@MainActor @Observable
final class SpeechRecognizer {
    var transcript = ""
    var isTranscribing = false
    var error: String?

    private var audioEngine: AVAudioEngine?
    private var recognitionTask: SFSpeechRecognitionTask?
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))

    func startTranscribing() {
        guard !isTranscribing else { return }

        Task {
            let authorized = await requestAuthorization()
            guard authorized else {
                error = "Speech recognition not authorized"
                return
            }

            do {
                try startRecording()
                isTranscribing = true
                error = nil
            } catch {
                self.error = "Failed to start recording: \(error.localizedDescription)"
            }
        }
    }

    func stopTranscribing() {
        audioEngine?.stop()
        audioEngine?.inputNode.removeTap(onBus: 0)
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()
        recognitionTask = nil
        recognitionRequest = nil
        audioEngine = nil
        isTranscribing = false
    }

    private func requestAuthorization() async -> Bool {
        await withCheckedContinuation { continuation in
            SFSpeechRecognizer.requestAuthorization { status in
                continuation.resume(returning: status == .authorized)
            }
        }
    }

    private func startRecording() throws {
        let audioSession = AVAudioSession.sharedInstance()
        try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
        try audioSession.setActive(true, options: .notifyOthersOnDeactivation)

        let engine = AVAudioEngine()
        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = true

        guard let recognizer = speechRecognizer, recognizer.isAvailable else {
            throw NSError(domain: "SpeechRecognizer", code: 1,
                          userInfo: [NSLocalizedDescriptionKey: "Speech recognizer not available"])
        }

        recognitionTask = recognizer.recognitionTask(with: request) { [weak self] result, error in
            Task { @MainActor in
                guard let self else { return }
                if let result {
                    self.transcript = result.bestTranscription.formattedString
                }
                if error != nil || (result?.isFinal == true) {
                    self.stopTranscribing()
                }
            }
        }

        let inputNode = engine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
            request.append(buffer)
        }

        engine.prepare()
        try engine.start()

        self.audioEngine = engine
        self.recognitionRequest = request
        transcript = ""
    }
}
