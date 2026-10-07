import os
import subprocess
import time
from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai.errors import ClientError

load_dotenv()
client = genai.Client()

lines = open("input/sentences.txt").read().strip().split("\n")
srt = []
current_time = 0.0

os.makedirs("public/audio", exist_ok=True)

with open("concat.txt", "w") as f:
    for i, line in enumerate(lines):
        line = line.strip()
        if not line: continue
        
        wav_path = f"public/audio/tmp_{i}.wav"
        print(f"Generating voice for sentence {i+1}...")
        
        success = False
        while not success:
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
                success = True
            except ClientError as e:
                if e.code == 429:
                    print(f"Rate limited, sleeping for 20 seconds...")
                    time.sleep(20)
                else:
                    raise e
        
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

subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", "concat.txt", "public/audio/voice.mp3"])
with open("input/voice.srt", "w") as f:
    f.write("\n".join(srt))

for i in range(len(lines)):
    try: os.remove(f"public/audio/tmp_{i}.wav")
    except: pass
os.remove("concat.txt")
print("Generated Gemini voice and SRT.")
