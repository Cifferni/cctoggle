#!/usr/bin/env python3
"""
将logo.png的白色背景变为透明，并裁剪到内容边界
"""
from PIL import Image
import os

def remove_white_background():
    input_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'logo.png')
    output_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'logo_cropped.png')

    img = Image.open(input_path).convert('RGBA')
    width, height = img.size
    pixels = img.load()

    # 将接近白色的像素变为透明
    threshold = 235
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if r >= threshold and g >= threshold and b >= threshold:
                pixels[x, y] = (r, g, b, 0)

    # 找到非透明像素的边界框
    bbox = img.getbbox()

    if bbox:
        cropped = img.crop(bbox)
        cropped.save(output_path, 'PNG')
        print(f"原始尺寸: {width}x{height}")
        print(f"裁剪后尺寸: {cropped.size[0]}x{cropped.size[1]}")
        print(f"已保存到: {output_path}")
    else:
        print("没有找到有效内容")

if __name__ == "__main__":
    remove_white_background()
