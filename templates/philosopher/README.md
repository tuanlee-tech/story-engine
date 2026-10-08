# Philosopher Video Template

Bộ template chuyên dụng cho các video **Triết học, Chủ nghĩa Khắc kỷ (Stoicism), Danh ngôn triết gia, Châm ngôn sống**.

---

## 🏛 Visual & Hiệu ứng đặc trưng

1. **Chủ thể Triết gia (Bên trái ~50%)**:
   - Sử dụng ảnh tượng bán thân đã tách nền trong suốt (`.png`).
   - Tự động áp dụng hiệu ứng **Cinematic Entrance**: trượt vào từ góc trái với spring êm ái, tăng dần độ sáng.
   - Hiệu ứng **Ken Burns Slow Drift**: phóng to từ từ xuyên suốt video tạo cảm giác trầm hùng, uy nghi.

2. **Kinetic Typography (Bên phải ~50%)**:
   - Font **Cinzel** cổ điển uy quyền kết hợp mặt nạ xước rỉ mục (`grunge.jpg`), hỗ trợ toàn vẹn Tiếng Việt in hoa (Uppercase).
   - Tự động ngắt dòng và gom nhóm: mỗi dòng tối đa **2 từ** cho các từ khóa nhấn mạnh.
   - **Clustered Highlight**: vệt cọ dạ quang liền khối từ `@remotion/rough-notation` bao trọn cụm từ khóa (vd: *"CHIẾN THẮNG"*, *"BẢN THÂN"*, *"LÀM CHỦ"*...).

3. **Bầu không khí Cổ điển (Background VFX)**:
   - Nền đen giấy cổ nếp gấp (`paper` shader từ `@remotion/effects`).
   - Phổ quang lướt qua định kỳ dạng ánh bạc / trắng xám (`lightLeak` WebGL2 + `grayscale`).
   - Hạt bụi thời gian lơ lửng chậm rãi.
   - Nhạc nền mặc định: Bản hòa tấu thâm trầm *Zambolino - Dorian.mp3*.

---

## 🚀 Cách tái sử dụng cho Triết gia khác

Ví dụ bạn muốn làm video về **Marcus Aurelius**, **Seneca**, hoặc **Socrates**:

### Bước 1: Chuẩn bị ảnh tượng triết gia & tách nền
Tìm 1 ảnh tượng đá/đồng bán thân của triết gia (ảnh góc chụp thẳng hoặc nghiêng 3/4), sau đó chạy lệnh tự động tách nền:
```bash
npm run remove-bg duong-dan/anh-marcus.jpg public/marcus.png
```
*(Yêu cầu cài đặt 1 lần: `pip install rembg pillow`)*

### Bước 2: Kích hoạt template trong `input/project.json`
Chỉ cần khai báo `"template": "philosopher"` và chỉ định tên ảnh:

```json
{
  "format": "horizontal",
  "template": "philosopher",
  "templateOptions": {
    "philosopher": {
      "image": "marcus.png"
    }
  }
}
```
*(Nếu không khai báo `image`, hệ thống sẽ tự động dùng mặc định `philosopher.png`)*

### Bước 3: Chuẩn bị kịch bản & giọng đọc
Thực hiện các bước như quy trình tiêu chuẩn:
```bash
# 1. Tách câu từ kịch bản
npm run scenes input/scenes.md

# 2. Tạo giọng đọc voice.mp3 và sinh file phụ đề SRT
whisper public/audio/voice.mp3 --language vi --model medium --output_format srt --output_dir input

# 3. Biên soạn timeline
npm run timeline

# 4. Xem trước trực tiếp trên Remotion Studio
npm run studio
```

### Bước 4: Xuất bản video (Render)
```bash
npm run render
npm run finalize
```
Video hoàn thiện sẽ nằm tại `out/final.mp4`.
