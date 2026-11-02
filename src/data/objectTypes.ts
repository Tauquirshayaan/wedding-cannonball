// Physics and damage values per object type. Tuning one number changes every level that uses it.
export const OBJ = {
  sofa: { damage: 200, w: 170, h: 62, friction: 0.9, restitution: 0.05 },
  laddoo: { damage: 50, radius: 9, density: 0.0006, friction: 0.25, restitution: 0.35 },
  sweetsTable: { w: 130, h: 54 },
  dhol: { damage: 300, radius: 38, restitution: 1.3, bounceSpeed: 15.5, cooldownMs: 250 },
  photographer: { damage: 800, w: 34, h: 86, walkSpeed: 1.1, hitSpeed: 2, flashFreezeMs: 100 },
  fan: { strength: 0.42 },
  vat: { damage: -500, h: 64 },
  canopy: { damage: 200, restitution: 1.1, bounceSpeed: 13.5, h: 26, cooldownMs: 250 },
  relative: { damage: 1000, w: 46, h: 92, hitSpeed: 2 },
  rocket: { damage: 500, radius: 46, boostSpeed: 26 },
  gift: { radius: 34 },
  cake: { damage: 1000, tiers: [ { w: 150, h: 54 }, { w: 116, h: 48 }, { w: 82, h: 44 } ], density: 0.0012 },
  stage: { h: 46, zoneHeight: 80, backdropH: 210 },
} as const;

export type ObjectTypeName =
  | 'sofa' | 'laddooPyramid' | 'dhol' | 'photographer' | 'fan' | 'vat' | 'canopy'
  | 'relative' | 'rocket' | 'cake' | 'garlandArch' | 'pillar' | 'block';
