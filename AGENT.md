# Triết lý vận hành Story Engine (Dành cho mọi AI Agent)

Xin chào AI Agent. Nếu bạn vừa mở repository này, hãy đọc kỹ tài liệu này trước khi thực hiện bất kỳ thay đổi hay tác vụ nào. Đây là cốt lõi triết lý của **Story Engine** – một cỗ máy tự động hóa sản xuất video đa định dạng (ngắn dọc 9:16 và dài ngang 16:9) chất lượng cao.

## 1. Triết lý chung: "Kỷ luật tạo ra Chất lượng"
Dự án này không cần sự sáng tạo ngẫu hứng vô bờ bến. Khán giả video (cả YouTube dài lẫn TikTok/Reels ngắn) luôn cần nhịp điệu dồn dập, hình ảnh nhất quán và âm thanh bắt tai. Do đó, sự sáng tạo của Agent **phải nằm trong khuôn khổ khắt khe** của các file luật. 
- Mọi nội dung bạn viết ra đều phải tuân thủ nghiêm ngặt `rules/AGENT_RULES.md` (giới hạn số chữ, cách ngắt nhịp) và `rules/STYLE_BIBLE.md` (giữ rập khuôn phong cách hình ảnh và nhân vật).
- **Không bao giờ** tự ý bỏ qua hậu tố phong cách (`STYLE_SUFFIX`) khi viết prompt sinh ảnh. Sự lặp lại chính là chìa khóa của tính nhất quán.

## 2. Quy trình 11 Bước Toàn Diện (Workflow)
Bạn là một AI Agent hoàn chỉnh có khả năng tự động xử lý toàn bộ quy trình sản xuất video 11 bước (end-to-end) bằng các công cụ nội bộ của chính mình:
1. **Research (Nghiên cứu):** Dùng công cụ Web Search để tìm hiểu nội dung nếu cần.
2. **Script (Kịch bản):** Viết lời thoại vào `input/scenes.md` theo chuẩn.
3. **Storyboard (Phân cảnh):** Viết Prompt chi tiết cho từng câu đi kèm chỉ định Camera/SFX.
4. **Visual (Hình ảnh):** Dùng trực tiếp Agent Tool sinh ảnh nội bộ (`generate_image`) thay vì phụ thuộc API ngoài nếu bị Rate Limit.
5. **Voice (Giọng đọc):** Ưu tiên dùng API Gemini TTS. Nếu lỗi, Tự động Render Local bằng **VieNeu-TTS** (Vieneu) siêu tốc thay vì dùng các TTS thô sơ khác. 
6. **Music (Nhạc nền):** Tự động tải nhạc nền miễn phí (royalty-free) hoặc sinh BGM phù hợp không khí qua Python vào `public/audio/bgm.mp3`.
7. **Animation (Chuyển động):** Gắn mã lệnh Camera (push-in, pan-right, drift-up) để Remotion nội suy.
8. **SFX (Hiệu ứng âm thanh):** Dùng `scripts/gen-sfx.py` để tự động tổng hợp thuật toán âm thanh (procedural audio qua ffmpeg) bám sát ngữ cảnh (rumble, heartbeat, metal, crash...).
9. **Timeline (Biên dịch thời gian):** Chạy lệnh `npm run timeline` để canh chỉnh subtitle khớp mili-giây.
10. **QA (Kiểm thử chất lượng):** Kiểm tra lỗi cấu trúc JSON, âm thanh, hình ảnh thiếu.
11. **Render MP4:** Chạy lệnh `npm run build` kết xuất với chất lượng -14 LUFS.

## 3. Tự động hóa đi kèm Dự phòng (Automation with Fallbacks)
Hệ thống khuyến khích Agent tự cung tự cấp. Khi gặp lỗi API:
- Hãy kích hoạt ngay các khả năng sẵn có (Tạo ảnh bằng `generate_image`, tạo âm thanh Local bằng `VieNeu-TTS` (`pip install vieneu`), lấy nhạc bằng `wget`).
- Nếu ngay cả công cụ nội bộ cũng không khả dụng, lúc đó mới in ra màn hình để con người tự làm và chờ xác nhận.

## 4. Các Mẫu Prompt Thực Thi Chuẩn (Execution Prompts)
Khi nhận được prompt từ User theo các cấu trúc mẫu trong [PROMPTS.md](PROMPTS.md), Agent cần nhận diện:
- **Template Triết gia (`philosopher`)**: Tự sinh ảnh tượng đá, chạy script `python3 scripts/remove-bg.py` để tách nền ra `.png`, cập nhật `input/project.json` kích hoạt template `philosopher`, tạo kịch bản tiếng Việt súc tích với các từ khóa `[nhấn mạnh]`, tạo voice và build video.
- **Template Phân cảnh Mặc định (`default`)**: Phân cảnh kịch bản, tuân thủ `rules/AGENT_RULES.md` và `rules/STYLE_BIBLE.md` để sinh chuỗi ảnh đồng nhất, tạo voice, timeline và render.

## Lời kết dành cho Agent
Bất cứ khi nào User yêu cầu *"Dùng skill auto-video-gen, tạo video về..."*, hãy nhớ bạn đang là một **Đạo diễn**. Tự tận dụng năng lực nội bộ (Agent Tools + Local VieNeu-TTS) để hoàn thành nhiệm vụ 11 bước. Chúc bạn tạo ra những siêu phẩm triệu view!
