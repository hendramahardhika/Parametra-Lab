"""Create static library thumbnails from the actual teaching files.

Run explicitly when sources change, then run npm run build:offline.
The source documents and CAD files are never modified.
"""
import argparse
import binascii
import hashlib
import io
import json
import subprocess
import textwrap
import zipfile
from pathlib import Path
from xml.etree import ElementTree

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'Dokumen/Aset Desain/Pratinjau Materi/koleksi'
TEMP = ROOT / 'tmp/resource-previews'
WIDTH, HEIGHT = 1100, 620


def white_image(image):
    rgba = image.convert('RGBA')
    result = Image.new('RGBA', rgba.size, 'white')
    result.alpha_composite(rgba)
    return result.convert('RGB')


def fit(image):
    image = white_image(image)
    image.thumbnail((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
    canvas = Image.new('RGB', (WIDTH, HEIGHT), 'white')
    canvas.paste(image, ((WIDTH-image.width)//2, (HEIGHT-image.height)//2))
    return canvas


def pdf_page(path, key, renderer):
    prefix = TEMP / key
    subprocess.run([renderer, '-f', '1', '-singlefile', '-scale-to', str(WIDTH), '-png', str(path), str(prefix)], check=True, capture_output=True)
    with Image.open(prefix.with_suffix('.png')) as page:
        return fit(page)


def fusion_preview(path, node):
    with zipfile.ZipFile(path) as package:
        preview = next(name for name in package.namelist() if name.endswith('/Previews/big.png'))
        info = package.getinfo(preview)
        if info.compress_type == 93:
            # Fusion uses ZIP Zstandard; the bundled Node runtime decodes it.
            data = path.read_bytes()
            offset = info.header_offset
            filename_size = int.from_bytes(data[offset+26:offset+28], 'little')
            extra_size = int.from_bytes(data[offset+28:offset+30], 'little')
            start = offset+30+filename_size+extra_size
            compressed = data[start:start+info.compress_size]
            decoded = subprocess.run([node, '-e', 'const fs=require("node:fs");process.stdout.write(require("node:zlib").zstdDecompressSync(fs.readFileSync(0)));'], input=compressed, check=True, capture_output=True).stdout
            if len(decoded) != info.file_size or binascii.crc32(decoded) != info.CRC:
                raise ValueError(f'Pratinjau Fusion rusak: {path.name}')
        else:
            decoded = package.read(preview)
        return fit(Image.open(io.BytesIO(decoded)))


def font(size, bold=False):
    filename = 'segoeuib.ttf' if bold else 'segoeui.ttf'
    windows = Path('C:/Windows/Fonts') / filename
    if windows.exists():
        return ImageFont.truetype(str(windows), size)
    return ImageFont.load_default(size=size)


def docx_content_preview(path):
    """A clearly labelled content thumbnail when no page renderer/PDF exists."""
    with zipfile.ZipFile(path) as package:
        document = ElementTree.fromstring(package.read('word/document.xml'))
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    paragraphs = [' '.join(p.itertext()).strip() for p in document.findall('.//w:p', ns)]
    paragraphs = [p for p in paragraphs if p]
    image = Image.new('RGB', (WIDTH, HEIGHT), '#f3f7fc')
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((90, 24, WIDTH-90, HEIGHT-24), 8, fill='white', outline='#d3dfed', width=2)
    draw.rectangle((90, 24, WIDTH-90, 31), fill='#145da7')
    draw.text((130, 54), 'PRATINJAU ISI DOKUMEN', font=font(17, True), fill='#4c7399')
    y = 100
    for index, paragraph in enumerate(paragraphs[:12]):
        size = 28 if index == 0 else 19
        for line in textwrap.wrap(paragraph, width=48 if index == 0 else 75)[:3]:
            if y > HEIGHT-80:
                break
            draw.text((130, y), line, font=font(size, index == 0), fill='#15395f' if index == 0 else '#4d6178')
            y += size + 8
        y += 10
        if y > HEIGHT-80:
            break
    return image


def stl_model(path):
    data = path.read_bytes()
    count = int.from_bytes(data[80:84], 'little')
    if len(data) != 84+count*50:
        raise ValueError(f'STL biner tidak dikenal: {path.name}')
    dtype = np.dtype([('normal', '<f4', (3,)), ('vertices', '<f4', (3, 3)), ('attribute', '<u2')])
    triangles = np.frombuffer(data, dtype=dtype, count=count, offset=84)['vertices'].astype(float)
    if not np.isfinite(triangles).all():
        raise ValueError(f'STL memiliki koordinat tidak valid: {path.name}')
    center = (triangles.min(axis=(0, 1))+triangles.max(axis=(0, 1)))/2
    triangles -= center
    view = np.array([1.0, -1.25, .8])
    view /= np.linalg.norm(view)
    right = np.cross(view, [0, 0, 1.0])
    right /= np.linalg.norm(right)
    up = np.cross(right, view)
    projected = np.stack((triangles @ right, -(triangles @ up)), axis=-1)
    minimum, maximum = projected.min(axis=(0, 1)), projected.max(axis=(0, 1))
    scale = min((WIDTH-230)/(maximum[0]-minimum[0]), (HEIGHT-95)/(maximum[1]-minimum[1]))
    xy = (projected-(minimum+maximum)/2)*scale+np.array([WIDTH/2, HEIGHT/2-9])
    normals = np.cross(triangles[:, 1]-triangles[:, 0], triangles[:, 2]-triangles[:, 0])
    length = np.linalg.norm(normals, axis=1)
    normals /= np.maximum(length[:, None], 1e-12)
    light = np.array([-.3, -.6, 1.0]); light /= np.linalg.norm(light)
    intensity = .57+.40*np.clip(normals @ light, 0, 1)
    colors = np.clip(np.array([170, 198, 210])[None, :]*intensity[:, None]+16, 0, 255).astype(int)
    depth = (triangles @ view).mean(axis=1)
    image = Image.new('RGB', (WIDTH*2, HEIGHT*2), '#f5f9fc')
    draw = ImageDraw.Draw(image)
    bottom = xy[:, :, 1].max()
    for offset in range(-6, 7):
        draw.line([(WIDTH+offset*110, HEIGHT+380), (WIDTH+offset*110+550, HEIGHT-10)], fill='#e6eef4', width=1)
    draw.ellipse((WIDTH-310, int(bottom*2)-6, WIDTH+310, min(HEIGHT*2-24, int(bottom*2)+36)), fill='#dbe5ed')
    edges = {}
    for index, triangle in enumerate(triangles):
        for a, b in ((0, 1), (1, 2), (2, 0)):
            key = tuple(sorted((tuple(np.round(triangle[a], 5)), tuple(np.round(triangle[b], 5)))))
            edges.setdefault(key, []).append((index, a, b))
    outlines = {}
    for adjacent in edges.values():
        visible = [(i, a, b) for i, a, b in adjacent if normals[i] @ view > .001]
        if not visible:
            continue
        if len(adjacent) == 1 or (len(adjacent) == 2 and normals[adjacent[0][0]] @ normals[adjacent[1][0]] < .8):
            index, a, b = max(visible, key=lambda item: depth[item[0]])
            outlines.setdefault(index, []).append((a, b))
    for index in np.argsort(depth):
        polygon = [tuple(point*2) for point in xy[index]]
        draw.polygon(polygon, fill=tuple(colors[index]))
        for a, b in outlines.get(index, []):
            draw.line([tuple(xy[index, a]*2), tuple(xy[index, b]*2)], fill='#334f61', width=2)
    return image.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)


def video_frame(path, key, ffmpeg):
    frame = TEMP / f'{key}-video.png'
    subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-ss', '0.5', '-i', str(path), '-frames:v', '1', '-vf', f'scale={WIDTH}:{HEIGHT}:force_original_aspect_ratio=decrease', str(frame)], check=True, capture_output=True)
    with Image.open(frame) as image:
        return fit(image)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--pdftoppm', required=True)
    parser.add_argument('--ffmpeg', required=True)
    parser.add_argument('--node', required=True)
    args = parser.parse_args()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    TEMP.mkdir(parents=True, exist_ok=True)
    resources = json.loads((ROOT / 'lib/learning-resources.generated.json').read_text(encoding='utf-8'))
    manifest = {}
    inventory = json.loads((ROOT / 'Dokumen/INVENTARIS-DOKUMEN.json').read_text(encoding='utf-8'))
    originals = {Path(item['destination']).name: ROOT / item['destination'] for item in inventory['files']}
    for resource in resources:
        file = next((item for item in resource['formats'] if item['extension'] in ['pdf', 'png', 'jpg', 'jpeg', 'f3d', 'mp4', 'avi', 'stl']), resource['formats'][0])
        source = ROOT / 'public/library' / file['asset']
        extension, key = file['extension'], resource['id']
        if extension == 'pdf':
            image = pdf_page(source, key, args.pdftoppm)
            origin = 'Halaman pertama PDF asli'
        elif extension in ['png', 'jpg', 'jpeg']:
            image = fit(Image.open(source)); origin = 'Gambar asli'
        elif extension == 'f3d':
            image = fusion_preview(source, args.node); origin = 'Pratinjau bawaan file Fusion'
        elif extension == 'stl':
            image = stl_model(source); origin = 'Tampilan isometris geometri STL asli'
        elif extension in ['mp4', 'avi']:
            image = video_frame(source, key, args.ffmpeg); origin = 'Cuplikan video asli'
        elif extension == 'docx' and resource['category'] == 'Jobsheet':
            match = next(path for name, path in originals.items() if name == 'Jobsheet 1 Siklus 2_Plat Sambungan.pdf')
            image = pdf_page(match, key, args.pdftoppm); origin = 'PDF jobsheet yang sesuai dengan sumber Word'
        elif extension == 'docx':
            image = docx_content_preview(source); origin = 'Ringkasan isi Word (bukan tata letak halaman asli)'
        else:
            raise ValueError(f'Tidak ada renderer untuk {resource["title"]}')
        target = OUTPUT / f'{key}.jpg'
        image.save(target, quality=92, optimize=True)
        manifest[key] = {'asset': f'koleksi/{target.name}', 'origin': origin, 'sourceAsset': file['asset'], 'sourceHash': hashlib.sha256(source.read_bytes()).hexdigest()}
        print(f'{len(manifest)}/{len(resources)}: {resource["title"]}', flush=True)
    (ROOT / 'lib/resource-preview-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'{len(manifest)} gambar pratinjau siap.', flush=True)


if __name__ == '__main__':
    main()
