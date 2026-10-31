import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const root = process.cwd(), directory = path.join(root, 'tmp/cad-tutorial-check');
await mkdir(directory, { recursive: true });
const output = path.join(directory, 'examples.mjs');
await build({ stdin: { contents: `export * from './lib/cad-command-examples';export * from './lib/cad-example-renderer';export {createCadGeometry,validateProject} from './lib/cad-workbench';`, resolveDir: root, loader: 'ts' }, outfile: output, bundle: true, platform: 'node', format: 'esm' });
const { commandExample, exampleCommands, exampleDurations, exampleTotal, exampleMoment, exampleStepTime, exampleFrameProject, prepareExampleDrawing, exampleDrawing, createCadGeometry, validateProject } = await import(pathToFileURL(output));
assert.equal(exampleCommands.length, 8);
assert.equal(exampleTotal, exampleDurations.reduce((a, b) => a + b));
for (let step = 0; step < 7; step++) assert.equal(exampleMoment(exampleStepTime(step)).step, step);
assert.deepEqual(exampleMoment(exampleTotal + 1000), { step: 6, progress: 1 });
const review = [];
for (const command of exampleCommands) {
    const example = commandExample(command), prepared = prepareExampleDrawing(example);
    assert.equal(example.steps.length, 7);
    assert.deepEqual(validateProject(JSON.parse(JSON.stringify(example.final))), example.final);
    assert.equal(exampleFrameProject(example, 0, .5), null);
    assert.deepEqual(exampleFrameProject(example, 6, 1), example.final);
    for (let step = 0; step < 7; step++) for (const t of [0, .25, .5, .75, 1]) {
        const project = exampleFrameProject(example, step, t);
        if (project) { const g = createCadGeometry(project); assert([...g.getAttribute('position').array].every(Number.isFinite)); g.dispose(); }
        const drawing = exampleDrawing(prepared, step, t);
        assert([...drawing.profiles.flat(), ...drawing.references.flatMap(r => r.points), drawing.target, drawing.cursor].every(p => Number.isFinite(p.x) && Number.isFinite(p.y)));
        if (project && !(command === 'shell' && step === 5 && t === 0)) assert(drawing.faces.length > 0, `${command} step ${step} should show actual model faces`);
        if (step === 6 && t === 1 || command === 'revolve' && step === 3 && t === .5) review.push({ command, step, drawing });
    }
}
const revolve = commandExample('revolve');
assert.equal(revolve.final.operation.kind, 'revolve'); assert.equal(revolve.final.operation.axis, 0); assert.equal(revolve.final.operation.angle, 360);
assert.equal(revolve.steps[2].target, 'profile'); assert.equal(revolve.steps[3].target, 'reference');
assert.equal(exampleFrameProject(revolve, 5, .25).operation.angle, 90);
const drawing = exampleDrawing(prepareExampleDrawing(revolve), 3, .5);
assert(drawing.references.some(r => /sumbu/.test(r.label)));
await writeFile(path.join(directory, 'review-frames.json'), JSON.stringify(review));
console.log('8 animated command examples passed: seven-step timeline, profile/axis selections, all intermediate 3D frames, finite projection, final-state equality, JSON continuation in editor.');
