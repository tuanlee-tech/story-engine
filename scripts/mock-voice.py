import os
import subprocess
from gtts import gTTS

lines = open("input/sentences.txt").read().strip().split("\n")
srt = []
current_time = 0.0

os.makedirs("public/audio", exist_ok=True)

with open("concat.txt", "w") as f:
    for i, line in enumerate(lines):
        line = line.strip()
        if not line: continue
        
        mp3_path = f"public/audio/tmp_{i}.mp3"
        tts = gTTS(line, lang='vi')
        tts.save(mp3_path)
        
        res = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", mp3_path], capture_output=True, text=True)
        dur = float(res.stdout.strip())
        
        words = line.split()
        word_dur = dur / max(1, len(words))
        
        for w_i, word in enumerate(words):
            start = current_time + w_i * word_dur
            end = start + word_dur
            
            def fmt(t):
                h = int(t / 3600)
                m = int((t % 3600) / 60)
                s = int(t % 60)
                ms = int((t - int(t)) * 1000)
                return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"
            
            srt.append(f"{len(srt)//4+1}")
            srt.append(f"{fmt(start)} --> {fmt(end)}")
            srt.append(word)
            srt.append("")
        
        current_time += dur
        f.write(f"file '{mp3_path}'\n")

subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", "concat.txt", "-c", "copy", "public/audio/voice.mp3"])
with open("input/voice.srt", "w") as f:
    f.write("\n".join(srt))

for i in range(len(lines)):
    try: os.remove(f"public/audio/tmp_{i}.mp3")
    except: pass
os.remove("concat.txt")
print("Generated mock voice and SRT.")
