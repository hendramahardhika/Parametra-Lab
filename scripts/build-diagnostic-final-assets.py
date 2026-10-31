"""Generate original line diagrams and embed PNG bytes in the self-contained Apps Script.

This only rebuilds generated images and the explicitly marked mechanical image-data region.
It does not read responses, credentials, or reference images.
"""
from pathlib import Path
import base64
import json
import math
import re
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'integrations/google-form/Diagnostik-Fusion-Final.gs'
OUT = ROOT / 'integrations/google-form/gambar-diagnostik-final'
OUT.mkdir(parents=True, exist_ok=True)
BLUE = '#123b68'
INK = '#162e49'
MUTED = '#51647a'
LIGHT = '#e3effb'
GRAY = '#637284'
W, H = 1200, 720


def font(size, bold=False):
    return ImageFont.truetype('arialbd.ttf' if bold else 'arial.ttf', size)


def canvas(title):
    im = Image.new('RGB', (W, H), 'white')
    dr = ImageDraw.Draw(im)
    dr.text((54, 28), title, font=font(34, True), fill=INK)
    dr.line((54, 88, 1146, 88), fill='#cbd8e5', width=2)
    dr.text((54, 673), 'Skema untuk membaca bentuk; bukan untuk diukur dari layar.', font=font(23), fill=MUTED)
    return im, dr


def label(dr, xy, text, size=30, bold=False, fill=INK, anchor=None):
    dr.text(xy, text, font=font(size, bold), fill=fill, anchor=anchor)


def dash(dr, a, b, color=GRAY, width=3, length=16, gap=10):
    dx, dy = b[0]-a[0], b[1]-a[1]
    distance = math.hypot(dx, dy)
    if not distance:
        return
    step = 0
    while step < distance:
        end = min(step+length, distance)
        dr.line((a[0]+dx*step/distance, a[1]+dy*step/distance,
                 a[0]+dx*end/distance, a[1]+dy*end/distance), fill=color, width=width)
        step += length+gap


def arrow(dr, a, b, both=False, color=INK, width=3):
    dr.line((*a, *b), fill=color, width=width)
    def head(tip, other):
        angle = math.atan2(tip[1]-other[1], tip[0]-other[0])
        points = [tip]
        for offset in [-0.4, 0.4]:
            points.append((tip[0]-18*math.cos(angle+offset), tip[1]-18*math.sin(angle+offset)))
        dr.polygon(points, fill=color)
    head(b, a)
    if both:
        head(a, b)


def centerline(dr, a, b):
    dx, dy = b[0]-a[0], b[1]-a[1]
    distance = math.hypot(dx, dy)
    for pos in range(0, int(distance), 43):
        for offset, length in [(0, 25), (33, 2)]:
            start, end = pos+offset, min(pos+offset+length, distance)
            if start < distance:
                dr.line((a[0]+dx*start/distance, a[1]+dy*start/distance,
                         a[0]+dx*end/distance, a[1]+dy*end/distance), fill=GRAY, width=2)


im, dr = canvas('B2 · Membaca notasi ukuran')
dr.ellipse((420, 180, 780, 540), outline=INK, width=5)
centerline(dr, (375, 360), (825, 360))
centerline(dr, (600, 170), (600, 585))
arrow(dr, (420, 360), (780, 360), both=True, color=BLUE, width=4)
label(dr, (600, 122), 'Ø12 mm', size=42, bold=True, anchor='mt')
im.save(OUT/'diameter.png', optimize=True)

im, dr = canvas('B9 · Menghubungkan dua pandangan')
label(dr, (300, 130), 'Tampak atas', size=35, bold=True, anchor='mt')
label(dr, (900, 130), 'Tampak depan', size=35, bold=True, anchor='mt')
dr.ellipse((140, 210, 460, 530), outline=INK, width=5)
dr.ellipse((236, 306, 364, 434), outline=INK, width=5)
centerline(dr, (100, 370), (500, 370))
centerline(dr, (300, 175), (300, 565))
dr.rectangle((740, 210, 1060, 530), outline=INK, width=5)
dash(dr, (836, 210), (836, 530), width=4)
dash(dr, (964, 210), (964, 530), width=4)
centerline(dr, (900, 175), (900, 565))
label(dr, (600, 610), 'Dua garis putus-putus tebal: garis tersembunyi.', size=27, anchor='mt')
im.save(OUT/'pandangan.png', optimize=True)

im, dr = canvas('B10 · Profil dan sumbu Revolve')
dr.rectangle((420, 200, 600, 560), fill=LIGHT, outline=INK, width=5)
dash(dr, (420, 140), (420, 620), color=BLUE, width=4)
label(dr, (365, 145), 'Sumbu', size=30, bold=True, anchor='rt')
label(dr, (365, 180), 'putar', size=30, bold=True, anchor='rt')
label(dr, (510, 380), 'Profil', size=35, bold=True, anchor='mm')
label(dr, (900, 140), 'Putaran penuh 360°', size=31, bold=True, anchor='mt')
dr.line((420, 570, 420, 632), fill=GRAY, width=2)
dr.line((600, 570, 600, 632), fill=GRAY, width=2)
arrow(dr, (420, 600), (600, 600), both=True)
label(dr, (510, 620), '20 mm', size=31, anchor='mt')
dr.line((612, 200, 772, 200), fill=GRAY, width=2)
dr.line((612, 560, 772, 560), fill=GRAY, width=2)
arrow(dr, (740, 200), (740, 560), both=True)
label(dr, (770, 380), '40 mm', size=31, anchor='lm')
im.save(OUT/'revolve.png', optimize=True)

im, dr = canvas('B11 · Memilih garis pencerminan sketch')
left = [(370, 220), (470, 220), (470, 390), (550, 390), (550, 460), (370, 460)]
right = [(1300-x,y) for x,y in left]
dr.polygon(left, fill=LIGHT, outline=INK, width=5)
for a,b in zip(right,right[1:]+right[:1]):
    dash(dr,a,b,color=GRAY,width=4,length=12,gap=8)
for code,a,b,textpos in [
    ('A',(650,155),(650,610),(650,115)),
    ('B',(230,155),(230,610),(230,115)),
    ('C',(150,335),(1090,335),(1100,335)),
    ('D',(150,580),(1090,580),(1100,580))]:
    dash(dr,a,b,color=BLUE,width=3,length=20,gap=10)
    label(dr,textpos,code,size=36,bold=True,anchor='mm')
label(dr,(450,500),'Profil kiri',size=29,bold=True,anchor='mt')
label(dr,(850,500),'Target pasangan',size=29,bold=True,anchor='mt')
im.save(OUT/'mirror.png', optimize=True)

data = {p.stem: base64.b64encode(p.read_bytes()).decode('ascii') for p in sorted(OUT.glob('*.png'))}
source = TARGET.read_text(encoding='utf-8')
start = '  // BEGIN GENERATED IMAGES - dibuat ulang oleh scripts/build-diagnostic-final-assets.py'
end = '  // END GENERATED IMAGES'
replacement = start + '\n  return ' + json.dumps(data, ensure_ascii=False, indent=2) + ';\n' + end
source, count = re.subn(re.escape(start)+r'.*?'+re.escape(end), lambda _: replacement, source, flags=re.S)
if count != 1 or len(data) != 4:
    raise RuntimeError('Generated region or expected four images not found')
TARGET.write_text(source, encoding='utf-8')
print('Generated 4 original PNG diagrams and embedded them in the final Apps Script.')
