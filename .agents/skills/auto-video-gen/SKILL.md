---
name: auto-video-gen
description: Tự động hóa toàn bộ quy trình tạo video (Research -> Render MP4) cho project story-engine bằng Agent Tools.
---

# Hướng dẫn Kỹ năng: Auto Video Generation

Kỹ năng này giúp Agent biến một ý tưởng ngắn gọn thành một video hoàn chỉnh (định dạng dọc hoặc ngang) thông qua quy trình 11 bước tự động hoàn toàn.

## Yêu cầu (Prerequisites)
- Dự án `story-engine` phải nằm ở thư mục hiện tại.
- Đọc file `input/project.json` để biết định dạng (`vertical` hay `horizontal`).
- Tham khảo `rules/AGENT_RULES.md` để biết luật độ dài câu.
- Tham khảo `rules/STYLE_BIBLE.md` để lấy hậu tố hình ảnh (`STYLE_SUFFIX`).

## Quy trình Thực thi (11 Bước)

1. **Research & Script:** 
   Viết kịch bản nội dung vào `input/scenes.md`.
2. **Storyboard & Phân tích:** 
   Chạy `npm run scenes`.
3. **Visual (Sinh ảnh):** 
   Dùng API (`gemini-3.1-flash-image`). Nếu Rate Limit, DÙNG NGAY Agent Tool (`generate_image`).
4. **Voice (Sinh giọng đọc):** 
   - **Ưu tiên 1:** Dùng API Gemini TTS (`gemini-3.8-flash-tts`).
   - **Fallback bắt buộc khi hết Quota / Rate Limit (429) / lỗi:** **LUÔN LUÔN DÙNG VieNeu-TTS** (Local Neural Voice offline, giọng chuẩn phòng thu).
   - **QUY TẮC CẤM:** **TUYỆT ĐỐI KHÔNG DÙNG edge-tts (edgeTTS)** trong mọi trường hợp vì chất lượng máy móc, ngữ điệu thiếu cảm xúc.
   - Thực thi qua script: `npm run voice` hoặc `python3 scripts/gen-voice.py`. Cài đặt nếu chưa có:
   ```bash
   pip install --user --break-system-packages vieneu
   ```
   Dùng code Python: `from vieneu import Vieneu; tts = Vieneu(); audio = tts.infer(line, voice="Hải Đăng")` để tạo giọng đọc tự nhiên.
5. **Music (Nhạc nền):** Dùng `wget` để tải nhạc.
6. **Animation & SFX:** Đã được gắn trong kịch bản. Chạy `npm run sfx` để Agent tự động tổng hợp (procedural audio) các file âm thanh theo bối cảnh.
7. **Timeline:** Chạy `npm run timeline`.
8. **QA:** Đảm bảo thư mục đủ file.
9. **Render MP4:** Chạy `npm run build` xuất file `-14 LUFS`.

## Các Mẫu Prompt Đầu Vào Chuẩn
Xem tài liệu mẫu tại [PROMPTS.md](../../PROMPTS.md) để biết các mẫu prompt chuẩn kích hoạt kỹ năng này cho các thể loại video (Triết gia / Stoic quotes, hoặc Truyện kể nhiều phân cảnh).
