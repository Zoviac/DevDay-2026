import { useRef, useState } from "react";
import { sendVoiceRecording } from "../services/api";

function VoiceAssistant() {
  const [status, setStatus] = useState("idle");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const mimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
      const mimeType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type));
      const mediaRecorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: mediaRecorder.mimeType || mimeType || "audio/webm",
          });
          stream.getTracks().forEach((track) => track.stop());
          const replyAudio = await sendVoiceRecording(audioBlob);
          const audioUrl = URL.createObjectURL(replyAudio);
          const audio = new Audio(audioUrl);
          setStatus("playing");
          audio.onended = () => { URL.revokeObjectURL(audioUrl);
            setStatus("idle");
          };
          audio.play().catch((err) => { console.error("Playback blocked or failed:", err);
            setStatus("idle");
          });
        } catch (error) {
          console.error("Voice assistant error:", error);
          setStatus("error");
        }
      };

      mediaRecorder.start();
      setStatus("recording");
    } catch (error) {
      console.error("Microphone error:", error);
      setStatus("error");
    }
  }

  function stopRecording() {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder) return;
    mediaRecorder.stop();
    setStatus("loading");
  }

  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-orange-600">
          Voice Assistant
        </p>
        <h2 className="mt-2 text-3xl font-bold text-slate-950">
          Ask your cooking assistant
        </h2>
        <p className="mt-3 max-w-2xl text-slate-600">
          Ask questions about recipes, ingredients, or cooking steps.
        </p>
        <button
          onClick={status === "recording" ? stopRecording : startRecording}
          disabled={status === "loading" || status === "playing"}
          className="mt-6 rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "recording" ? "Stop Recording" : "Start Voice Assistant"}
        </button>

        <p className="mt-4 text-sm text-slate-500">
          {status === "idle" && "Ready when you are."}
          {status === "recording" && "Listening..."}
          {status === "loading" && "Thinking..."}
          {status === "playing" && "Playing response..."}
          {status === "error" && "Something went wrong. Try again."}
        </p>
      </div>
    </section>
  );
}

export default VoiceAssistant;
