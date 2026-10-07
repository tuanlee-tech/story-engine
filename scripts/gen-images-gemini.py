import os
import json
import time
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
client = genai.Client()

with open("input/project.json") as f:
    config = json.load(f)
    
aspect_ratio = "9:16" if config.get("format") == "vertical" else "16:9"

lines = open("input/prompts.txt").read().strip().split("\n")
os.makedirs("public/images", exist_ok=True)

for i, line in enumerate(lines):
    line = line.strip()
    if not line: continue
    
    img_path = f"public/images/{i+1:03d}.png"
    print(f"Generating image {i+1}...")
    try:
        response = client.models.generate_content(
            model='gemini-3.1-flash-image',
            contents=line,
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
                image_config=types.ImageConfig(aspect_ratio=aspect_ratio),
            ),
        )
        for part in response.parts:
            if part.inline_data:
                part.as_image().save(img_path)
                print(f"Saved {img_path}")
                break
    except Exception as e:
        print(f"Failed for image {i+1}: {e}")
        
    time.sleep(2)

print("Generated Gemini images.")
