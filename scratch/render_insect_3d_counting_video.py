# -*- coding: utf-8 -*-
"""
SYNAPES STUDIO — SESSION 9 TRUE SKELETAL 3D INSECT COUNTING & DANCING RENDERER
Pure Python + PIL + FFmpeg (Zero external C/NumPy dependency)
Renders:
1. VIDEO_HOAT_HINH_3D_CON_TRUNG_NHAY_MUA_HAT_DEM_SO_1_DEN_10.mp4 (36.0s, 1080 frames @ 30fps, 1920x1080)
2. VIDEO_CON_TRUNG_3D_DEM_SO_20S.mp4 (20.0s highlight cut, 600 frames @ 30fps, 1920x1080)
"""

import os
import sys
import math
import wave
import array
import shutil
import subprocess
from PIL import Image, ImageDraw, ImageFont

try:
    from gtts import gTTS
    HAS_GTTS = True
except Exception:
    HAS_GTTS = False

FFMPEG_BIN = r"C:\Users\84364\.gemini\antigravity-ide\scratch\auto-youtube-shorts\.venv\Scripts\ffmpeg.exe"
if not os.path.exists(FFMPEG_BIN):
    FFMPEG_BIN = "ffmpeg"

STAGE_PLATE_1 = r"c:\Users\84364\autovideo-webapp\public\3d_forest_stage_1.jpg"
STAGE_PLATE_2 = r"c:\Users\84364\autovideo-webapp\public\3d_forest_stage_2.jpg"

TARGET_DIR = r"C:\Users\84364\Documents\DỰ ÁN WEB APP AUTO TOOL\Phiên họp thứ chín"
PUBLIC_DIR = r"c:\Users\84364\autovideo-webapp\public"
ARTIFACT_DIR = r"C:\Users\84364\.gemini\antigravity\brain\eeb3e51c-71f5-4e64-afcb-50c0f3149591"
SCRATCH_DIR = r"c:\Users\84364\autovideo-webapp\scratch\phien9_temp"

os.makedirs(TARGET_DIR, exist_ok=True)
os.makedirs(SCRATCH_DIR, exist_ok=True)

W, H = 1920, 1080
FPS = 30
TOTAL_SCENES = 10

VERSES = [
    (1, "SỐ 1 • MỘT CHÚ CÀO CÀO XANH", "Một! Một chú cào cào xanh bật nhảy múa ca!"),
    (2, "SỐ 2 • HAI CHÚ ONG VÀNG", "Một, hai! Hai chú ong vàng đập cánh xoay vòng!"),
    (3, "SỐ 3 • BA BẠN BỌ RÙA ĐỎ", "Một, hai, ba! Ba bạn bọ rùa lắc lư theo nhịp trống!"),
    (4, "SỐ 4 • BỐN CÁNH BƯỚM NGỌC", "Một, hai, ba, bốn! Bốn bạn bướm ngọc vẫy cánh bay lượn!"),
    (5, "SỐ 5 • NĂM BẠN KIẾN NHỎ", "Một, hai, ba, bốn, năm! Năm bạn kiến nhỏ vỗ tay hát vang!"),
    (6, "SỐ 6 • SÁU BẠN CÔN TRÙNG", "Sáu! Sáu người bạn côn trùng bật nhảy khỏe khoắn!"),
    (7, "SỐ 7 • BẢY VŨ CÔNG RỪNG XANH", "Bảy! Bảy vũ công tí hon nhảy múa dưới cầu vồng!"),
    (8, "SỐ 8 • TÁM NHẠC CÔNG VỖ CÁNH", "Tám! Tám chú côn trùng đập cánh rộn rã theo nhạc!"),
    (9, "SỐ 9 • CHÍN NGƯỜI BẠN MÙA XUÂN", "Chín! Chín bạn nhỏ nắm tay nhảy điệu vũ hội mùa xuân!"),
    (10, "SỐ 10 • ĐẠI HỢP XƯỚNG MƯỜI BẠN", "Mười! Một, hai, ba, bốn, năm, sáu, bảy, tám, chín, mười!"),
]

ARCHETYPES = [
    {
        "name": "CaoCaoXanh",
        "color": (46, 213, 115),
        "belly": (253, 240, 138),
        "stripe": (20, 130, 65),
        "wing": (180, 245, 255),
        "ant_tip": (255, 230, 60),
    },
    {
        "name": "OngVang",
        "color": (255, 195, 18),
        "belly": (65, 40, 15),
        "stripe": (45, 30, 10),
        "wing": (215, 245, 255),
        "ant_tip": (255, 160, 0),
    },
    {
        "name": "BoRuaDo",
        "color": (235, 59, 90),
        "belly": (40, 45, 60),
        "stripe": (25, 25, 35),
        "wing": (255, 215, 225),
        "ant_tip": (255, 90, 110),
    },
    {
        "name": "BuomNgoc",
        "color": (15, 185, 240),
        "belly": (255, 245, 190),
        "stripe": (10, 110, 165),
        "wing": (160, 250, 255),
        "ant_tip": (120, 255, 240),
    },
    {
        "name": "KienTim",
        "color": (165, 94, 234),
        "belly": (255, 225, 130),
        "stripe": (105, 45, 165),
        "wing": (235, 210, 255),
        "ant_tip": (255, 200, 255),
    },
]


def load_vietnamese_font(size, bold=True):
    candidates = [
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\tahomabd.ttf",
    ]
    for p in candidates:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()


def create_3d_shaded_ellipsoid(w, h, base_rgb, stripe_rgb=None, is_ladybug=False):
    """
    Pre-renders a true 3D Phong + Subsurface Scattering shaded ellipsoid RGBA sprite
    using per-pixel surface normals (nx, ny, nz).
    """
    buf = bytearray(w * h * 4)
    lx, ly, lz = -0.45, -0.55, 0.703
    hx, hy, hz = -0.25, -0.32, 0.913

    for py in range(h):
        ny = (py / float(h - 1)) * 2.0 - 1.0
        ny2 = ny * ny
        is_stripe_row = False
        if stripe_rgb is not None and not is_ladybug:
            is_stripe_row = (math.sin(ny * 9.5) > 0.25) and (abs(ny) < 0.72)

        for px in range(w):
            nx = (px / float(w - 1)) * 2.0 - 1.0
            r2 = nx * nx + ny2
            if r2 > 1.0:
                continue
            nz = math.sqrt(1.0 - r2)
            dist = math.sqrt(r2)

            ndotl = max(0.0, nx * lx + ny * ly + nz * lz)
            ndoth = max(0.0, nx * hx + ny * hy + nz * hz)
            spec = (ndoth ** 28.0) * 0.62
            rim = ((1.0 - nz) ** 2.6) * 0.42

            cr, cg, cb = base_rgb
            if is_stripe_row:
                cr, cg, cb = stripe_rgb
            elif is_ladybug and stripe_rgb is not None:
                if (
                    (nx - 0.35) ** 2 + (ny + 0.25) ** 2 < 0.06
                    or (nx + 0.35) ** 2 + (ny + 0.25) ** 2 < 0.06
                    or (nx - 0.28) ** 2 + (ny - 0.32) ** 2 < 0.055
                    or (nx + 0.28) ** 2 + (ny - 0.32) ** 2 < 0.055
                ):
                    cr, cg, cb = stripe_rgb

            lighting = 0.36 + 0.72 * ndotl
            r_out = min(255, max(0, int(cr * lighting + 255.0 * (spec + rim * 0.5))))
            g_out = min(255, max(0, int(cg * lighting + 255.0 * (spec + rim * 0.6))))
            b_out = min(255, max(0, int(cb * lighting + 255.0 * (spec + rim * 0.4))))
            alpha = min(1.0, max(0.0, (1.0 - dist) * 24.0))
            a_out = int(alpha * 255.0)

            idx = (py * w + px) * 4
            buf[idx] = r_out
            buf[idx + 1] = g_out
            buf[idx + 2] = b_out
            buf[idx + 3] = a_out

    return Image.frombytes("RGBA", (w, h), bytes(buf))


def create_iridescent_wing(w, h, wing_rgb):
    """Creates a translucent 3D iridescent insect wing with vein patterns."""
    buf = bytearray(w * h * 4)
    for py in range(h):
        ny = (py / float(h - 1)) * 2.0 - 1.0
        ny2 = ny * ny
        for px in range(w):
            nx = (px / float(w - 1)) * 2.0 - 1.0
            r2 = nx * nx + ny2
            if r2 > 1.0:
                continue
            dist = math.sqrt(r2)
            nz = math.sqrt(1.0 - r2)
            shimmer = 0.5 + 0.5 * math.sin(nx * 6.0 + ny * 4.0)
            s_val = math.sin(nx * 8.0 + ny * 5.0)
            vein = math.exp(-(s_val * s_val) * 18.0) * 0.35

            r_out = min(255, int(wing_rgb[0] + shimmer * 35 + vein * 60))
            g_out = min(255, int(wing_rgb[1] + shimmer * 25 + vein * 60))
            b_out = min(255, int(wing_rgb[2] + shimmer * 40 + vein * 60))

            rim = (1.0 - nz) ** 1.8
            edge = min(1.0, max(0.0, (1.0 - dist) * 20.0))
            a_out = min(225, int(edge * (0.48 + 0.32 * rim + vein * 0.4) * 255.0))

            idx = (py * w + px) * 4
            buf[idx] = r_out
            buf[idx + 1] = g_out
            buf[idx + 2] = b_out
            buf[idx + 3] = a_out

    return Image.frombytes("RGBA", (w, h), bytes(buf))


def prebuild_insect_rig_parts():
    rigs = []
    for idx, arch in enumerate(ARCHETYPES):
        head = create_3d_shaded_ellipsoid(110, 102, arch["color"])
        cheek_draw = ImageDraw.Draw(head)
        cheek_draw.ellipse([12, 54, 34, 70], fill=(255, 120, 150, 135))
        cheek_draw.ellipse([76, 54, 98, 70], fill=(255, 120, 150, 135))

        body = create_3d_shaded_ellipsoid(
            104,
            126,
            arch["color"],
            stripe_rgb=arch["stripe"],
            is_ladybug=(idx == 2),
        )
        wing = create_iridescent_wing(120, 62, arch["wing"])
        rigs.append({
            "arch": arch,
            "head": head,
            "body": body,
            "wing": wing,
        })
    return rigs


def draw_articulated_3d_insect(
    canvas_rgba,
    rig,
    cx,
    ground_y,
    scale,
    t_sec,
    char_idx,
    vocal_env,
):
    draw = ImageDraw.Draw(canvas_rgba)
    arch = rig["arch"]

    beat_phase = t_sec * 13.6135 + char_idx * 0.75
    jump_val = max(0.0, math.sin(beat_phase))
    jump_height = jump_val * 68.0 * scale

    squash_x = 1.0 + (1.0 - jump_val) * 0.08 - jump_val * 0.05
    squash_y = 1.0 - (1.0 - jump_val) * 0.08 + jump_val * 0.07

    sway_x = math.sin(beat_phase * 0.5) * 14.0 * scale
    cur_x = int(cx + sway_x)
    cur_y = int(ground_y - jump_height)

    # 1. Dynamic Ground Contact Shadow
    sh_rx = int(56 * scale * (1.0 - jump_val * 0.38))
    sh_ry = int(15 * scale * (1.0 - jump_val * 0.38))
    sh_alpha = int(115 * (1.0 - jump_val * 0.52))
    draw.ellipse(
        [cur_x - sh_rx, int(ground_y) - sh_ry, cur_x + sh_rx, int(ground_y) + sh_ry],
        fill=(8, 18, 10, sh_alpha),
    )

    # 2. Translucent 3D Iridescent Wings (Flapping at 22Hz)
    wing_img = rig["wing"]
    ww = max(16, int(wing_img.width * scale))
    wh = max(10, int(wing_img.height * scale))
    wing_scaled = wing_img.resize((ww, wh), Image.Resampling.BILINEAR)

    flap_deg = math.sin(t_sec * 42.0 + char_idx * 1.9) * 32.0 + 18.0
    left_wing = wing_scaled.rotate(flap_deg, expand=True, resample=Image.Resampling.BILINEAR)
    right_wing = wing_scaled.transpose(Image.Transpose.FLIP_LEFT_RIGHT).rotate(
        -flap_deg, expand=True, resample=Image.Resampling.BILINEAR
    )

    body_cy = cur_y - int(68 * scale * squash_y)
    canvas_rgba.alpha_composite(
        left_wing,
        (cur_x - int(22 * scale) - left_wing.width // 2, body_cy - int(26 * scale) - left_wing.height // 2),
    )
    canvas_rgba.alpha_composite(
        right_wing,
        (cur_x + int(22 * scale) - right_wing.width // 2, body_cy - int(26 * scale) - right_wing.height // 2),
    )

    # 3. Articulated 2-Joint Jumping Legs (Femur + Tibia + 3D Shoe Foot)
    leg_color = arch["stripe"]
    limb_w = max(4, int(11 * scale))
    for side in (-1, 1):
        hip_x = cur_x + side * int(22 * scale)
        hip_y = body_cy + int(32 * scale)
        knee_x = cur_x + side * int((48 + (1.0 - jump_val) * 16) * scale)
        knee_y = body_cy + int((45 - jump_val * 14) * scale)
        foot_x = cur_x + side * int(34 * scale)
        foot_y = cur_y - int(4 * scale)

        draw.line([(hip_x, hip_y), (knee_x, knee_y)], fill=leg_color + (255,), width=limb_w)
        draw.line([(knee_x, knee_y), (foot_x, foot_y)], fill=arch["color"] + (255,), width=limb_w)
        frx, fry = int(14 * scale), int(8 * scale)
        draw.ellipse(
            [foot_x - frx, foot_y - fry, foot_x + frx, foot_y + fry],
            fill=arch["ant_tip"] + (255,),
            outline=(255, 255, 255, 220),
            width=max(1, int(2 * scale)),
        )

    # 4. 3D Shaded Thorax/Abdomen
    bw = max(16, int(rig["body"].width * scale * squash_x))
    bh = max(16, int(rig["body"].height * scale * squash_y))
    body_sprite = rig["body"].resize((bw, bh), Image.Resampling.BILINEAR)
    canvas_rgba.alpha_composite(body_sprite, (cur_x - bw // 2, body_cy - bh // 2))

    # 5. Articulated 2-Joint Dancing Arms + Waving Hands
    arm_wave = math.sin(beat_phase + char_idx * 1.1)
    for side in (-1, 1):
        sh_x = cur_x + side * int(36 * scale)
        sh_y = body_cy - int(12 * scale)
        elb_x = cur_x + side * int(62 * scale)
        elb_y = body_cy - int((18 + side * arm_wave * 18) * scale)
        hand_x = cur_x + side * int(82 * scale)
        hand_y = body_cy - int((48 + side * arm_wave * 34 + jump_val * 18) * scale)

        draw.line([(sh_x, sh_y), (elb_x, elb_y)], fill=arch["color"] + (255,), width=limb_w)
        draw.line([(elb_x, elb_y), (hand_x, hand_y)], fill=arch["color"] + (255,), width=limb_w)
        hr = max(4, int(11 * scale))
        draw.ellipse(
            [hand_x - hr, hand_y - hr, hand_x + hr, hand_y + hr],
            fill=(255, 250, 235, 255),
            outline=arch["color"] + (255,),
            width=max(1, int(2 * scale)),
        )

    # 6. 3D Shaded Head with Expressive Tilt
    head_cy = body_cy - int(74 * scale * squash_y)
    hw = max(16, int(rig["head"].width * scale * squash_x))
    hh = max(16, int(rig["head"].height * scale * squash_y))
    head_tilt = math.sin(beat_phase * 0.5 + char_idx) * 8.5
    head_sprite = rig["head"].resize((hw, hh), Image.Resampling.BILINEAR).rotate(
        head_tilt, expand=True, resample=Image.Resampling.BILINEAR
    )
    canvas_rgba.alpha_composite(head_sprite, (cur_x - head_sprite.width // 2, head_cy - head_sprite.height // 2))

    # 7. Spring-Physics Glowing Antennae
    ant_sway = int(math.sin(t_sec * 10.5 + char_idx) * 16 * scale)
    for side in (-1, 1):
        ax0 = cur_x + side * int(18 * scale)
        ay0 = head_cy - int(38 * scale)
        ax1 = cur_x + side * int(42 * scale) + ant_sway
        ay1 = head_cy - int(78 * scale)
        draw.line([(ax0, ay0), (ax1, ay1)], fill=arch["stripe"] + (255,), width=max(2, int(4 * scale)))
        tr = max(4, int(9 * scale))
        draw.ellipse(
            [ax1 - tr, ay1 - tr, ax1 + tr, ay1 + tr],
            fill=arch["ant_tip"] + (255,),
            outline=(255, 255, 255, 230),
            width=max(1, int(2 * scale)),
        )

    # 8. Glossy 3D Pixar Eyes with Natural Periodic Blink
    is_blinking = math.sin(t_sec * 3.4 + char_idx * 1.9) > 0.94
    for side in (-1, 1):
        ex = cur_x + side * int(18 * scale)
        ey = head_cy - int(4 * scale)
        erx = max(3, int(13 * scale))
        ery = max(2, int((2 if is_blinking else 15) * scale))
        draw.ellipse([ex - erx, ey - ery, ex + erx, ey + ery], fill=(255, 255, 255, 255))
        if not is_blinking:
            pr = max(2, int(8 * scale))
            look_x = int(math.sin(t_sec * 2.5) * 3 * scale)
            draw.ellipse([ex - pr + look_x, ey - pr, ex + pr + look_x, ey + pr], fill=(15, 23, 42, 255))
            cr1 = max(1, int(3.5 * scale))
            draw.ellipse(
                [ex - pr // 2 - cr1, ey - pr // 2 - cr1, ex - pr // 2 + cr1, ey - pr // 2 + cr1],
                fill=(255, 255, 255, 255),
            )

    # 9. Real-Time Audio-Envelope Lip-Synced Singing Mouth
    mouth_open = 0.22 + 0.78 * vocal_env * (0.65 + 0.35 * abs(math.sin(t_sec * 16.0 + char_idx * 0.4)))
    mx = cur_x
    my = head_cy + int(22 * scale)
    mrx = max(4, int(14 * scale * (0.85 + 0.25 * mouth_open)))
    mry = max(2, int(11 * scale * mouth_open))
    draw.ellipse([mx - mrx, my - mry, mx + mrx, my + mry], fill=(135, 18, 35, 255))
    if mouth_open > 0.35:
        trx = max(2, int(mrx * 0.65))
        try_ = max(1, int(mry * 0.55))
        draw.ellipse([mx - trx, my + mry - try_ * 2, mx + trx, my + mry], fill=(255, 130, 155, 255))


def synthesize_full_song_audio(wav_path, total_dur_sec, scene_dur_sec):
    """
    Synthesizes stereo 44.1kHz WAV soundtrack combining gTTS Vietnamese vocals
    and 130 BPM Marimba/Bass/Drums backing track using pure Python array + FFmpeg.
    """
    sr = 44100
    bpm = 130.0
    beat_sec = 60.0 / bpm
    bar_sec = beat_sec * 4.0  # 1.84615s per 4-beat bar
    bar_samples = int(bar_sec * sr)

    melody_freqs = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 880.00, 783.99]
    bass_freqs = [130.81, 164.81, 196.00, 146.83]

    # Precompute 1 bar of stereo music (takes < 0.08s in pure Python)
    bar_pcm = array.array("h", [0] * (bar_samples * 2))
    half_beat = beat_sec * 0.5
    for i in range(bar_samples):
        t = i / float(sr)
        b_idx = int(t / half_beat)
        b_frac = (t / half_beat) - b_idx
        mf = melody_freqs[b_idx % len(melody_freqs)]
        m_env = math.exp(-b_frac * 6.5)
        marimba = (math.sin(2.0 * math.pi * mf * t) * 0.16 + math.sin(4.0 * math.pi * mf * t) * 0.05) * m_env

        q_idx = int(t / beat_sec)
        q_frac = (t / beat_sec) - q_idx
        bf = bass_freqs[q_idx % len(bass_freqs)]
        bass = math.sin(2.0 * math.pi * bf * t) * 0.18 * math.exp(-q_frac * 4.2)

        kick_f = 120.0 * math.exp(-q_frac * 14.0) + 48.0
        kick = math.sin(2.0 * math.pi * kick_f * q_frac) * math.exp(-q_frac * 18.0) * 0.18
        boing = math.sin(2.0 * math.pi * (240.0 + 180.0 * q_frac) * q_frac) * math.exp(-q_frac * 8.0) * 0.06

        val = max(-0.9, min(0.9, marimba + bass + kick + boing))
        sample_int = int(val * 24000)
        bar_pcm[i * 2] = sample_int
        bar_pcm[i * 2 + 1] = sample_int

    total_samples = int(total_dur_sec * sr)
    full_pcm = array.array("h")
    while len(full_pcm) < total_samples * 2:
        full_pcm.extend(bar_pcm)
    del full_pcm[total_samples * 2 :]

    # Layer gTTS Vietnamese vocals for each of the 10 scenes
    total_frames = int(total_dur_sec * FPS)
    env_per_frame = [0.35] * total_frames

    if HAS_GTTS:
        for idx, (num, _, lyric) in enumerate(VERSES):
            mp3_tmp = os.path.join(SCRATCH_DIR, f"verse_{num}.mp3")
            wav_tmp = os.path.join(SCRATCH_DIR, f"verse_{num}.wav")
            try:
                if not os.path.exists(wav_tmp):
                    tts = gTTS(text=lyric, lang="vi", slow=False)
                    tts.save(mp3_tmp)
                    subprocess.run(
                        [
                            FFMPEG_BIN,
                            "-y",
                            "-i",
                            mp3_tmp,
                            "-filter:a",
                            "atempo=1.24,asetrate=44100*1.06,aresample=44100",
                            "-ac",
                            "1",
                            "-ar",
                            str(sr),
                            wav_tmp,
                        ],
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                        check=True,
                    )
                if os.path.exists(wav_tmp):
                    with wave.open(wav_tmp, "rb") as wf:
                        raw_bytes = wf.readframes(wf.getnframes())
                    v_samples = array.array("h")
                    v_samples.frombytes(raw_bytes)

                    start_s = int((idx * scene_dur_sec + 0.08) * sr)
                    max_s = min(len(v_samples), int((scene_dur_sec - 0.12) * sr), total_samples - start_s)
                    for s_i in range(max_s):
                        dst = (start_s + s_i) * 2
                        v_val = int(v_samples[s_i] * 0.95)
                        mixed_l = max(-32700, min(32700, int(full_pcm[dst] * 0.58) + v_val))
                        mixed_r = max(-32700, min(32700, int(full_pcm[dst + 1] * 0.58) + v_val))
                        full_pcm[dst] = mixed_l
                        full_pcm[dst + 1] = mixed_r
            except Exception as e:
                print(f"[WARN] gTTS verse {num} error: {e}")

    with wave.open(wav_path, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(full_pcm.tobytes())

    # Compute per-frame RMS envelope for mouth lip-sync
    samples_per_frame = sr // FPS
    for f in range(total_frames):
        s0 = f * samples_per_frame * 2
        s1 = min(len(full_pcm), s0 + 400)
        if s1 > s0:
            peak = max(abs(full_pcm[k]) for k in range(s0, s1, 8)) / 32768.0
            env_per_frame[f] = min(1.0, max(0.2, peak * 1.35))

    return env_per_frame


def render_video_file(out_mp4_path, wav_path, env_per_frame, scene_dur_sec, rigs, bg_plates, fonts):
    total_dur = scene_dur_sec * TOTAL_SCENES
    total_frames = int(total_dur * FPS)

    cmd = [
        FFMPEG_BIN,
        "-y",
        "-f",
        "rawvideo",
        "-vcodec",
        "rawvideo",
        "-s",
        f"{W}x{H}",
        "-pix_fmt",
        "rgb24",
        "-r",
        str(FPS),
        "-i",
        "-",
        "-i",
        wav_path,
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "17",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-shortest",
        "-movflags",
        "+faststart",
        out_mp4_path,
    ]

    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)

    for f in range(total_frames):
        t_sec = f / float(FPS)
        scene_idx = min(TOTAL_SCENES - 1, int(t_sec / scene_dur_sec))
        scene_local_t = t_sec - scene_idx * scene_dur_sec
        scene_prog = scene_local_t / scene_dur_sec
        count_n, headline, lyric = VERSES[scene_idx]

        plate = bg_plates[scene_idx % len(bg_plates)]
        zoom = 1.02 + 0.05 * scene_prog
        crop_w = int(W / zoom)
        crop_h = int(H / zoom)
        pan_x = int((W - crop_w) * (0.5 + 0.35 * math.sin(t_sec * 0.6)))
        pan_y = int((H - crop_h) * 0.5)
        bg_cropped = plate.crop((pan_x, pan_y, pan_x + crop_w, pan_y + crop_h)).resize(
            (W, H), Image.Resampling.BILINEAR
        )
        frame_rgba = bg_cropped.convert("RGBA")

        p_draw = ImageDraw.Draw(frame_rgba)
        for p_i in range(16):
            px = int((p_i * 137 + t_sec * 55 * (1 + (p_i % 3) * 0.3)) % W)
            py = int((p_i * 89 + math.sin(t_sec * 2.2 + p_i) * 45) % (H * 0.75))
            pr = 3 + (p_i % 4) * 2
            alpha = int(110 + 95 * math.sin(t_sec * 4.0 + p_i))
            p_draw.ellipse([px - pr, py - pr, px + pr, py + pr], fill=(255, 245, 150, alpha))

        vocal_env = float(env_per_frame[min(len(env_per_frame) - 1, f)])
        if count_n <= 5:
            rows = 1
            cols = count_n
            char_scale = 1.18 if count_n == 1 else (1.05 if count_n == 2 else (0.94 if count_n <= 4 else 0.85))
        else:
            rows = 2
            cols = int(math.ceil(count_n / 2.0))
            char_scale = 0.76 if count_n <= 8 else 0.70

        for i in range(count_n):
            if rows == 1:
                r_idx = 0
                c_idx = i
                items_in_row = count_n
                ground_y = H * 0.76
                span_w = W * (0.58 if items_in_row <= 3 else 0.74)
                start_x = (W - span_w) * 0.5
                cx = W * 0.5 if items_in_row == 1 else start_x + (c_idx / float(items_in_row - 1)) * span_w
            else:
                r_idx = 0 if i < cols else 1
                c_idx = i if i < cols else (i - cols)
                items_in_row = cols if r_idx == 0 else (count_n - cols)
                ground_y = H * 0.58 if r_idx == 0 else H * 0.81
                span_w = W * 0.72
                start_x = (W - span_w) * 0.5
                stagger = -38.0 if r_idx == 0 else 38.0
                cx = (
                    W * 0.5 + stagger
                    if items_in_row == 1
                    else start_x + (c_idx / float(items_in_row - 1)) * span_w + stagger
                )

            eff_scale = char_scale * (0.84 if (rows == 2 and r_idx == 0) else 1.0)
            rig = rigs[i % len(rigs)]
            draw_articulated_3d_insect(
                frame_rgba,
                rig,
                cx,
                ground_y,
                eff_scale,
                t_sec,
                i,
                vocal_env,
            )

            jump_now = max(0.0, math.sin(t_sec * 13.6135 + i * 0.75)) * 68.0 * eff_scale
            tag_y = int(ground_y - jump_now - 235 * eff_scale)
            tag_r = int(22 * eff_scale)
            p_draw.ellipse(
                [int(cx) - tag_r, tag_y - tag_r, int(cx) + tag_r, tag_y + tag_r],
                fill=(245, 158, 11, 235),
                outline=(255, 255, 255, 255),
                width=3,
            )
            p_draw.text(
                (int(cx), tag_y),
                str(i + 1),
                font=fonts["tag"],
                fill=(255, 255, 255, 255),
                anchor="mm",
            )

        # Pixar-Style 3D Extruded Counting Badge (Top-Left) + Warm Story Title Ribbon
        badge_cx, badge_cy = 155, 145
        badge_r = int(84 * (1.0 + 0.06 * math.sin(t_sec * 13.6)))
        p_draw.ellipse(
            [badge_cx - badge_r, badge_cy - badge_r + 10, badge_cx + badge_r, badge_cy + badge_r + 10],
            fill=(146, 64, 14, 220),
        )
        p_draw.ellipse(
            [badge_cx - badge_r, badge_cy - badge_r, badge_cx + badge_r, badge_cy + badge_r],
            fill=(250, 204, 21, 255),
            outline=(255, 255, 255, 255),
            width=7,
        )
        p_draw.text(
            (badge_cx, badge_cy + 4),
            str(count_n),
            font=fonts["giant_num"],
            fill=(124, 45, 18, 255),
            anchor="mm",
        )
        p_draw.text(
            (badge_cx - 3, badge_cy),
            str(count_n),
            font=fonts["giant_num"],
            fill=(255, 255, 255, 255),
            anchor="mm",
        )

        p_draw.rounded_rectangle(
            [260, 96, 1080, 178],
            radius=40,
            fill=(20, 83, 45, 215),
            outline=(134, 239, 172, 245),
            width=4,
        )
        p_draw.text(
            (670, 137),
            headline,
            font=fonts["headline"],
            fill=(254, 240, 138, 255),
            anchor="mm",
        )

        # Bouncing Karaoke Kids Subtitle Pill at Bottom
        p_draw.rounded_rectangle(
            [180, H - 132, W - 180, H - 36],
            radius=48,
            fill=(15, 23, 42, 210),
            outline=(250, 204, 21, 240),
            width=4,
        )
        p_draw.text(
            (W // 2, H - 84),
            f"♪  {lyric}  ♪",
            font=fonts["lyric"],
            fill=(255, 255, 255, 255),
            anchor="mm",
        )

        rgb_bytes = frame_rgba.convert("RGB").tobytes()
        proc.stdin.write(rgb_bytes)

    proc.stdin.close()
    proc.wait()


def main():
    print("[1/4] Pre-building 3D Ray-Shaded Phong/Subsurface Insect Rigs...")
    rigs = prebuild_insect_rig_parts()

    bg1 = Image.open(STAGE_PLATE_1).convert("RGB").resize((W, H), Image.Resampling.LANCZOS)
    bg2 = Image.open(STAGE_PLATE_2).convert("RGB").resize((W, H), Image.Resampling.LANCZOS)
    bg_plates = [bg1, bg2]

    fonts = {
        "giant_num": load_vietnamese_font(86, bold=True),
        "headline": load_vietnamese_font(34, bold=True),
        "lyric": load_vietnamese_font(34, bold=True),
        "tag": load_vietnamese_font(22, bold=True),
    }

    wav_full = os.path.join(SCRATCH_DIR, "song_36s.wav")
    print("[2/4] Synthesizing Vietnamese Counting Song + 130 BPM Marimba Audio (36.0s)...")
    env_full = synthesize_full_song_audio(wav_full, 36.0, 3.6)

    mp4_full_target = os.path.join(
        TARGET_DIR, "VIDEO_HOAT_HINH_3D_CON_TRUNG_NHAY_MUA_HAT_DEM_SO_1_DEN_10.mp4"
    )
    print(f"[3/4] Rendering Full 36s 1080p30 3D Skeletal Insect Video -> {mp4_full_target} ...")
    render_video_file(mp4_full_target, wav_full, env_full, 3.6, rigs, bg_plates, fonts)

    wav_20s = os.path.join(SCRATCH_DIR, "song_20s.wav")
    print("[4/4] Rendering 20s Highlight Inspection Video (20.0s, Numbers 1..10)...")
    env_20s = synthesize_full_song_audio(wav_20s, 20.0, 2.0)
    mp4_20s_target = os.path.join(TARGET_DIR, "VIDEO_CON_TRUNG_3D_DEM_SO_20S.mp4")
    render_video_file(mp4_20s_target, wav_20s, env_20s, 2.0, rigs, bg_plates, fonts)

    shutil.copy2(
        mp4_full_target,
        os.path.join(PUBLIC_DIR, "VIDEO_HOAT_HINH_3D_CON_TRUNG_NHAY_MUA_HAT_DEM_SO_1_DEN_10.mp4"),
    )
    shutil.copy2(mp4_20s_target, os.path.join(PUBLIC_DIR, "VIDEO_CON_TRUNG_3D_DEM_SO_20S.mp4"))
    shutil.copy2(
        mp4_full_target,
        os.path.join(ARTIFACT_DIR, "VIDEO_HOAT_HINH_3D_CON_TRUNG_NHAY_MUA_HAT_DEM_SO_1_DEN_10.mp4"),
    )
    print("[SUCCESS] Both 36s Full & 20s Highlight 3D Insect Counting MP4 videos rendered!")


if __name__ == "__main__":
    main()
