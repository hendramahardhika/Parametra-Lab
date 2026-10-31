import { emptyProject, type CadProject, type SketchEntity } from './cad-workbench';
import { commandNames, type ModelCommand } from './cad-modeling';

export const exampleCommands: ModelCommand[] = ['extrude', 'revolve', 'sweep', 'loft', 'presspull', 'fillet', 'chamfer', 'shell'];
export const exampleDurations = [3600, 2200, 2400, 2400, 2600, 5200, 2600];
export const exampleTotal = exampleDurations.reduce((a, b) => a + b, 0);
export type ExampleStep = { title: string; detail: string; target: 'draw' | 'command' | 'profile' | 'reference' | 'parameter' | 'apply' | 'result' };
export type CommandExample = { command: ModelCommand; initial: CadProject; final: CadProject; steps: ExampleStep[]; parameters: string[]; selection: string; category: 'Create' | 'Modify' };
export type ExamplePracticeRequest = { token: number; command: ModelCommand; project: CadProject };
const rect = (id: string, x: number, y: number, a: number, b: number): SketchEntity => ({ id, kind: 'rect', x, y, a, b });
const circle = (id: string, x: number, y: number, radius: number): SketchEntity => ({ id, kind: 'circle', x, y, a: radius, b: 0 });
export function commandExample(command: ModelCommand): CommandExample {
    const initial: CadProject = { ...emptyProject(), name: `Contoh ${commandNames[command]}`, depth: 20, entities: [rect('base', -30, -22, 60, 44)] };
    const modify = ['presspull', 'fillet', 'chamfer', 'shell'].includes(command);
    if (modify) { initial.extruded = true; initial.operation = { kind: 'extrude' }; }
    let final: CadProject = { ...initial, extruded: true, operation: { kind: 'extrude' } };
    let selection = 'profil tertutup', reference = 'jarak extrude', parameters = ['Jarak: 20 mm'];
    if (command === 'extrude') {
        initial.entities = [rect('base', -30, -20, 60, 40), circle('hole-a', -20, 0, 5), circle('hole-b', 20, 0, 5)];
        final = { ...final, entities: initial.entities };
        selection = 'profil plat, dengan dua lubang'; reference = 'arah normal sketch'; parameters = ['Jarak: 20 mm', 'Dua lubang: Ø10 mm'];
    } else if (command === 'revolve') {
        const points = [[0, 0], [20, 0], [20, 8], [12, 8], [12, 30], [20, 30], [20, 38], [0, 38]];
        initial.entities = points.map(([x, y], i) => ({ id: `profile-${i}`, kind: 'line', x, y, a: points[(i + 1) % points.length][0], b: points[(i + 1) % points.length][1] }));
        initial.plane = 'XZ';
        final = { ...initial, extruded: true, operation: { kind: 'revolve', axis: 0, angle: 360 } };
        selection = 'profil poros bertingkat'; reference = 'sumbu putar'; parameters = ['Sumbu: vertikal sketch', 'X sumbu: 0 mm', 'Sudut: 360°'];
    } else if (command === 'sweep') {
        initial.entities = [rect('base', -6, -8, 12, 16)];
        final = { ...initial, extruded: true, operation: { kind: 'sweep', radius: 38, angle: 90 } };
        selection = 'profil persegi 12 × 16 mm'; reference = 'jalur busur'; parameters = ['Radius jalur: 38 mm', 'Sudut busur: 90°'];
    } else if (command === 'loft') {
        initial.entities = [rect('base', -25, -25, 50, 50), circle('top', 0, 0, 15)]; initial.depth = 45;
        final = { ...initial, extruded: true, operation: { kind: 'loft', bottom: 'base', top: 'top', aligned: true } };
        selection = 'profil persegi pada bidang bawah'; reference = 'profil lingkaran pada bidang atas'; parameters = ['Profil bawah: persegi 50 mm', 'Profil atas: Ø30 mm', 'Jarak bidang: 45 mm'];
    } else if (command === 'presspull') {
        final.depth = 36; selection = 'muka atas solid'; reference = 'arah tarik muka'; parameters = ['Tinggi awal: 20 mm', 'Tinggi akhir: 36 mm'];
    } else {
        final.modifier = { kind: command as 'fillet' | 'chamfer' | 'shell', size: command === 'shell' ? 3 : 4 };
        selection = command === 'shell' ? 'muka atas yang akan dibuka' : 'tepi atas dan bawah solid'; reference = command === 'shell' ? 'dinding dan dasar' : 'seluruh tepi atas dan bawah';
        parameters = [command === 'fillet' ? 'Radius: 4 mm' : command === 'chamfer' ? 'Jarak: 4 mm · 45°' : 'Tebal dinding & dasar: 3 mm'];
    }
    const name = commandNames[command];
    const steps: ExampleStep[] = [
        { title: 'Buat sketch 2D', detail: command === 'revolve' ? 'Gambar profil tertutup poros bertingkat dan sumbu vertikal pada X = 0.' : command === 'loft' ? 'Siapkan persegi di bidang bawah dan lingkaran di bidang atas yang sejajar.' : 'Gambar profil tertutup. Garis akan muncul berurutan hingga sketch selesai.', target: 'draw' },
        { title: modify ? 'Siapkan solid awal' : `Pilih ${name}`, detail: modify ? 'Tarik sketch dengan Extrude setinggi 20 mm sebagai solid yang akan diubah.' : `Buka kelompok Create, lalu klik ${name}.`, target: modify ? 'apply' : 'command' },
        { title: modify ? `Pilih ${name}` : 'Pilih profil sketch', detail: modify ? `Buka kelompok Modify, lalu klik ${name}.` : `Klik ${selection}. Sorotan biru menandakan profil terpilih.`, target: modify ? 'command' : 'profile' },
        { title: modify ? 'Pilih bagian yang diubah' : command === 'revolve' ? 'Pilih axis / sumbu' : command === 'sweep' ? 'Pilih jalur Sweep' : command === 'loft' ? 'Pilih profil kedua' : 'Tentukan arah Extrude', detail: modify ? `Klik ${selection}. Bagian yang dipilih disorot oren.` : `Pilih ${reference}. ${command === 'revolve' ? 'Profil akan berputar mengelilingi garis sumbu ini.' : command === 'loft' ? 'Kedua profil akan dihubungkan sepanjang jarak antarkedua bidang.' : 'Periksa arah pembentukan sebelum melanjutkan.'}`, target: 'reference' },
        { title: 'Atur parameter', detail: parameters.join(' · '), target: 'parameter' },
        { title: `Terapkan ${name}`, detail: command === 'revolve' ? 'Profil berputar dari 0° menuju 360° hingga terbentuk poros bertingkat.' : command === 'sweep' ? 'Profil bergerak mengikuti busur dan membentuk solid melengkung.' : command === 'loft' ? 'Permukaan menghubungkan persegi dan lingkaran menjadi satu solid.' : command === 'shell' ? 'Sisi atas dibuka dan bagian dalam dikosongkan, menyisakan dinding serta dasar.' : command === 'fillet' ? 'Tepi tajam atas dan bawah berangsur menjadi lengkungan.' : command === 'chamfer' ? 'Tepi atas dan bawah dipangkas menjadi bidang miring.' : command === 'presspull' ? 'Muka atas bergerak naik hingga mencapai tinggi akhir.' : 'Profil tertutup ditarik menjadi plat 3D, sementara kedua lubang tetap tembus.', target: 'apply' },
        { title: 'Amati hasilnya', detail: `Contoh ${name} selesai. Ulangi animasi atau pilih Coba di editor untuk mengubah ukurannya sendiri.`, target: 'result' },
    ];
    return { command, initial, final, steps, parameters, selection, category: modify ? 'Modify' : 'Create' };
}
export function exampleMoment(elapsed: number) {
    let remaining = Math.max(0, Math.min(exampleTotal, elapsed));
    for (let step = 0; step < exampleDurations.length; step++) {
        if (remaining < exampleDurations[step] || step === exampleDurations.length - 1) return { step, progress: Math.min(1, remaining / exampleDurations[step]) };
        remaining -= exampleDurations[step];
    }
    return { step: 6, progress: 1 };
}
export const exampleStepTime = (step: number) => exampleDurations.slice(0, Math.max(0, Math.min(6, step))).reduce((a, b) => a + b, 0);
export function exampleFrameProject(example: CommandExample, step: number, progress: number): CadProject | null {
    const t = Math.max(0, Math.min(1, progress)), final = example.final;
    if (step === 0) return null;
    if (example.category === 'Modify' && step < 5) return { ...example.initial, depth: step === 1 ? Math.max(.1, 20 * t) : 20 };
    if (step < 5) return null;
    if (step > 5 || t >= 1) return final;
    if (example.command === 'revolve' && final.operation?.kind === 'revolve') return { ...final, operation: { ...final.operation, angle: Math.max(1, 360 * t) } };
    if (example.command === 'sweep' && final.operation?.kind === 'sweep') return { ...final, operation: { ...final.operation, angle: Math.max(1, 90 * t) } };
    if (example.command === 'extrude' || example.command === 'loft') return { ...final, depth: Math.max(.1, final.depth * t) };
    if (example.command === 'presspull') return { ...final, depth: 20 + (final.depth - 20) * t };
    if (example.command === 'shell') return final; // The renderer animates cavity depth, keeping the final wall thickness constant.
    return { ...final, modifier: final.modifier ? { ...final.modifier, size: Math.max(.1, final.modifier.size * t) } : undefined };
}
