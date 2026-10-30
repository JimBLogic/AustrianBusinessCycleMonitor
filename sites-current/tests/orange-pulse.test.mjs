import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

// Execute the actual effect with bounded DOM/animation doubles, including cleanup.
const source = (await readFile(new URL('../app/OrangePulse.tsx', import.meta.url), 'utf8'))
  .replace('import { useEffect } from "react";', 'const useEffect = effect => { globalThis.__pulseEffect = effect; };');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const { OrangePulse } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));

function mount(reduced = false) {
  const previous = new Map(['document','window','Element','getComputedStyle','__pulseEffect'].map(k => [k, Object.getOwnPropertyDescriptor(globalThis,k)]));
  const listeners = new Map(), windowListeners = new Map(), motionListeners = new Map(), timers = new Map(), animations = [];
  let timerId = 0, removed = false;
  const halo = { style: {}, setAttribute() {}, remove() { removed = true; }, animate(frames, options) {
    const a = { frames, options, cancelled: false, cancel() { this.cancelled = true; } }; animations.push(a); return a;
  } };
  class Target {
    disabled = false; blocked = false; interactive = true;
    closest(selector) { return selector.startsWith('[inert]') ? (this.blocked ? this : null) : (this.interactive ? this : null); }
    matches() { return this.disabled; }
    getBoundingClientRect() { return { left: 10, top: 20, width: 44, height: 44 }; }
  }
  globalThis.Element = Target;
  globalThis.getComputedStyle = () => ({ borderRadius: '4px' });
  globalThis.document = { body: { append() {} }, createElement: () => halo,
    addEventListener: (k,v) => listeners.set(k,v), removeEventListener: k => listeners.delete(k) };
  globalThis.window = {
    matchMedia: () => ({ matches: reduced, addEventListener: (k,v) => motionListeners.set(k,v), removeEventListener: k => motionListeners.delete(k) }),
    setTimeout: fn => { timers.set(++timerId,fn); return timerId; }, clearTimeout: id => timers.delete(id),
    addEventListener: (k,v) => windowListeners.set(k,v), removeEventListener: k => windowListeners.delete(k),
  };
  OrangePulse(); const cleanup = globalThis.__pulseEffect();
  return { halo, Target, animations, timers, listeners, windowListeners, motionListeners,
    click: target => listeners.get('click')({target}),
    cleanup,
    get removed() { return removed; },
    restore() { cleanup(); for (const [k,d] of previous) { if(d) Object.defineProperty(globalThis,k,d); else delete globalThis[k]; } },
  };
}

test('native activation creates a perimeter-sized opacity pulse, without changing its target', () => {
  const h=mount(); try {
    const target=new h.Target(); h.click(target);
    assert.equal(h.halo.style.width,'44px'); assert.equal(h.halo.style.left,'10px');
    assert.equal(h.animations.length,1); assert.equal(h.animations[0].options.duration,400);
    assert.deepEqual(h.animations[0].frames.map(f=>f.opacity),[0,.75,0]);
    assert.deepEqual(Object.keys(target),['disabled','blocked','interactive']);
  } finally {h.restore();}
});

test('disabled, inert and noninteractive targets never pulse', () => {
  const h=mount(); try {
    for(const flag of ['disabled','blocked','interactive']) {
      const target=new h.Target(); target[flag]=flag!=='interactive'; h.click(target);
    }
    assert.equal(h.animations.length,0);
  } finally {h.restore();}
});

test('rapid activations replace a single halo; scroll cancels stale coordinates', () => {
  const h=mount(); try {
    h.click(new h.Target()); h.click(new h.Target());
    assert.equal(h.animations.length,2); assert.equal(h.animations[0].cancelled,true);
    h.listeners.get('scroll')(); assert.equal(h.animations[1].cancelled,true); assert.equal(h.halo.style.opacity,'0');
  } finally {h.restore();}
});

test('reduced motion uses a brief static signal and no animation', () => {
  const h=mount(true); try {
    h.click(new h.Target()); assert.equal(h.animations.length,0); assert.equal(h.halo.style.opacity,'0.65');
    [...h.timers.values()][0](); assert.equal(h.halo.style.opacity,'0');
  } finally {h.restore();}
});

test('unmount removes the layer, listeners, timers and active animation', () => {
  const h=mount(); try {
    h.click(new h.Target()); h.cleanup();
    assert.equal(h.removed,true); assert.equal(h.listeners.size,0); assert.equal(h.windowListeners.size,0);
    assert.equal(h.motionListeners.size,0); assert.equal(h.timers.size,0); assert.equal(h.animations[0].cancelled,true);
  } finally {h.restore();}
});
