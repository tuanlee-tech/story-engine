#!/usr/bin/env python3
"""Self-check: anh tuong co tran sang nua chu / cut dau trong template philosopher?

Mo phong hinh hoc cua PhilosopherTemplate (video 1920x1080):
- Hop tuong: 50% ben trai  -> 960x1080, anh objectFit=contain, neo trai-day.
- Vung chu bat dau tu left 45% -> x = 864.
- Wrapper co translateX (tx) va scale don (s) lay goc giua hop (480, 540).

Dung: python3 scripts/check-overflow.py public/marcus.png [--scale 0.92 1.0] [--tx -60 -20]
Exit 1 neu tran vung chu hoac cut top (de chan render bang CI).
"""
import sys
from PIL import Image

VW, VH = 1920, 1080
BOX_W, BOX_H = VW * 0.5, VH          # 960 x 1080
TEXT_X = VW * 0.45                   # 864: bien trai vung chu
ORIGIN_X, ORIGIN_Y = BOX_W / 2, BOX_H / 2


def check(img_path, s, tx, label):
    im = Image.open(img_path)
    W, H = im.size
    r = min(BOX_W / W, BOX_H / H)    # contain
    w0, h0 = W * r, H * r
    # rect goc (neo trai-day) truoc scale, cong translateX
    x0, x1 = tx, tx + w0
    y0, y1 = BOX_H - h0, BOX_H
    # scale don lay goc giua hop
    X = lambda x: ORIGIN_X + (x - ORIGIN_X) * s
    Y = lambda y: ORIGIN_Y + (y - ORIGIN_Y) * s
    rx0, rx1 = X(x0), X(x1)
    ry0, ry1 = Y(y0), Y(y1)
    overflow_right = max(0.0, rx1 - TEXT_X)
    crop_top = max(0.0, 0.0 - ry0)
    crop_bottom = max(0.0, ry1 - BOX_H)
    status = "OK " if (overflow_right <= 1 and crop_top <= 1) else "LOI"
    print(f"[{status}] {label}: anh {W}x{H} -> base {w0:.0f}x{h0:.0f}, "
          f"s={s} tx={tx} | phai={rx1:.0f} (tran vung chu {overflow_right:.0f}px) | "
          f"cut-top {crop_top:.0f}px cut-bottom {crop_bottom:.0f}px")
    return overflow_right <= 1 and crop_top <= 1


def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        sys.exit(2)
    img = args[0]
    s0, s1 = 0.92, 1.0
    t0, t1 = -60, -20
    if "--scale" in args:
        i = args.index("--scale")
        s0, s1 = float(args[i + 1]), float(args[i + 2])
    if "--tx" in args:
        i = args.index("--tx")
        t0, t1 = float(args[i + 1]), float(args[i + 2])
    ok1 = check(img, s0, t0, "dau video")
    ok2 = check(img, s1, t1, "cuoi video")
    if not (ok1 and ok2):
        print("KET LUAN: TRAN KHUNG — giam scale hoac dich trai them.")
        sys.exit(1)
    print("KET LUAN: vua khung.")


if __name__ == "__main__":
    main()
