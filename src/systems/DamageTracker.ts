import { PHYS } from '../config';

export interface HitResult { value: number; mult: number; chain: number; }

/** Shaadi Damage meter: prop hits add rupees; hits within 1.5 s chain into combos up to 3x. */
export class DamageTracker {
  total = 0;
  chain = 0;
  private lastHit = -Infinity;
  launchDamage = 0;

  hit(base: number, timeMs: number): HitResult {
    if (base < 0) {
      this.total = Math.max(0, this.total + base);
      this.launchDamage += base;
      return { value: base, mult: 1, chain: 0 };
    }
    if (timeMs - this.lastHit <= PHYS.comboWindowMs) this.chain++;
    else this.chain = 1;
    this.lastHit = timeMs;
    const mult = Math.min(PHYS.comboMax, 1 + PHYS.comboStep * (this.chain - 1));
    const value = Math.round((base * mult) / 10) * 10;
    this.total += value;
    this.launchDamage += value;
    return { value, mult, chain: this.chain };
  }

  newLaunch() { this.launchDamage = 0; this.chain = 0; this.lastHit = -Infinity; }
}

export const rupees = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
