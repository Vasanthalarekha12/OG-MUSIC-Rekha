import os
from PIL import Image

def generate_icons():
    # Source image: high-res official transparent logo
    src_path = os.path.join('src', 'assets', 'brand', 'og-music-logo-transparent.png')
    if not os.path.exists(src_path):
        raise FileNotFoundError(f"Source file not found: {src_path}")

    img = Image.open(src_path).convert('RGBA')
    bbox = img.getbbox()
    cropped = img.crop(bbox)
    print(f"Cropped logo size: {cropped.size}")

    bg_color = (5, 5, 5, 255) # #050505 brand dark background
    public_dir = 'public'

    def create_canvas_icon(size, scale_factor, bg=bg_color, transparent=False):
        if transparent:
            canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        else:
            canvas = Image.new('RGBA', (size, size), bg)

        target_max_w = int(size * scale_factor)
        target_max_h = int(size * scale_factor)

        orig_w, orig_h = cropped.size
        ratio = min(target_max_w / orig_w, target_max_h / orig_h)
        new_w = max(1, int(orig_w * ratio))
        new_h = max(1, int(orig_h * ratio))

        resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
        offset_x = (size - new_w) // 2
        offset_y = (size - new_h) // 2

        canvas.paste(resized, (offset_x, offset_y), resized)
        return canvas

    # 1. Standard PWA Icons (192x192 and 512x512) - prominent fit (~82% scale)
    icon_192 = create_canvas_icon(192, 0.82)
    icon_192.save(os.path.join(public_dir, 'icon-192.png'), 'PNG')
    print("Generated public/icon-192.png")

    icon_512 = create_canvas_icon(512, 0.82)
    icon_512.save(os.path.join(public_dir, 'icon-512.png'), 'PNG')
    print("Generated public/icon-512.png")

    # 2. Maskable PWA Icons (192x192 and 512x512) - fits inside Android adaptive safe circle (~62% scale)
    maskable_192 = create_canvas_icon(192, 0.62)
    maskable_192.save(os.path.join(public_dir, 'maskable-icon-192.png'), 'PNG')
    print("Generated public/maskable-icon-192.png")

    maskable_512 = create_canvas_icon(512, 0.62)
    maskable_512.save(os.path.join(public_dir, 'maskable-icon-512.png'), 'PNG')
    print("Generated public/maskable-icon-512.png")

    # 3. Apple Touch Icon (180x180) - iOS standard (~80% scale, solid dark background)
    apple_180 = create_canvas_icon(180, 0.80)
    apple_180.save(os.path.join(public_dir, 'apple-touch-icon.png'), 'PNG')
    apple_180.save(os.path.join(public_dir, 'apple-touch-icon-precomposed.png'), 'PNG')
    print("Generated public/apple-touch-icon.png & apple-touch-icon-precomposed.png")

    # 4. Favicon PNGs (16, 32, 48)
    fav_16 = create_canvas_icon(16, 0.90, transparent=False)
    fav_16.save(os.path.join(public_dir, 'favicon-16x16.png'), 'PNG')

    fav_32 = create_canvas_icon(32, 0.88, transparent=False)
    fav_32.save(os.path.join(public_dir, 'favicon-32x32.png'), 'PNG')

    fav_48 = create_canvas_icon(48, 0.86, transparent=False)
    fav_48.save(os.path.join(public_dir, 'favicon.png'), 'PNG')
    print("Generated public/favicon.png and size variants")

    # 5. Multi-size Favicon ICO (16, 32, 48)
    fav_16_ico = create_canvas_icon(16, 0.90)
    fav_32_ico = create_canvas_icon(32, 0.88)
    fav_48_ico = create_canvas_icon(48, 0.86)
    fav_48_ico.save(
        os.path.join(public_dir, 'favicon.ico'),
        format='ICO',
        sizes=[(16, 16), (32, 32), (48, 48)],
        append_images=[fav_16_ico, fav_32_ico]
    )
    print("Generated public/favicon.ico")

    # 6. SVG Favicon with official brand logo
    import base64
    with open(os.path.join(public_dir, 'favicon-32x32.png'), 'rb') as f:
        b64_logo = base64.b64encode(f.read()).decode('utf-8')
    svg_code = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"><rect width="32" height="32" rx="6" fill="#050505"/><image href="data:image/png;base64,{b64_logo}" width="32" height="32" /></svg>\n'
    with open(os.path.join(public_dir, 'favicon.svg'), 'w', encoding='utf-8') as f:
        f.write(svg_code)
    print("Generated public/favicon.svg with official logo")

if __name__ == '__main__':
    generate_icons()
