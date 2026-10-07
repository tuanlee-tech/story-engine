#!/usr/bin/env python3
"""Tổng hợp 3 SFX mặc định (không dính bản quyền): swoosh, riser, hit → public/sfx/*.wav
Chạy: npm run sfx   (cần numpy). Có thể thay bằng file của bạn cùng tên."""
import os
import wave

import numpy as np

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "sfx")
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)


def one_pole_sweep(x, cutoff):
    """Lowpass 1 cực với tần số cắt thay đổi theo thời gian."""
    a = 1.0 - np.exp(-2.0 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    s = 0.0
    for i in range(len(x)):
        s += a[i] * (x[i] - s)
        y[i] = s
    return y


def save(name, left, right):
    st = np.stack([left, right], axis=1)
    st = st / (np.max(np.abs(st)) + 1e-9) * 0.7  # ~ -3 dBFS
    pcm = (st * 32767).astype("<i2")
    with wave.open(os.path.join(OUT, name), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print("✓", name, f"{len(st) / SR:.2f}s")


# ---- swoosh: nhiễu trắng quét tần số, pan trái → phải ----
d = 0.7
n = int(SR * d)
t = np.linspace(0, 1, n)
noise = rng.standard_normal(n)
cut = 300 * (30 ** np.sin(np.pi * t) ** 1.0)  # 300 → 9000 → 300 Hz (hình chuông)
lp = one_pole_sweep(noise, np.clip(cut, 80, 12000))
hp = lp - one_pole_sweep(lp, np.full(n, 250.0))
env = np.sin(np.pi * t) ** 2.2
sw = hp * env
pan = t
save("swoosh.wav", sw * np.cos(pan * np.pi / 2), sw * np.sin(pan * np.pi / 2))

# ---- riser: nhiễu + tone, cutoff tăng dần, kết thúc dứt khoát ----
d = 1.6
n = int(SR * d)
t = np.linspace(0, 1, n)
noise = rng.standard_normal(n)
lp = one_pole_sweep(noise, 250 * (40 ** t))
freq = 180 * (7 ** t)
phase = 2 * np.pi * np.cumsum(freq) / SR
tone = 0.25 * np.sin(phase) + 0.12 * np.sin(phase * 1.5)
env = (t ** 2.4) * np.minimum(1, (1 - t) * 40)
rs = (lp * 0.8 + tone) * env
save("riser.wav", rs, np.roll(rs, 90))

# ---- hit: sub-boom giảm tần + xung nhiễu ----
d = 0.9
n = int(SR * d)
t = np.linspace(0, d, n)
f = 45 + 110 * np.exp(-t * 14)
boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5.5)
burst = one_pole_sweep(rng.standard_normal(n), np.full(n, 2500.0)) * np.exp(-t * 38) * 0.6
h = boom + burst
save("hit.wav", h, h)
