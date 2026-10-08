# 🤖 Mẫu Prompt chuẩn cho AI Agent (AI Agent Prompts)

Tài liệu này chứa các mẫu prompt đã được tối ưu hóa để ra lệnh cho **AI Agent** (Google Antigravity, Claude Code, Cursor, Copilot Workspace...) tự động thực hiện quy trình sản xuất video từ A đến Z trên dự án `story-engine`.

---

## 🏛 Mẫu 1: Prompt làm Video Triết gia / Stoic Quotes (Template `philosopher`)
> **Mục đích:** Dành cho video danh ngôn, bài học triết học khắc kỷ, châm ngôn sống (Marcus Aurelius, Seneca, Plato, Khổng Tử, Lão Tử...).  
> **Đặc trưng:** Tượng đá/đồng tách nền trượt vào chậm rãi (`Ken Burns Drift`), Kinetic Typography font Cinzel xước rỉ hoài cổ (`grunge mask`), Highlight vệt cọ dính liền khối 2 từ (`@remotion/rough-notation`), nếp giấy cũ và phổ quang ánh bạc (`@remotion/effects`).

```markdown
Bạn là AI Video Producer chuyên nghiệp. Hãy sử dụng dự án `story-engine` hiện tại để tạo một video hoàn chỉnh theo phong cách Triết gia (Philosopher Template) với thông tin sau:

- **Chủ đề / Nhân vật:** [Điền tên triết gia & chủ đề, ví dụ: Marcus Aurelius - Vượt qua lo âu và làm chủ nghịch cảnh]
- **Định dạng:** Ngang (16:9, 1920x1080)
- **Thời lượng:** ~20 - 30 giây (khoảng 3 - 5 câu đắt giá)

### Yêu cầu thực thi chi tiết (Tự động từ A - Z):
1. **Kịch bản & Cấu hình:**
   - Viết kịch bản tiếng Việt súc tích, uyên bác vào `input/scenes.md`, mỗi câu có từ khóa nhấn mạnh đánh dấu dạng `[từ khóa]`.
   - Cập nhật `input/project.json` kích hoạt `"template": "philosopher"`, định dạng `"horizontal"`.
2. **Tượng Triết gia (Visual):**
   - Sinh 1 ảnh tượng đá/đồng bán thân cổ điển của triết gia bằng công cụ sinh ảnh (`generate_image`).
   - Tách nền trong suốt bằng script `python3 scripts/remove-bg.py <ảnh_gốc> public/<ten_triet_gia>.png`.
   - Khai báo tên ảnh vào `templateOptions.philosopher.image` trong `input/project.json`.
3. **Giọng đọc & Phụ đề:**
   - Sinh giọng đọc trầm ấm, truyền cảm vào `public/audio/voice.mp3`.
   - Tạo file phụ đề khớp mốc thời gian `input/voice.srt`.
4. **Biên tập Timeline & SFX:**
   - Chạy `npm run scenes` và `npm run timeline`.
   - Tổng hợp âm thanh SFX bổ trợ nếu có (`npm run sfx`).
5. **Render & Hoàn tất:**
   - Chạy `npm run build` để render Remotion (`out/raw.mp4`) và chuẩn hóa loudness -14 LUFS (`out/final.mp4`).
   - Báo cáo kết quả và xác nhận video đã sẵn sàng xem.
```

---

## 🎬 Mẫu 2: Prompt làm Video Kể chuyện Nhiều phân cảnh (Standard Storyboard)
> **Mục đích:** Dành cho video truyện cổ tích, lịch sử, bài học cuộc sống, khoa học viễn tưởng với chuỗi hình ảnh/video minh họa theo từng câu thoại.  
> **Đặc trưng:** Mỗi câu thoại là một phân cảnh độc lập, camera tự động chuyển động Ken Burns, chuyển cảnh whoosh/dissolve, SFX bám sát nội dung.

```markdown
Hãy thực thi kỹ năng `auto-video-gen` trong dự án `story-engine` để sản xuất một video kể chuyện phân cảnh hoàn chỉnh:

- **Ý tưởng / Cốt truyện:** [Điền nội dung cốt truyện, ví dụ: Huyền thoại gươm báu Thuận Thiên và sự tích Hồ Gươm]
- **Định dạng:** [vertical (9:16 Shorts/TikTok) HOẶC horizontal (16:9 YouTube)]
- **Phong cách hình ảnh:** [Ví dụ: Sơn dầu cổ điển / Cinematic Concept Art / Anime Dark Fantasy]
- **Số phân cảnh:** 4 - 6 scenes

### Quy trình yêu cầu Agent tuân thủ:
1. Đọc kỹ `rules/AGENT_RULES.md` và `rules/STYLE_BIBLE.md` để đảm bảo quy tắc độ dài câu và prompt sinh ảnh đồng nhất.
2. Soạn `input/scenes.md` với đầy đủ mô tả hình ảnh, lời thoại dẫn chuyện và SFX tương ứng.
3. Chạy `npm run scenes` để sinh danh sách prompt.
4. Sinh ảnh cho từng scene và lưu vào `public/images/001.jpg`, `002.jpg`,...
5. Tạo audio voice đọc kịch bản (`public/audio/voice.mp3`) và file SRT đồng bộ (`input/voice.srt`).
6. Biên soạn timeline qua `npm run timeline`, tự động tạo SFX qua `npm run sfx`.
7. Kiểm tra QA và chạy `npm run build` để xuất video cuối cùng ra `out/final.mp4`.
```

---

## ⚡ Mẫu 3: Prompt "One-Shot" Ra lệnh Nhanh
> **Mục đích:** Thích hợp khi bạn muốn ra lệnh ngắn gọn chỉ trong 1-2 câu mà Agent vẫn hiểu và làm đúng template.

```markdown
Thực hiện toàn bộ quy trình auto-video-gen để làm 1 video triết học về [Seneca - Giá trị của thời gian]. Dùng template "philosopher", tự tạo ảnh tượng đá tách nền, sinh kịch bản tiếng Việt, voice, timeline và render ra out/final.mp4.
```

---

## 🛠 Bảng tham số tùy biến nhanh trong `input/project.json`

| Tham số | Giá trị gợi ý | Ý nghĩa |
|---|---|---|
| `format` | `"horizontal"` hoặc `"vertical"` | 16:9 (YouTube) hoặc 9:16 (Shorts/TikTok/Reels) |
| `template` | `"philosopher"` hoặc `"default"` | Chọn kiểu video triết học hoặc video phân cảnh |
| `templateOptions.philosopher.image` | `"marcus.png"`, `"seneca.png"` | Ảnh tượng PNG đã tách nền trong suốt |
| `subtitleStyle` | `"box"` hoặc `"yellow"` | Kiểu phụ đề cho template mặc định |
| `bgmVolume` | `0.1` đến `0.15` | Âm lượng nhạc nền so với giọng đọc |
