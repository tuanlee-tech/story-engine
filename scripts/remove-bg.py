#!/usr/bin/env python3
"""
Tiện ích xóa phông nền (Remove BG) cho ảnh.
Được sử dụng cho các template như 'philosopher' hoặc các video phong cách Vox.

Yêu cầu cài đặt:
pip install rembg pillow
"""
import sys
import os

try:
    from rembg import remove
    from PIL import Image
except ImportError:
    print("Thiếu thư viện! Hãy chạy: pip install rembg pillow")
    sys.exit(1)

def main():
    if len(sys.argv) < 3:
        print("Sử dụng: python scripts/remove-bg.py <input_image> <output_image>")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    if not os.path.exists(input_path):
        print(f"Lỗi: Không tìm thấy file {input_path}")
        sys.exit(1)

    print(f"Đang xử lý tách nền: {input_path} ...")
    try:
        input_image = Image.open(input_path)
        output_image = remove(input_image)
        output_image.save(output_path, "PNG")
        print(f"Thành công! Đã lưu ảnh trong suốt tại: {output_path}")
    except Exception as e:
        print(f"Lỗi khi xử lý ảnh: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
