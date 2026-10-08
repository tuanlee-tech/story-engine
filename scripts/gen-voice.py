import os
import subprocess
import time
from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai.errors import ClientError

# Set fallback flag
use_vieneu = False
_vieneu_voice = None


def _vieneu_preset(tts):
    """Preset voice phai la dict (get_preset_voice), khong truyen string ID truc tiep."""
    global _vieneu_voice
    if _vieneu_voice is None:
        _vieneu_voice = tts.get_preset_voice("Hải Đăng")
    return _vieneu_voice

load_dotenv()
try:
    client = genai.Client()
except Exception:
    use_vieneu = True
    client = None

lines = open("input/sentences.txt").read().strip().split("\n")
srt = []
current_time = 0.0

os.makedirs("public/audio", exist_ok=True)

# Try checking gemini limits with a dummy call or just fall back during loop
try:
    if not use_vieneu and client:
        print("Testing Gemini TTS...")
        client.models.generate_content(
            model='gemini-3.8-flash-tts',
            contents="test",
            config=types.GenerateContentConfig(response_modalities=['AUDIO'])
        )
except ClientError as e:
    if e.code == 429:
        print("Gemini TTS Rate Limited. Switching to local VieNeu-TTS...")
        use_vieneu = True
except Exception as e:
    print("Gemini API error:", e)
    use_vieneu = True

if use_vieneu:
    from vieneu import Vieneu
    tts = Vieneu()

with open("concat.txt", "w") as f:
    for i, line in enumerate(lines):
        line = line.strip()
        if not line: continue
        
        wav_path = f"public/audio/tmp_{i}.wav"
        print(f"Generating voice for sentence {i+1}...")
        
        if not use_vieneu:
            try:
                response = client.models.generate_content(
                    model='gemini-3.8-flash-tts',
                    contents=line,
                    config=types.GenerateContentConfig(
                        response_modalities=['AUDIO'],
                    ),
                )
                for part in response.parts:
                    if part.inline_data:
                        with open(wav_path, 'wb') as audio_file:
                            audio_file.write(part.inline_data.data)
                        break
            except Exception as e:
                print("Gemini error during generation, falling back to VieNeu-TTS...", e)
                use_vieneu = True
                from vieneu import Vieneu
                tts = Vieneu()
        
        if use_vieneu:
            print("Using VieNeu-TTS (Hải Đăng)...")
            audio = tts.infer(line, voice=_vieneu_preset(tts))
            tts.save(audio, wav_path)
            
        res = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", wav_path], capture_output=True, text=True)
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
        f.write(f"file '{os.path.abspath(wav_path)}'\n")
        time.sleep(1)

subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", "concat.txt", "-c:a", "libmp3lame", "-q:a", "2", "public/audio/voice.mp3"])
with open("input/voice.srt", "w") as f:
    f.write("\n".join(srt))

for i in range(len(lines)):
    try: os.remove(f"public/audio/tmp_{i}.wav")
    except: pass
os.remove("concat.txt")
print("Generated Voice and SRT.")
