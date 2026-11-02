import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { uploadDetailAdmissionAudio } from "../../../../helpers/backend_helper";

export const useRecordingSession = ({
  patient,
  center,
  uploadedAudio,
  setUploadedAudio,
  onAbortGeneration,
  isGenerating,
}) => {
  const [inputMode, setInputMode] = useState("upload");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState("");
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const canvasElRef = useRef(null);

  const stopVisualizerLoop = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const startVisualizerLoop = () => {
    stopVisualizerLoop();
    const analyser = analyserRef.current;
    const canvas = canvasElRef.current;
    if (!analyser || !canvas) return;

    const canvasCtx = canvas.getContext("2d");
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      if (!canvasElRef.current) return;
      analyser.getByteFrequencyData(dataArray);

      canvasCtx.fillStyle = "#f8fafc";
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 1.5;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        canvasCtx.fillStyle = "#2563eb";
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
        x += barWidth;
      }
    };

    draw();
  };

  const registerCanvas = useCallback((canvasEl) => {
    canvasElRef.current = canvasEl;
    if (canvasEl) {
      startVisualizerLoop();
    } else {
      stopVisualizerLoop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (uploadedAudio?.url && !audioPreviewUrl) {
      setAudioPreviewUrl(uploadedAudio.url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedAudio?.url]);

  const teardownAudioGraph = () => {
    stopVisualizerLoop();
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
    }
    audioContextRef.current = null;
    analyserRef.current = null;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsRecording(false);
  };

  useEffect(() => {
    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
      teardownAudioGraph();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadAudioFile = async (file, sourceType = "uploaded") => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadStatusText("Uploading audio to S3...");

      const formData = new FormData();
      formData.append("audio", file);
      formData.append("sourceType", sourceType);
      if (patient?._id) formData.append("patient", patient._id);
      if (center) formData.append("center", center);

      const response = await uploadDetailAdmissionAudio(formData, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            setUploadProgress(percent);
            setUploadStatusText(`Uploading to S3 (${percent}%)...`);
          }
        },
      });
      const payload = response?.payload || response?.data || response;

      if (payload?.url) {
        setUploadedAudio({
          url: payload.url,
          path: payload.path,
          name: payload.name || file.name,
          originalName: payload.originalName || file.name,
          size: payload.size || file.size,
          type: payload.type || file.type,
          mimetype: payload.type || file.type,
          duration: payload.duration || payload.audioDetails?.duration || 0,
          sourceType:
            payload.audioDetails?.sourceType ||
            payload.sourceType ||
            sourceType,
          uploadedAt: payload.audioDetails?.uploadedAt || new Date(),
        });
        toast.success("Audio uploaded to S3 successfully!");
      } else {
        throw new Error(response?.message || "Failed to upload audio to S3");
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Audio upload error:", err);
      toast.error(err.message || "Failed to upload audio file");
      setUploadedAudio(null);
      setAudioPreviewUrl(null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatusText("");
    }
  };

  const handleFileSelected = async (file) => {
    const preview = URL.createObjectURL(file);
    setAudioPreviewUrl(preview);
    await uploadAudioFile(file, "uploaded");
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      let mimeType = "audio/webm;codecs=opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported("audio/webm")) {
          mimeType = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
          mimeType = "audio/ogg";
        } else {
          mimeType = "";
        }
      }

      const recorderOptions = {
        audioBitsPerSecond: 64000,
      };
      if (mimeType) {
        recorderOptions.mimeType = mimeType;
      }
      const recorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const blobType = mimeType || recorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: blobType });
        teardownAudioGraph();
        if (audioBlob.size === 0) return;

        const ext = blobType.includes("mp4")
          ? "m4a"
          : blobType.includes("ogg")
            ? "ogg"
            : "webm";
        const audioFile = new File(
          [audioBlob],
          `browser-recording-${Date.now()}.${ext}`,
          { type: blobType },
        );

        const preview = URL.createObjectURL(audioBlob);
        setAudioPreviewUrl(preview);

        await uploadAudioFile(audioFile, "recorded");
      };

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        try {
          const ctx = new AudioCtx();
          audioContextRef.current = ctx;
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          analyserRef.current = analyser;
          source.connect(analyser);
          if (canvasElRef.current) startVisualizerLoop();
        } catch (e) {
          // Visualizer is an enhancement; recording still continues
        }
      }

      recorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Microphone error:", err);
      toast.error(
        "Could not access microphone. Please ensure microphone permissions are granted.",
      );
    }
  };

  const handleStopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  const handleModeChange = async (newMode) => {
    if (isGenerating || isRecording || newMode === inputMode) return;

    if (newMode === "upload") {
      teardownAudioGraph();
      if (uploadedAudio?.path) {
        await onAbortGeneration(false);
      }
      setUploadedAudio(null);
      setAudioPreviewUrl(null);
      setRecordingSeconds(0);
      setInputMode("upload");
    } else if (newMode === "record") {
      if (uploadedAudio?.path) {
        await onAbortGeneration(false);
      }
      setUploadedAudio(null);
      setAudioPreviewUrl(null);
      setRecordingSeconds(0);
      setInputMode("record");
    }
  };

  const handleRemoveAudio = async () => {
    if (isGenerating) return;
    if (uploadedAudio?.path) {
      await onAbortGeneration(false);
    }
    setUploadedAudio(null);
    setAudioPreviewUrl(null);
    setRecordingSeconds(0);
  };

  return {
    inputMode,
    isUploading,
    uploadProgress,
    uploadStatusText,
    audioPreviewUrl,
    isRecording,
    recordingSeconds,
    registerCanvas,
    handleFileSelected,
    handleStartRecording,
    handleStopRecording,
    handleModeChange,
    handleRemoveAudio,
  };
};
