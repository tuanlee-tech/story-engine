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
3. **Visual (Thu thập & Sinh ảnh) - Thứ tự ưu tiên bắt buộc:**
   - **Tầng 1 (Tự sinh):** Dùng API (`gemini-3.1-flash-image`) hoặc Agent Tool (`generate_image`).
   - **Tầng 2 (Hỏi người dùng trước):** Nếu không tự sinh được (lỗi API, hết quota, hoặc ảnh AI không đúng thần thái nhân vật), **TRƯỚC TIÊN PHẢI HỎI NGƯỜI DÙNG** cung cấp ảnh (qua công cụ `ask_question` hoặc hỏi trực tiếp).
   - **Tầng 3 (Tìm trên mạng):** Nếu người dùng không cung cấp ảnh hoặc bảo AI tự tìm, tiến hành tìm kiếm trên mạng với thứ tự ưu tiên:
     - 🥇 **Ưu tiên 1: TÌM ẢNH CHÂN DUNG (Portrait)** — Tranh vẽ chân dung nghệ thuật, tranh sơn dầu hoặc ảnh chân dung có hồn, ánh mắt và cảm xúc sống động.
     - 🥈 **Ưu tiên 2: ẢNH TƯỢNG (Statue / Bust)** — Chỉ khi KHÔNG TÌM THẤY ảnh chân dung đạt chuẩn mới dùng ảnh tượng đá/đồng.
   - **Hậu kỳ:** Tách nền bằng `python3 scripts/remove-bg.py <ảnh> public/<tên>.png` và kiểm tra chống tràn khung bằng `python3 scripts/check-overflow.py public/<tên>.png`.
4. **Voice (Sinh giọng đọc & Nhịp điệu lắng đọng):**
   - **Mạch đọc truyền cảm, có khoảng lặng:** Tuyệt đối không đọc dồn dập "cho hết chữ". Kịch bản tận dụng dấu câu `,`, `...`, `?` để tạo nhịp thở.
   - **Tự động chèn khoảng lặng:** Script `npm run voice` (`scripts/gen-voice.py`) sẽ tự động đệm khoảng lặng **0.75s – 1.2s** giữa các câu để người nghe ngẫm nghĩ và nhạc nền ngân vang sâu lắng.
   - **Ưu tiên 1:** Dùng API Gemini TTS (`gemini-3.8-flash-tts`).
   - **Fallback bắt buộc khi hết Quota / Rate Limit (429) / lỗi:** **LUÔN LUÔN DÙNG VieNeu-TTS** (Local Neural Voice offline, giọng chuẩn phòng thu).
   - **QUY TẮC CẤM:** **TUYỆT ĐỐI KHÔNG DÙNG edge-tts (edgeTTS)** trong mọi trường hợp vì chất lượng máy móc, ngữ điệu thiếu cảm xúc.
   - Thực thi qua script: `npm run voice` hoặc `python3 scripts/gen-voice.py`. Cài đặt nếu chưa có:
   ```bash
   pip install --user --break-system-packages vieneu
   ```
   Dùng code Python: `from vieneu import Vieneu; tts = Vieneu(); audio = tts.infer(line, voice=_vieneu_preset(tts))` để tạo giọng đọc tự nhiên.
5. **Music (Nhạc nền):** Dùng `wget` để tải nhạc.
6. **Animation & SFX:** Đã được gắn trong kịch bản. Chạy `npm run sfx` để Agent tự động tổng hợp (procedural audio) các file âm thanh theo bối cảnh.
7. **Timeline:** Chạy `npm run timeline`.
8. **QA:** Đảm bảo thư mục đủ file.
9. **Render MP4:** Chạy `npm run build` xuất file `-14 LUFS`.

## Các Mẫu Prompt Đầu Vào Chuẩn
Xem tài liệu mẫu tại [PROMPTS.md](../../PROMPTS.md) để biết các mẫu prompt chuẩn kích hoạt kỹ năng này cho các thể loại video (Triết gia / Stoic quotes, hoặc Truyện kể nhiều phân cảnh).
