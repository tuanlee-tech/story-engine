import os
import re
import subprocess

# Thư mục chứa sfx
os.makedirs("public/sfx", exist_ok=True)

# Từ điển các thuật toán tổng hợp âm thanh (Procedural Audio bằng FFmpeg lavfi)
# Dùng để tự sinh các âm thanh theo ngữ cảnh thay vì dùng file cứng.
PROCEDURAL_SFX = {
    "swoosh": "0.5*random(0)*exp(-5*t)*sin(800*t)",
    "hit": "random(0)*exp(-10*t)*sin(100*t)",
    "riser": "0.5*sin(100*t + 100*t*t)*exp(-0.2*t)",
    "rumble": "0.5*random(0)*exp(-1*t)*sin(80*t)",
    "heartbeat": "0.8*sin(50*t)*exp(-10*t) + 0.8*sin(50*(t-0.3))*exp(-10*(t-0.3))",
    "crash": "0.4*random(0)*exp(-8*t)*sin(800*t) + 0.3*random(0)*exp(-10*t)",
    "metal": "0.3*sin(1500*t)*exp(-5*t) + 0.1*random(0)*exp(-15*t)",
    "wind": "0.2*random(0)*sin(1000*t)",
    "magic": "0.3*sin(800*t)*sin(10*t) + 0.2*sin(1200*t)",
    "punch": "random(0)*exp(-15*t)*sin(50*t)",
    "thunder": "0.8*random(0)*exp(-2*t)*sin(40*t)",
    "beep": "0.5*sin(1000*t)*exp(-5*t)"
}

def generate_sfx(name):
    path = f"public/sfx/{name}.wav"
    if os.path.exists(path):
        print(f"✓ SFX '{name}' đã tồn tại.")
        return

    # Lấy công thức lavfi. Nếu không có trong từ điển, dùng thuật toán default_synth
    formula = PROCEDURAL_SFX.get(name.lower())
    if not formula:
        print(f"⚠ SFX '{name}' không có trong thư viện chuẩn. Đang tổng hợp âm thanh tự động...")
        # Tạo một âm thanh synth ngẫu nhiên nhẹ nhàng dựa trên hash của tên
        seed = sum(ord(c) for c in name) % 1000
        formula = f"0.4*sin({500 + seed}*t)*exp(-3*t)"
        
    duration = 1.5 if name not in ['heartbeat', 'wind', 'rumble'] else 3.0
    
    print(f"⚙ Đang sinh âm thanh: {name}.wav...")
    cmd = [
        "ffmpeg", "-y", "-v", "error",
        "-f", "lavfi", "-i", f"aevalsrc='{formula}':s=48000:d={duration}",
        path
    ]
    
    subprocess.run(cmd)
    if os.path.exists(path):
        print(f"✓ Đã tạo thành công {path}")
    else:
        print(f"✗ Lỗi khi tạo {path}")

def main():
    scenes_file = "input/scenes.md"
    if not os.path.exists(scenes_file):
        print("✗ Không tìm thấy input/scenes.md")
        return
        
    content = open(scenes_file, "r", encoding="utf-8").read()
    
    # Tìm tất cả các SFX: <name> trong scenes.md
    sfx_matches = set(re.findall(r"(?i)^SFX\s*:\s*([a-zA-Z0-9_-]+)", content, re.MULTILINE))
    
    # Cộng thêm các SFX mặc định nếu có dùng auto (do parse-scenes có cơ chế auto swoosh/hit/riser)
    sfx_matches.update(["swoosh", "hit", "riser"])
    
    print(f"Phát hiện {len(sfx_matches)} loại SFX cần thiết cho kịch bản: {', '.join(sfx_matches)}")
    
    for sfx_name in sfx_matches:
        if sfx_name.lower() == "none" or sfx_name.lower() == "auto":
            continue
        generate_sfx(sfx_name)
        
    print("\n✓ Hoàn tất việc chuẩn bị SFX cho kịch bản!")

if __name__ == "__main__":
    main()
