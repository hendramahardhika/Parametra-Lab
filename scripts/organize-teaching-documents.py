"""Inventory and copy missing teaching sources without changing their contents."""
import argparse
import hashlib
import json
import shutil
import zipfile
from collections import Counter
from pathlib import Path
from urllib.parse import quote
from xml.etree import ElementTree

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parents[1] / '38008 SMK Muh 3 Yk Praktik Pengalaman Lapangan (PPL) Mandiri' / 'TFLM-Perancangan'
DEST = ROOT / 'Dokumen'
AUDIT = ROOT / 'tmp' / 'document-audit'


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def category(relative):
    name = relative.name
    cycle = 'Siklus 4' if 'Siklus 4' in relative.parts else 'Siklus 2'
    if relative.parts[0] == 'Fusion':
        return relative.parent, 'Model dan animasi'
    if name.startswith('ATP_'):
        return Path('Perangkat Guru/ATP'), 'ATP'
    if name.startswith('RPP '):
        return Path('Perangkat Guru/RPP') / cycle, 'RPP'
    if name.startswith('Instrumen Asesmen'):
        return Path('Perangkat Guru/Asesmen') / cycle, 'Asesmen'
    if name.startswith('Rubrik '):
        return Path('Perangkat Guru/Rubrik') / cycle, 'Rubrik'
    if name.startswith('Cover_'):
        return Path('Aset Desain/Cover') / cycle, 'Cover'
    if name.startswith('Bahan Ajar '):
        return Path('Bahan Ajar') / cycle, 'Bahan ajar'
    if name.startswith('Media Pembelajaran '):
        return Path('Media Pembelajaran') / cycle, 'Media pembelajaran'
    if name.startswith('LKM '):
        return Path('LKM') / cycle, 'LKM'
    if name.startswith('Jobsheet '):
        module = 'Assembly' if cycle == 'Siklus 4' else 'Sketch 2D' if ('1 dan 2 ' in name or 'Sketch 2D' in name or 'Plat Sambungan' in name or 'V Block' in name) else 'Part 3D'
        return Path('Jobsheet') / module / ('Sumber Word' if relative.suffix.lower() == '.docx' else 'Gabungan'), 'Jobsheet'
    if name in ('Plat Sambung.png', 'V Block.png'):
        return Path('Fusion/Sketch 2D'), 'Gambar sketch'
    if relative.suffix.lower() == '.png':
        return Path('Aset Desain/Header dan Footer'), 'Header dan footer'
    if name.startswith('MODUL AJAR_'):
        return Path('Referensi CAD'), 'Referensi CAD'
    raise ValueError(f'Berkas belum diklasifikasikan: {relative}')


def read_document(path):
    extension = path.suffix.lower()
    if extension == '.docx':
        with zipfile.ZipFile(path) as package:
            xml = ElementTree.fromstring(package.read('word/document.xml'))
        paragraphs = [' '.join(node.itertext()) for node in xml.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t')]
        text = ' '.join(paragraphs)
        return {'characters': len(text), 'excerpt': text[:1100]}
    if extension == '.pdf':
        reader = PdfReader(path)
        pages = [page.extract_text() or '' for page in reader.pages]
        return {'pages': len(pages), 'characters': sum(map(len, pages)), 'excerpt': ' '.join(' '.join(pages).split())[:1100], 'pageHeadings': [' '.join(text.split())[:140] for text in pages]}
    return {}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    existing = {}
    for folder in (DEST, ROOT / 'public'):
        for path in sorted(folder.rglob('*')):
            if path.is_file():
                existing.setdefault(digest(path), path)
    records = []
    for source in sorted(SOURCE.rglob('*')):
        if not source.is_file() or source.name.startswith('~$'):
            continue
        relative = source.relative_to(SOURCE)
        checksum = digest(source)
        folder, kind = category(relative)
        prior = existing.get(checksum)
        target = prior or DEST / folder / source.name
        record = {'source': str(relative), 'destination': str(target.relative_to(ROOT)), 'category': kind, 'sha256': checksum, 'bytes': source.stat().st_size, 'status': 'sudah tersedia' if prior else 'ditambahkan', 'content': read_document(source)}
        if not prior:
            if target.exists():
                raise FileExistsError(f'Target berbeda isinya: {target}')
            if args.apply:
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source, target)
                if digest(target) != checksum:
                    raise RuntimeError(f'Salinan tidak identik: {target}')
            existing[checksum] = target
        records.append(record)
        print(f'{record["status"]}: {relative} -> {target.relative_to(ROOT)}', flush=True)
    AUDIT.mkdir(parents=True, exist_ok=True)
    (AUDIT / 'inventory.json').write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding='utf-8')
    counts = Counter(record['status'] for record in records)
    print(json.dumps(dict(counts), ensure_ascii=False))
    if args.apply:
        lines = ['# Katalog dokumen TFLM Perancangan', '', 'Penataan: 27 Oktober 2026. Berkas disalin tanpa mengubah isinya; sumber asli tetap tersimpan di folder PPL Mandiri.', '', f'Diperiksa {len(records)} berkas sumber: {counts["ditambahkan"]} berkas ditambahkan dan {counts["sudah tersedia"]} sudah tersedia berdasarkan SHA-256.', '', 'Folder ini menyimpan koleksi sumber. scripts/prepare-learning-library.mjs menyiapkan berkas untuk pustaka web saat build; menu dan aksesnya diatur pada aplikasi. File yang sebelumnya terhubung tetap memakai lokasi yang sama.', '', 'PDF adalah versi baca dan DOCX adalah sumber yang dapat diedit. Dokumen asesmen, rubrik, ATP, dan RPP dikelompokkan dalam Perangkat Guru.', '']
        for kind in dict.fromkeys(record['category'] for record in records):
            lines += [f'## {kind}', '', '| Berkas sumber | Lokasi koleksi | Status |', '| --- | --- | --- |']
            for record in records:
                if record['category'] != kind:
                    continue
                path = ROOT / record['destination']
                link = quote('../' + path.relative_to(ROOT).as_posix(), safe='/')
                lines.append(f'| {record["source"]} | [{path.name}]({link}) | {record["status"]} |')
            lines.append('')
        (DEST / 'KATALOG-DOKUMEN.md').write_text('\n'.join(lines), encoding='utf-8')
        manifest = { 'date': '2026-10-27', 'sourceRoot': str(SOURCE), 'originalsPreserved': True, 'files': [{k: v for k, v in record.items() if k != 'content'} for record in records] }
        (DEST / 'INVENTARIS-DOKUMEN.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')


if __name__ == '__main__':
    main()
