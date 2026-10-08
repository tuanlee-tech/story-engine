# Story Video Engine

Kịch bản + giọng đọc + ảnh AI → video kể chuyện hoàn chỉnh. Bản dựng lại theo kiến trúc của HAStudio, chạy bằng **Remotion**.

```
kịch bản ─► [AI Agent + rules/] ─► scenes.md ─► sentences.txt ─► TTS ─► voice.mp3 ─► Whisper ─► voice.srt
                                        └──────► prompts.txt  ─► Google Flow ─► public/images/001.png …
                                                                                        │
voice.srt + sentences.txt + images + nhạc nền ──► build-timeline ──► timeline.json ──► Remotion ──► raw.mp4 ──► finalize ──► final.mp4 (-14 LUFS)
```

## Cài đặt (1 lần)

Yêu cầu: Node 20+, FFmpeg (có `ffprobe`), Python 3 + numpy (chỉ để tạo SFX).

```bash
npm install
npm run sfx          # Sinh procedural SFX (rumble, heartbeat, metal, crash...) dựa trên scenes.md
```

## Quy trình 1 video

**1. Sinh `scenes.md`** — đưa cho AI Agent: `rules/AGENT_RULES.md` + `rules/STYLE_BIBLE.md` (đã chọn preset, điền nhân vật) + kịch bản.
Lưu kết quả vào `input/scenes.md`. Mẫu: `examples/scenes.example.md`.

```bash
npm run scenes                 # → input/sentences.txt, prompts.txt, prompts.json, overrides.json
```
Lệnh này kiểm tra định dạng, báo lỗi theo từng cảnh, và ước tính thời lượng.

**2. Ảnh/video** — đưa từng dòng `input/prompts.txt` vào Google Flow. Lưu vào `public/images/` theo **số cảnh**:
`001.png`, `002.png`… hoặc giữ tên Flow có tiền tố số (`005_xxx.jpg`). Có thể trộn `.mp4/.webm` (clip dài ≥ độ dài cảnh).

**3. Giọng đọc** — đưa `input/sentences.txt` vào TTS (ElevenLabs / OmniVoice…), lưu `public/audio/voice.mp3`.
Lấy phụ đề theo thời gian:
```bash
whisper public/audio/voice.mp3 --language vi --model medium --output_format srt --output_dir input
```
(ra `input/voice.srt`; công cụ nào xuất SRT cũng được — chữ trong SRT có thể sai nhẹ, chữ hiển thị luôn lấy từ kịch bản).

**4. Nhạc nền** (tùy chọn) — `public/audio/bgm.mp3`, nhạc không lời.

**5. Dựng**
```bash
npm run timeline               # căn câu ↔ giọng ↔ ảnh, tự chọn camera/chuyển cảnh/SFX → public/timeline.json
npm run studio                 # xem trước, chỉnh trực tiếp
npm run render                 # → out/raw.mp4
npm run finalize               # → out/final.mp4  (loudnorm 2 lượt: -14 LUFS, TP -1.5 dB, faststart)
# hoặc tất cả: npm run build
```

---

## 🤖 Mẫu Prompt ra lệnh cho AI Agent (Agent Prompts)

Dự án đã tối ưu sẵn các mẫu prompt yêu cầu AI Agent (Antigravity, Cursor, Claude...) **bắt buộc đọc và dùng kỹ năng tại [`.agents/skills/auto-video-gen/SKILL.md`](.agents/skills/auto-video-gen/SKILL.md)** trước khi thực thi để tự động hóa trọn gói 11 bước từ A đến Z:
- **Mẫu 1 (Video Triết học / Stoic Quotes)**: Đọc SKILL.md → tự tạo tượng đá tách nền, kịch bản danh ngôn, font hoài cổ rỉ mục, highlight dính liền cụm từ, render chuẩn -14 LUFS.
- **Mẫu 2 (Video Kể chuyện nhiều phân cảnh)**: Đọc SKILL.md → tự phân cảnh kịch bản, sinh prompt theo `STYLE_BIBLE.md`, tạo chuỗi hình ảnh nhất quán, lồng tiếng và hiệu ứng chuyển cảnh.

👉 Xem chi tiết đầy đủ nội dung các mẫu prompt tại: **[PROMPTS.md](PROMPTS.md)**

---

## Tùy chỉnh

**`input/project.json`**

| Khóa | Mặc định | Ý nghĩa |
|---|---|---|
| `format` | `vertical` | `vertical` 1080×1920 · `horizontal` 1920×1080 |
| `template` | `default` | `default`: Storytelling nhiều cảnh hình ảnh/video · `philosopher`: Kinetic Typography triết học danh ngôn |
| `templateOptions` | `{}` | Tùy chọn chi tiết cho template (vd: `image` tượng triết gia) |
| `subtitleStyle` | `box` | `box`: CHỮ HOA trắng viền đen, từ đang đọc nền cam · `yellow`: chữ thường trên nền tối, từ đang đọc màu vàng |
| `bgmVolume` | `0.12` | âm lượng nhạc nền so với giọng |
| `lead` | `0.1` | hình đổi trước giọng bấy nhiêu giây |
| `tail` | `1.2` | giữ cảnh cuối sau khi hết giọng |
| `maxWordsPerChunk` | `6` | số chữ tối đa mỗi dòng phụ đề |

---

## 🎨 Bộ Template (Templates)

Engine hỗ trợ các bộ template chuyên biệt theo từng phong cách kênh:

### Template `philosopher` (Triết học, Khắc kỷ, Danh ngôn)
- **Đặc trưng**: Tượng triết gia bán thân bên trái trượt vào chậm rãi (`Ken Burns Drift`), kinetic typography bên phải với font Cinzel rỉ mục hoài cổ (`grunge mask`), highlight vệt cọ dính cụm 2 chữ (`@remotion/rough-notation`), nền giấy cũ nếp gấp và phổ quang ánh sáng trắng/bạc (`@remotion/effects`).
- **Kích hoạt nhanh**: Trong `input/project.json`, đặt `"template": "philosopher"`.
- **Đổi tượng triết gia mới**:
  ```bash
  npm run remove-bg duong-dan/anh.jpg public/ten_anh.png
  ```
  Sau đó chỉ định trong `project.json`:
  ```json
  {
    "template": "philosopher",
    "templateOptions": {
      "philosopher": { "image": "ten_anh.png" }
    }
  }
  ```
- Xem chi tiết tại: `templates/philosopher/README.md`.

**Chỉnh từng cảnh** — sửa `input/overrides.json` (hoặc dòng `CAMERA/TRANSITION/SFX` trong `scenes.md` rồi chạy lại `npm run scenes`):
```json
{ "5": { "camera": "pan-left", "transition": "whoosh", "sfx": "riser" } }
```
- *Lưu ý về SFX*: Bạn có thể điền **bất kỳ tên hiệu ứng nào** (ví dụ: `rumble`, `heartbeat`, `metal`, `crash`, `wind`, `magic`...). Chạy lệnh `npm run sfx` sau đó, hệ thống sẽ dùng FFmpeg (Procedural Audio) để tự động tổng hợp ra file âm thanh tương ứng vào `public/sfx/`. Nếu điền một tên hoàn toàn mới, hệ thống sẽ fallback sinh ra một tần số âm thanh ngẫu nhiên bám sát keyword đó!

**Quy tắc tự động** (mô phỏng "Máy quay tự động / Chuyển cảnh / SFX tự động" của HAStudio)
- Camera xoay vòng `push-in → pan-right → pull-out → pan-left → drift-up`, không bao giờ lặp chuyển động cảnh liền trước; video clip → `static`.
- Câu trước kết thúc `?` hoặc câu hiện tại ≤ 3 chữ → `whoosh` (blur + trượt + SFX swoosh); còn lại `dissolve` 0.35s.
- `riser` chèn trước một `whoosh` khi đã cách riser trước ≥ 8 cảnh và cảnh trước dài ≥ 1.7s.
- Thời gian từng chữ phụ đề = chia theo độ dài ký tự trong mỗi cue SRT (sai số thường < 0.15s). Cần chính xác tuyệt đối → thay bằng timestamp từng chữ của Whisper/ElevenLabs (sửa `flattenCues` trong `src/lib/align.ts`).

## Cấu trúc

```
rules/            AGENT_RULES.md · STYLE_BIBLE.md   ← "hồn" của dự án, chỉnh ở đây
input/            scenes.md, voice.srt, project.json, overrides.json (+ file sinh ra)
public/images/    001.png …   public/audio/ voice.mp3, bgm.mp3   public/sfx/ *.wav
scripts/          parse-scenes · build-timeline · finalize · gen-sfx.py
src/              Remotion: Story.tsx, components/{SceneView,Subtitles,Soundtrack}.tsx, lib/*
```

## Xử lý sự cố

| Triệu chứng | Cách xử lý |
|---|---|
| `Thiếu ảnh/video cho cảnh …` | tên file phải bắt đầu bằng số cảnh; số file ≥ số câu |
| `đồng bộ lại điểm bắt đầu` / `từ cuối lệch` | SRT lệch kịch bản vài chữ (ASR sai) — vẫn chạy được; nếu lặp nhiều, sửa lại `sentences.txt` cho khớp lời đã đọc |
| `SRT hết trước câu N` | giọng đọc thiếu câu so với kịch bản — đọc lại hoặc xóa câu thừa |
| Hình trễ hơn giọng | có câu quá ngắn (< 0.5s) bị đẩy lùi; gộp vào câu kế |
| Render chậm | `npx remotion render … --concurrency=8`; video dài (20+ phút) nên chia đoạn rồi nối bằng FFmpeg |
| Chữ phụ đề mất dấu | cần mạng lần đầu để tải font Be Vietnam Pro, hoặc tự đặt font vào `public/` |
