"""
Headless Kaggle Dual-T4 (30GB VRAM) / Google Colab Cloud ComfyUI Worker Provisioner.
Offloads heavy Wan2.1 + IPAdapter FaceID + LatentSync rendering off the 8GB RAM local laptop.
Run inside a Kaggle Notebook with GPU T4 x2 enabled and Internet ON.
"""
import os
import re
import subprocess
import sys
import time
from pathlib import Path

WORKDIR = Path("/kaggle/working") if Path("/kaggle/working").exists() else Path.cwd() / "comfyui_cloud"
COMFY_DIR = WORKDIR / "ComfyUI"


def run(cmd: str, cwd: Path | None = None) -> None:
    print(f"[Synapes Cloud Worker] $ {cmd}", flush=True)
    subprocess.run(cmd, shell=True, check=True, cwd=str(cwd) if cwd else None)


def setup_comfyui() -> None:
    WORKDIR.mkdir(parents=True, exist_ok=True)
    if not COMFY_DIR.exists():
        run(f"git clone --depth 1 https://github.com/comfyanonymous/ComfyUI.git {COMFY_DIR}")
    run(f"{sys.executable} -m pip install -q -r requirements.txt", cwd=COMFY_DIR)

    custom_nodes = COMFY_DIR / "custom_nodes"
    nodes = [
        ("ComfyUI-WanVideoWrapper", "https://github.com/Kijai/ComfyUI-WanVideoWrapper.git"),
        ("ComfyUI_IPAdapter_plus", "https://github.com/cubiq/ComfyUI_IPAdapter_plus.git"),
        ("ComfyUI-LatentSyncWrapper", "https://github.com/shmuelronen/ComfyUI-LatentSyncWrapper.git"),
        ("ComfyUI-VideoHelperSuite", "https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite.git"),
    ]
    for folder, repo_url in nodes:
        target = custom_nodes / folder
        if not target.exists():
            run(f"git clone --depth 1 {repo_url} {target}")
            req = target / "requirements.txt"
            if req.exists():
                run(f"{sys.executable} -m pip install -q -r {req}")


def start_comfy_and_tunnel(port: int = 8188) -> None:
    if not os.path.exists("/usr/local/bin/cloudflared"):
        run(
            "wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O /usr/local/bin/cloudflared && chmod +x /usr/local/bin/cloudflared"
        )

    comfy_proc = subprocess.Popen(
        [sys.executable, "main.py", "--listen", "0.0.0.0", "--port", str(port), "--fast"],
        cwd=str(COMFY_DIR),
    )
    time.sleep(8)

    tunnel_proc = subprocess.Popen(
        ["/usr/local/bin/cloudflared", "tunnel", "--url", f"http://127.0.0.1:{port}"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )

    tunnel_url = None
    assert tunnel_proc.stdout is not None
    for line in tunnel_proc.stdout:
        print(line, end="")
        match = re.search(r"(https://[a-zA-Z0-9-]+\.trycloudflare\.com)", line)
        if match and not tunnel_url:
            tunnel_url = match.group(1)
            print("\n============================================================")
            print(f"[SYNAPES COMFYUI_WORKER_URL] Paste into Railway Env: {tunnel_url}")
            print("============================================================\n", flush=True)

    comfy_proc.wait()


if __name__ == "__main__":
    setup_comfyui()
    start_comfy_and_tunnel()
