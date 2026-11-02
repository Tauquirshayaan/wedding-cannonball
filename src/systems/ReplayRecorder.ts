/** Records every physics step of a launch, then picks the best 2-second window for slow-motion playback. */
export class ReplayRecorder {
  frames: Float32Array[] = [];
  marks: { frame: number; weight: number }[] = [];
  readonly maxFrames = 60 * 9;

  clear() { this.frames = []; this.marks = []; }

  push(data: number[]) {
    if (this.frames.length >= this.maxFrames) return;
    this.frames.push(Float32Array.from(data));
  }

  /** Remember an exciting moment (big hit, bounce, boost). */
  mark(weight: number) { this.marks.push({ frame: this.frames.length, weight }); }

  score() { return this.marks.reduce((a, m) => a + m.weight, 0); }

  /** Window of frames around the most exciting moment. */
  window(before = 50, after = 75): { start: number; end: number } {
    const n = this.frames.length;
    if (n === 0) return { start: 0, end: 0 };
    let best = -1, bestW = -1;
    // weight marks by how many other marks are close by (a pile-up beats one bump)
    for (const m of this.marks) {
      let w = 0;
      for (const o of this.marks) if (Math.abs(o.frame - m.frame) < 40) w += o.weight;
      if (w > bestW) { bestW = w; best = m.frame; }
    }
    if (best < 0) best = Math.min(n - 1, 70);
    let start = Math.max(0, best - before);
    const end = Math.min(n - 1, start + before + after);
    start = Math.max(0, end - before - after);
    return { start, end };
  }
}
