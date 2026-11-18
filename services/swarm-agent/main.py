import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="Synapes Swarm Agent Orchestrator", version="7.0.0")


class WritersRoomRequest(BaseModel):
    topic: str = Field(..., min_length=2)
    flow_id: str = "3d_animation_kids"
    duration_sec: int = 60
    comfyui_worker_url: Optional[str] = None


class WhisperAlignRequest(BaseModel):
    narration_text: str
    total_duration_sec: float = 12.0


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "swarm-orchestrator",
        "litellm_base_url": os.getenv("LITELLM_BASE_URL", "http://litellm:4000"),
        "comfyui_configured": bool(os.getenv("COMFYUI_WORKER_URL", "").strip()),
    }


@app.post("/api/swarm/writers-room")
async def orchestrate_writers_room(req: WritersRoomRequest):
    clean_topic = req.topic.strip()
    if not clean_topic:
        raise HTTPException(status_code=400, detail="Topic must not be empty.")

    scene_count = 5 if req.duration_sec >= 90 else 4
    per_scene = max(4, round(req.duration_sec / scene_count))
    beats = ["Hook", "Setup", "Escalation", "Climax", "Resolution"][:scene_count]

    scenes = []
    for idx, beat in enumerate(beats, start=1):
        scenes.append(
            {
                "sceneIndex": idx,
                "beat": beat,
                "durationSec": per_scene,
                "cameraDirective": "35mm Dolly-In Warm Rim Light" if req.flow_id == "3d_animation_kids" else "50mm Clean Broadcast",
                "narration": f"[{beat}] Scene {idx} for topic: {clean_topic}",
                "foleyCue": f"beat-sync-bar-{idx}",
            }
        )

    ffmpeg_mux_cmd = [
        "ffmpeg",
        "-y",
        "-i",
        "visual_master.mp4",
        "-i",
        "voice_with_sfx.aac",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-movflags",
        "+faststart",
        "final_master.mp4",
    ]

    return {
        "topic": clean_topic,
        "flowId": req.flow_id,
        "rubricCriticScore": 92,
        "scenes": scenes,
        "ffmpegMuxCommand": ffmpeg_mux_cmd,
        "comfyWorkerUrl": req.comfyui_worker_url or os.getenv("COMFYUI_WORKER_URL", ""),
    }


@app.post("/api/swarm/whisper-timestamps")
async def align_word_timestamps(req: WhisperAlignRequest):
    words: List[str] = [w for w in req.narration_text.strip().split() if w]
    if not words:
        raise HTTPException(status_code=400, detail="narration_text must contain words.")
    step = req.total_duration_sec / len(words)
    timings = [
        {
            "word": word,
            "startSec": round(i * step, 3),
            "endSec": round((i + 1) * step, 3),
        }
        for i, word in enumerate(words)
    ]
    return {"wordCount": len(timings), "totalDurationSec": req.total_duration_sec, "words": timings}
