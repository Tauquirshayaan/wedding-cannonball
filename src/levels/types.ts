export interface ObjDef {
  type: string;
  x: number;
  y?: number;
  w?: number;
  h?: number;
  count?: number;
  walkRange?: number;
  angle?: number;
  fx?: number;
  fy?: number;
  variant?: string;
  style?: string;
  gap?: number;
}

export interface LevelData {
  id: number;
  name: string;
  tip: string;
  width: number;
  cannon: { x: number; y: number };
  stage: { x: number; y: number; w: number };
  gift?: { x: number; y: number } | null;
  damageTarget: number;
  objects: ObjDef[];
}
