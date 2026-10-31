import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';

const bundled = await build({ entryPoints: ['lib/student-identity.ts'], bundle: true, write: false, platform: 'node', format: 'esm' });
const { validateStudentIdentity: validate, studentInitials: initials, studentIdentityKey: key } = await import('data:text/javascript;base64,' + Buffer.from(bundled.outputFiles[0].text).toString('base64'));
assert.deepEqual(validate({ fullName: '  Hendra   Mahardhika ', className: 'XI TP 1', attendance: 7 }), { fullName: 'Hendra Mahardhika', className: 'XI TP 1', attendance: 7 });
assert.equal(validate({ fullName: 'Siswa Dua', className: 'XI TP 2', attendance: 36 }).className, 'XI TP 2');
assert.equal(initials('Hendra'), 'H');
assert.equal(initials('Muhammad Fajar Saputra'), 'MS');
assert.equal(initials(''), '');
for (const patch of [{fullName:''},{fullName:'a'},{className:'XI TP 3'},{attendance:0},{attendance:-1},{attendance:1.5},{attendance:100},{attendance:NaN}]) {
  assert.throws(() => validate({fullName:'Siswa Uji',className:'XI TP 1',attendance:3,...patch}));
}
assert.throws(() => validate(null));
assert.equal(key('/Test/index.html'), key('/test/index.html'));
assert.notEqual(key('/one/index.html'), key('/two/index.html'));
const component = await readFile('app/components/student-sign-in.tsx', 'utf8');
assert.ok(component.indexOf('htmlFor="student-full-name"') < component.indexOf('htmlFor="student-class"'));
assert.ok(component.indexOf('htmlFor="student-class"') < component.indexOf('htmlFor="student-attendance"'));
assert.ok(component.includes('signInWithStudentPin(next, pin)'));
assert.ok(component.indexOf('htmlFor="student-attendance"') < component.indexOf('htmlFor="student-pin"'));
assert.ok(component.includes('type={showPin ? \'text\' : \'password\'}'));
assert.ok(component.includes('localStorage.removeItem'));
assert.ok(component.includes('role="alert"'));
const html = await readFile('index.html', 'utf8');
assert.ok(html.includes('student-avatar'));
assert.ok(html.includes('Nomor Presensi'));
assert.ok(!html.includes('className:"topbar-subject"'));
assert.ok(!html.includes('/signin-with-chatgpt'));
console.log('PASS: identity validation, initials, class options, ordered fields and standalone build. Browser interaction/persistence not tested live.');
