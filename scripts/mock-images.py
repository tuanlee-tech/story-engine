import os
from PIL import Image, ImageDraw, ImageFont

os.makedirs("public/images", exist_ok=True)
for i in range(1, 27):
    img = Image.new('RGB', (1080, 1920), color = (73, 109, 137))
    d = ImageDraw.Draw(img)
    d.text((400, 960), f"Scene {i:03d}", fill=(255, 255, 0))
    img.save(f"public/images/{i:03d}.png")
print("Generated mock images.")
