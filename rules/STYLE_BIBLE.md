# STYLE BIBLE — chọn 1 preset, điền Character Bible, giữ nguyên cho cả series

Agent **chép nguyên văn** `STYLE_SUFFIX` vào cuối mọi PROMPT và **chép nguyên văn** CHARACTER TAG mỗi khi nhân vật xuất hiện.
Đây là thứ giữ cho 400+ ảnh Flow trông như cùng một bộ phim.

---

## Preset A — `cartoon-drama` (bóc từ video mẫu 9:16)

Hoạt hình 2D truyện tranh, màu ấm bão hòa, nét viền đậm, mặt biểu cảm quá đà, ánh sáng điện ảnh, vật thể trọng tâm có viền sáng.

**FORMAT:** vertical 9:16 → `project.json`: `"format": "vertical"`, `"subtitleStyle": "box"`

**STYLE_SUFFIX:**
```
2D digital cartoon illustration, semi-flat shading with soft painterly gradients, thick dark brown outlines, exaggerated expressive faces and gestures, saturated warm palette of amber, teal and deep red, cinematic rim lighting, soft glow around the key object, clean composition, vertical 9:16, subject inside the central 80% of the frame, bottom 22% of the frame left visually empty, no text unless specified, no watermark, no logo
```

**Bối cảnh tùy chọn (thêm vào trước SUFFIX khi truyện cần):**
`1930s northern Vietnam, village lane / Hanoi old-quarter street / ancestral house interior, ao dai, ao tu than, brown peasant clothes`

**Biểu tượng truyện tranh chèn trong ảnh (dùng tiết kiệm, ≤ 1/3 số cảnh):**
`red exclamation mark`, `yellow question mark`, `anger lines`, `padlock`, `ear pressed to wall`, `floating hearts`, `speed lines`, `cracked glass`

---

## Preset B — `minimal-sketch` (bóc từ ảnh chụp HAStudio, 16:9)

Explainer nét vẽ tay tối giản, nền giấy trắng ngà, nhân vật đầu tròn, một màu nhấn.

**FORMAT:** horizontal 16:9 → `"format": "horizontal"`, `"subtitleStyle": "yellow"`

**STYLE_SUFFIX:**
```
Minimalist 2D hand-drawn explainer animation style, black ink line art on an off-white paper background, simple round-headed character with dot eyes, light grey shading, a single blue accent color on the key object, generous negative space, horizontal 16:9, bottom 15% of the frame left empty, no text unless specified, no watermark
```

---

## CHARACTER BIBLE (điền cho mỗi series)

Mỗi nhân vật 1 dòng **CHARACTER TAG** cố định, mô tả đủ để Flow vẽ lại giống nhau: tuổi, dáng, tóc, trang phục + màu, 1 đặc điểm nhận dạng.

| Tên | CHARACTER TAG (chép nguyên văn vào PROMPT) |
|---|---|
| Nhân vật chính | `young Vietnamese woman, slim, shoulder-length dark brown hair, plain indigo blue ao ba ba, worried wide eyes` |
| Phản diện / đối trọng | `middle-aged man, round face, slicked-back hair, thin moustache, dark suit with red tie, smug grin` |
| Đám đông | `crowd of villagers in brown peasant clothes and conical hats, faceless silhouettes` |

> Quy tắc: không đổi trang phục/tóc giữa các cảnh trừ khi kịch bản đổi cảnh/thời gian — khi đó đặt tag mới có hậu tố `(variant: ...)` và dùng ổn định từ đó.

## KHÔNG BAO GIỜ (đưa vào negative / bỏ qua khi prompt)

Logo, watermark, nhân vật bản quyền, người thật nổi tiếng, chữ lỗi/chữ mờ, thêm ngón tay, khung viền/thanh phụ đề trong ảnh, nội dung khỏa thân hoặc bạo lực đồ họa.
Chủ đề nhạy cảm → dùng ẩn dụ vật thể và biểu tượng, **không mô tả trực diện**.
