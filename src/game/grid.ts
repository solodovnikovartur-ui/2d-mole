import type { Vec2 } from "./types";

export const CELL_SIZE = 48;
export const STARTING_LADDERS = 10;
export const HARD_LAYER_DEPTH = 4;

export const LADDER_PACK_SIZE = 5;
export const LADDER_PACK_COST = 5;
export const PICKAXE_HARD_COST = 5;
export const PICKAXE_NORMAL_COST = 15;
export const PICKAXE3_HARD_COST = 30;
export const PICKAXE3_NORMAL_COST = 25;
export const PICKAXE4_DIAMOND_COST = 20;
export const PICKAXE4_IRON_COST = 30;
export const LAMP_COST = 10;
export const ROPE_COST = 10;
export const LAMP_RADIUS = 4;
export const LAMP_RADIUS_BOOSTED = 7;

/** 0 empty · 1 normal · 2 hard · 3 hard dmg · 4–6 iron · 7–10 diamond */
export type BlockCell = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type Direction = "up" | "down" | "left" | "right";
/** 0 обычная · 1 улучш. · 2 3 ур. · 3 4 ур. */
export type PickaxeLevel = 0 | 1 | 2 | 3;

export interface MoleState {
  col: number;
  row: number;
  facing: Direction;
}

export interface Currency {
  normal: number;
  hard: number;
  iron: number;
  diamond: number;
}

export interface ShopPositions {
  ladder: Vec2;
  pickaxe: Vec2;
  deepPickaxe: Vec2 | null;
}

export interface DeepShopPositions {
  lamp: Vec2;
  rope: Vec2;
  pickaxe4: Vec2 | null;
}

export function getViewportDimensions(width: number, height: number): { viewportCols: number; viewportRows: number } {
  return {
    viewportCols: Math.max(1, Math.floor(width / CELL_SIZE)),
    viewportRows: Math.max(1, Math.floor(height / CELL_SIZE)),
  };
}

/** @deprecated Use getViewportDimensions */
export function getGridDimensions(width: number, height: number): { cols: number; rows: number } {
  const { viewportCols, viewportRows } = getViewportDimensions(width, height);
  return { cols: viewportCols, rows: viewportRows };
}

export function getIronRegionExtraCols(viewportCols: number): number {
  return viewportCols;
}

export function getWorldCols(viewportCols: number): number {
  return viewportCols + getIronRegionExtraCols(viewportCols);
}

export function getDeepRegionExtraRows(viewportRows: number): number {
  return viewportRows;
}

export function getWorldRows(viewportRows: number): number {
  return viewportRows + getDeepRegionExtraRows(viewportRows);
}

export function getDeepRegionStartRow(viewportRows: number): number {
  return viewportRows;
}

export function getDeepSurfaceRows(viewportRows: number): number {
  return getSurfaceRows(getDeepRegionExtraRows(viewportRows));
}

export function getIronRegionStart(viewportCols: number): number {
  return viewportCols;
}

export function isIronRegionCol(col: number, viewportCols: number): boolean {
  return col >= getIronRegionStart(viewportCols);
}

export function isIronBlockRow(row: number, surfaceRows: number): boolean {
  return row >= surfaceRows + HARD_LAYER_DEPTH;
}

export function isIronUndergroundCell(
  col: number,
  row: number,
  viewportCols: number,
  surfaceRows: number,
): boolean {
  return (
    isIronRegionCol(col, viewportCols) &&
    row >= surfaceRows &&
    isIronBlockRow(row, surfaceRows)
  );
}

export function isDeepRegionRow(row: number, deepRegionStart: number): boolean {
  return row >= deepRegionStart;
}

export function getShaftCol(viewportCols: number): number {
  return Math.floor(viewportCols / 2);
}

export function getCameraCol(moleCol: number, viewportCols: number, worldCols: number): number {
  const maxCamera = Math.max(0, worldCols - viewportCols);
  if (maxCamera === 0) return 0;
  const centered = moleCol - Math.floor(viewportCols / 2);
  return Math.max(0, Math.min(centered, maxCamera));
}

export function getCameraRow(moleRow: number, viewportRows: number, worldRows: number): number {
  const maxCamera = Math.max(0, worldRows - viewportRows);
  if (maxCamera === 0) return 0;
  const centered = moleRow - Math.floor(viewportRows / 2);
  return Math.max(0, Math.min(centered, maxCamera));
}

export function getWorldOffset(
  width: number,
  viewportCols: number,
  cameraCol: number,
  _viewportRows: number,
  cameraRow: number,
): Vec2 {
  const viewportOffset = getGridOffset(width, viewportCols);
  return {
    x: viewportOffset.x - cameraCol * CELL_SIZE,
    y: -cameraRow * CELL_SIZE,
  };
}

export function getSurfaceRows(totalRows: number): number {
  return Math.max(3, Math.floor(totalRows * 0.2));
}

export function getGridOffset(width: number, cols: number): Vec2 {
  const gridWidth = cols * CELL_SIZE;
  return { x: (width - gridWidth) / 2, y: 0 };
}

export function isSkyRow(row: number, surfaceRows: number): boolean {
  return row < surfaceRows;
}

export function isSkyAt(
  row: number,
  mainSurfaceRows: number,
  deepRegionStart: number,
  deepSurfaceRows: number,
): boolean {
  if (row < mainSurfaceRows) return true;
  if (row >= deepRegionStart) {
    return row - deepRegionStart < deepSurfaceRows;
  }
  return false;
}

export function isIronBlock(cell: BlockCell): boolean {
  return cell >= 4 && cell <= 6;
}

export function isDiamondBlock(cell: BlockCell): boolean {
  return cell >= 7 && cell <= 10;
}

export function isHardBlock(cell: BlockCell): boolean {
  return cell === 2 || cell === 3;
}

export function ironHitsRemaining(cell: BlockCell): number {
  if (cell === 4) return 3;
  if (cell === 5) return 2;
  if (cell === 6) return 1;
  return 0;
}

export function ironDamagePerHit(pickaxeLevel: PickaxeLevel): number {
  if (pickaxeLevel >= 3) return 3;
  if (pickaxeLevel >= 2) return 3;
  if (pickaxeLevel >= 1) return 2;
  return 1;
}

export function ironCellFromHitsRemaining(hits: number): BlockCell {
  if (hits >= 3) return 4;
  if (hits === 2) return 5;
  return 6;
}

export function diamondHitsRemaining(cell: BlockCell): number {
  if (cell === 7) return 4;
  if (cell === 8) return 3;
  if (cell === 9) return 2;
  if (cell === 10) return 1;
  return 0;
}

export function diamondDamagePerHit(pickaxeLevel: PickaxeLevel, hitsLeft: number): number {
  if (pickaxeLevel >= 3) return 4;
  if (pickaxeLevel >= 2) return 2;
  if (pickaxeLevel >= 1) return hitsLeft >= 3 ? 2 : 1;
  return 1;
}

export function diamondCellFromHitsRemaining(hits: number): BlockCell {
  if (hits >= 4) return 7;
  if (hits === 3) return 8;
  if (hits === 2) return 9;
  return 10;
}

function createMainBlock(
  col: number,
  row: number,
  viewportCols: number,
  surfaceRows: number,
): BlockCell {
  if (row < surfaceRows) return 0;
  if (isIronRegionCol(col, viewportCols)) {
    if (row < surfaceRows + HARD_LAYER_DEPTH) return 1;
    return 4;
  }
  if (row >= surfaceRows + HARD_LAYER_DEPTH) return 2;
  return 1;
}

function createDeepBlock(
  _col: number,
  row: number,
  deepRegionStart: number,
  deepSurfaceRows: number,
): BlockCell {
  const localRow = row - deepRegionStart;
  if (localRow < deepSurfaceRows) return 0;
  return 7;
}

export function isDeepUndergroundRow(
  row: number,
  deepRegionStart: number,
  deepSurfaceRows: number,
): boolean {
  return isDeepRegionRow(row, deepRegionStart) && row - deepRegionStart >= deepSurfaceRows;
}

/** Старые сохранённые клетки земли (1) в глубоких землях считаем алмазом. */
export function strikeCellType(
  cell: BlockCell,
  row: number,
  deepRegionStart: number,
  deepSurfaceRows: number,
): BlockCell {
  if (cell === 1 && isDeepUndergroundRow(row, deepRegionStart, deepSurfaceRows)) return 7;
  return cell;
}

export function createBlockForCell(
  col: number,
  row: number,
  viewportCols: number,
  viewportRows: number,
  mainSurfaceRows: number,
): BlockCell {
  const deepStart = getDeepRegionStartRow(viewportRows);
  if (row >= deepStart) {
    return createDeepBlock(col, row, deepStart, getDeepSurfaceRows(viewportRows));
  }
  return createMainBlock(col, row, viewportCols, mainSurfaceRows);
}

export function createSolidGrid(
  worldCols: number,
  worldRows: number,
  viewportCols: number,
  viewportRows: number,
  mainSurfaceRows: number,
): BlockCell[][] {
  const blocks = Array.from({ length: worldRows }, (_, row) =>
    Array.from({ length: worldCols }, (_, col) =>
      createBlockForCell(col, row, viewportCols, viewportRows, mainSurfaceRows),
    ),
  );
  carveMineShaft(blocks, viewportCols, viewportRows, mainSurfaceRows);
  return blocks;
}

export function carveMineShaft(
  blocks: BlockCell[][],
  viewportCols: number,
  viewportRows: number,
  _mainSurfaceRows: number,
): void {
  const shaftCol = getShaftCol(viewportCols);
  const deepStart = getDeepRegionStartRow(viewportRows);
  const deepSurfaceRows = getDeepSurfaceRows(viewportRows);
  const deepSurfaceRow = deepStart + deepSurfaceRows - 1;

  // Одно отверстие внизу основной карты — не труба с самого верха
  if (deepStart > 0) {
    blocks[deepStart - 1][shaftCol] = 0;
  }

  // Шахта только в небе глубоких земель (до поверхности шахты)
  for (let row = deepStart; row <= deepSurfaceRow; row += 1) {
    blocks[row][shaftCol] = 0;
  }
}

export function getDeepMolePosition(viewportCols: number, viewportRows: number): Vec2 {
  const deepStart = getDeepRegionStartRow(viewportRows);
  const surfaceRow = deepStart + getDeepSurfaceRows(viewportRows) - 1;
  return { x: getShaftCol(viewportCols), y: surfaceRow };
}

export function createEmptyLadders(cols: number, rows: number): boolean[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => false));
}

export function createEmptyRopes(cols: number, rows: number): boolean[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => false));
}

export function createShopPositions(viewportCols: number, surfaceRows: number): ShopPositions {
  const row = surfaceRows - 1;
  return {
    ladder: { x: 2, y: row },
    pickaxe: { x: Math.max(3, viewportCols - 3), y: row },
    deepPickaxe: null,
  };
}

export function createDeepShops(
  viewportCols: number,
  viewportRows: number,
  worldCols: number,
  worldRows: number,
): DeepShopPositions {
  const deepStart = getDeepRegionStartRow(viewportRows);
  const deepSurfaceRows = getDeepSurfaceRows(viewportRows);
  const surfaceRow = deepStart + deepSurfaceRows - 1;
  const shaftCol = getShaftCol(viewportCols);

  return {
    lamp: { x: Math.max(1, shaftCol - 3), y: surfaceRow },
    rope: { x: Math.min(worldCols - 2, shaftCol + 3), y: surfaceRow },
    pickaxe4: createDeepPickaxe4Shop(worldCols, worldRows, deepStart, deepSurfaceRows, shaftCol, [
      { x: Math.max(1, shaftCol - 3), y: surfaceRow },
      { x: Math.min(worldCols - 2, shaftCol + 3), y: surfaceRow },
    ]),
  };
}

export function createDeepPickaxeShop(
  worldCols: number,
  viewportRows: number,
  surfaceRows: number,
  viewportCols: number,
  exclude: Vec2[],
): Vec2 {
  const ironStart = getIronRegionStart(viewportCols);
  const minRow = surfaceRows + HARD_LAYER_DEPTH;
  const candidates: Vec2[] = [];

  for (let row = minRow; row < viewportRows - 1; row += 1) {
    for (let col = ironStart; col < worldCols; col += 1) {
      if (exclude.some((cell) => cell.x === col && cell.y === row)) continue;
      candidates.push({ x: col, y: row });
    }
  }

  if (candidates.length === 0) {
    return { x: Math.max(ironStart, worldCols - 2), y: minRow };
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function createDeepPickaxe4Shop(
  worldCols: number,
  worldRows: number,
  deepStart: number,
  deepSurfaceRows: number,
  shaftCol: number,
  exclude: Vec2[],
): Vec2 {
  const candidates: Vec2[] = [];
  const minRow = deepStart + deepSurfaceRows + 2;

  for (let row = minRow; row < worldRows - 1; row += 1) {
    for (let col = 0; col < worldCols; col += 1) {
      if (col === shaftCol) continue;
      if (exclude.some((cell) => cell.x === col && cell.y === row)) continue;
      candidates.push({ x: col, y: row });
    }
  }

  if (candidates.length === 0) {
    return { x: shaftCol + 1, y: minRow };
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function createStartMole(viewportCols: number, surfaceRows: number): MoleState {
  return {
    col: Math.floor(viewportCols / 2),
    row: Math.floor(surfaceRows / 2),
    facing: "down",
  };
}

export function directionDelta(direction: Direction): Vec2 {
  switch (direction) {
    case "up":
      return { x: 0, y: -1 };
    case "down":
      return { x: 0, y: 1 };
    case "left":
      return { x: -1, y: 0 };
    case "right":
      return { x: 1, y: 0 };
  }
}

export function isInsideGrid(col: number, row: number, cols: number, rows: number): boolean {
  return col >= 0 && col < cols && row >= 0 && row < rows;
}

export function isShopCell(col: number, row: number, shops: ShopPositions): boolean {
  if (shops.ladder.x === col && shops.ladder.y === row) return true;
  if (shops.pickaxe.x === col && shops.pickaxe.y === row) return true;
  if (shops.deepPickaxe && shops.deepPickaxe.x === col && shops.deepPickaxe.y === row) return true;
  return false;
}

export function isDeepShopCell(col: number, row: number, shops: DeepShopPositions): boolean {
  if (shops.lamp.x === col && shops.lamp.y === row) return true;
  if (shops.rope.x === col && shops.rope.y === row) return true;
  if (shops.pickaxe4 && shops.pickaxe4.x === col && shops.pickaxe4.y === row) return true;
  return false;
}

export function getLampRadius(expandedLamp: boolean): number {
  return expandedLamp ? LAMP_RADIUS_BOOSTED : LAMP_RADIUS;
}

export function isCellLit(
  col: number,
  row: number,
  moleCol: number,
  moleRow: number,
  deepRegionStart: number,
  deepSurfaceRows: number,
  mainSurfaceRows: number,
  hasLamp: boolean,
  expandedLamp: boolean,
): boolean {
  if (!isDeepRegionRow(row, deepRegionStart)) return true;
  if (isSkyAt(row, mainSurfaceRows, deepRegionStart, deepSurfaceRows)) return true;

  if (!hasLamp) return false;

  const dist = Math.abs(col - moleCol) + Math.abs(row - moleRow);
  return dist <= getLampRadius(expandedLamp);
}

export function resizeGrid(
  blocks: BlockCell[][],
  oldViewportCols: number,
  oldViewportRows: number,
  _mainSurfaceRows: number,
  newViewportCols: number,
  newViewportRows: number,
  newMainSurfaceRows: number,
): BlockCell[][] {
  const oldWorldCols = getWorldCols(oldViewportCols);
  const newWorldCols = getWorldCols(newViewportCols);
  const oldWorldRows = getWorldRows(oldViewportRows);
  const newWorldRows = getWorldRows(newViewportRows);
  const oldIronStart = getIronRegionStart(oldViewportCols);
  const newIronStart = getIronRegionStart(newViewportCols);
  const oldDeepStart = getDeepRegionStartRow(oldViewportRows);
  const newDeepStart = getDeepRegionStartRow(newViewportRows);

  const result = Array.from({ length: newWorldRows }, (_, row) =>
    Array.from({ length: newWorldCols }, (_, col) => {
      if (row < newWorldRows && col < newWorldCols) {
        const inOld = row < oldWorldRows && col < oldWorldCols;
        if (inOld) {
          const oldCell = blocks[row][col];
          const oldRegion =
            row >= oldDeepStart ? "deep" : col >= oldIronStart ? "iron" : "main";
          const newRegion =
            row >= newDeepStart ? "deep" : col >= newIronStart ? "iron" : "main";
          if (oldRegion === newRegion) return oldCell;
        }
      }
      return createBlockForCell(col, row, newViewportCols, newViewportRows, newMainSurfaceRows);
    }),
  );
  carveMineShaft(result, newViewportCols, newViewportRows, newMainSurfaceRows);
  return result;
}

export function resizeLadders(
  ladders: boolean[][],
  oldViewportCols: number,
  oldViewportRows: number,
  newViewportCols: number,
  newViewportRows: number,
): boolean[][] {
  const oldWorldCols = getWorldCols(oldViewportCols);
  const newWorldCols = getWorldCols(newViewportCols);
  const oldWorldRows = getWorldRows(oldViewportRows);
  const newWorldRows = getWorldRows(newViewportRows);

  return Array.from({ length: newWorldRows }, (_, row) =>
    Array.from({ length: newWorldCols }, (_, col) => {
      if (row < oldWorldRows && col < oldWorldCols && row < newWorldRows && col < newWorldCols) {
        return ladders[row][col];
      }
      return false;
    }),
  );
}

export function resizeRopes(
  ropes: boolean[][],
  oldViewportCols: number,
  oldViewportRows: number,
  newViewportCols: number,
  newViewportRows: number,
): boolean[][] {
  return resizeLadders(ropes, oldViewportCols, oldViewportRows, newViewportCols, newViewportRows);
}

export function hasLadder(ladders: boolean[][], col: number, row: number): boolean {
  return ladders[row]?.[col] ?? false;
}

export function hasRope(ropes: boolean[][], col: number, row: number): boolean {
  return ropes[row]?.[col] ?? false;
}

export function hasRopeInColumn(ropes: boolean[][], col: number): boolean {
  for (const row of ropes) {
    if (row[col]) return true;
  }
  return false;
}

export function isSolid(blocks: BlockCell[][], col: number, row: number): boolean {
  return (blocks[row]?.[col] ?? 0) > 0;
}

const HINT_TRAIL_MIN_DEPTH = 6;
const HINT_TRAIL_MAX_DEPTH = 12;

const TRAIL_DIRS: [number, number][] = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

function trailSeed(targetCol: number, targetRow: number): number {
  return targetCol * 92821 + targetRow * 68917 + 12345;
}

function makeTrailRng(targetCol: number, targetRow: number): () => number {
  let state = trailSeed(targetCol, targetRow);
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

function solidNeighbors8(
  blocks: BlockCell[][],
  col: number,
  row: number,
  cols: number,
  rows: number,
): Vec2[] {
  const result: Vec2[] = [];
  for (const [dx, dy] of TRAIL_DIRS) {
    const nx = col + dx;
    const ny = row + dy;
    if (!isInsideGrid(nx, ny, cols, rows)) continue;
    if (!isSolid(blocks, nx, ny)) continue;
    result.push({ x: nx, y: ny });
  }
  return result;
}

function bfsDistancesFromTarget(
  blocks: BlockCell[][],
  targetCol: number,
  targetRow: number,
  cols: number,
  rows: number,
): Map<string, number> {
  const targetKey = `${targetCol},${targetRow}`;
  const dist = new Map<string, number>();
  dist.set(targetKey, 0);
  const queue: Vec2[] = [{ x: targetCol, y: targetRow }];

  while (queue.length > 0) {
    const cell = queue.shift()!;
    const key = `${cell.x},${cell.y}`;
    const depth = dist.get(key)!;
    if (depth >= HINT_TRAIL_MAX_DEPTH) continue;

    for (const [dx, dy] of TRAIL_DIRS) {
      const nx = cell.x + dx;
      const ny = cell.y + dy;
      const nextKey = `${nx},${ny}`;
      if (!isInsideGrid(nx, ny, cols, rows)) continue;
      if (!isSolid(blocks, nx, ny)) continue;
      if (dist.has(nextKey)) continue;
      dist.set(nextKey, depth + 1);
      queue.push({ x: nx, y: ny });
    }
  }

  return dist;
}

function appendShortestSolidPath(
  blocks: BlockCell[][],
  from: Vec2,
  to: Vec2,
  cols: number,
  rows: number,
  path: Vec2[],
  visited: Set<string>,
): void {
  const fromKey = `${from.x},${from.y}`;
  const toKey = `${to.x},${to.y}`;
  if (fromKey === toKey) return;

  const parent = new Map<string, string | null>();
  parent.set(fromKey, null);
  const queue: Vec2[] = [from];
  let found: string | null = null;

  while (queue.length > 0 && !found) {
    const cell = queue.shift()!;
    const key = `${cell.x},${cell.y}`;
    for (const [dx, dy] of TRAIL_DIRS) {
      const nx = cell.x + dx;
      const ny = cell.y + dy;
      const nextKey = `${nx},${ny}`;
      if (!isInsideGrid(nx, ny, cols, rows)) continue;
      if (!isSolid(blocks, nx, ny)) continue;
      if (parent.has(nextKey)) continue;
      parent.set(nextKey, key);
      if (nextKey === toKey) {
        found = nextKey;
        break;
      }
      queue.push({ x: nx, y: ny });
    }
  }

  if (!found) return;

  const suffix: Vec2[] = [];
  let cursor: string | null = found;
  while (cursor && cursor !== fromKey) {
    const [x, y] = cursor.split(",").map(Number);
    suffix.push({ x, y });
    cursor = parent.get(cursor) ?? null;
  }
  suffix.reverse();
  for (const cell of suffix) {
    const key = `${cell.x},${cell.y}`;
    if (!visited.has(key)) {
      path.push(cell);
      visited.add(key);
    }
  }
}

function buildWindingSolidPath(
  blocks: BlockCell[][],
  start: Vec2,
  target: Vec2,
  distances: Map<string, number>,
  cols: number,
  rows: number,
  rng: () => number,
): Vec2[] {
  const path: Vec2[] = [start];
  const visited = new Set<string>([`${start.x},${start.y}`]);
  let current = start;
  const targetKey = `${target.x},${target.y}`;
  const maxSteps = 64;

  while (`${current.x},${current.y}` !== targetKey && path.length < maxSteps) {
    const currentKey = `${current.x},${current.y}`;
    const currentDist = distances.get(currentKey);
    if (currentDist === undefined) break;

    const neighbors = solidNeighbors8(blocks, current.x, current.y, cols, rows).filter((cell) => {
      const key = `${cell.x},${cell.y}`;
      return !visited.has(key) || key === targetKey;
    });
    if (neighbors.length === 0) break;

    const toward = neighbors
      .filter((cell) => (distances.get(`${cell.x},${cell.y}`) ?? 999) < currentDist)
      .sort(
        (a, b) =>
          (distances.get(`${a.x},${a.y}`) ?? 0) - (distances.get(`${b.x},${b.y}`) ?? 0),
      );
    const sideways = neighbors.filter(
      (cell) => (distances.get(`${cell.x},${cell.y}`) ?? -1) === currentDist,
    );

    const roll = rng();
    let next: Vec2;
    if (roll < 0.82 && toward.length > 0) {
      const best = toward.slice(0, Math.min(2, toward.length));
      next = best[Math.floor(rng() * best.length)];
    } else if (sideways.length > 0) {
      next = sideways[Math.floor(rng() * sideways.length)];
    } else if (toward.length > 0) {
      next = toward[0];
    } else {
      next = neighbors[0];
    }
    const nextKey = `${next.x},${next.y}`;
    path.push(next);
    visited.add(nextKey);
    current = next;
  }

  if (`${current.x},${current.y}` !== targetKey) {
    appendShortestSolidPath(blocks, current, target, cols, rows, path, visited);
  }

  return path;
}

/** Извилистая цепочка твёрдых блоков (8 направлений) от далёкой клетки к цели. */
export function buildHintTrail(
  blocks: BlockCell[][],
  targetCol: number,
  targetRow: number,
  cols: number,
  rows: number,
): Vec2[] {
  if (!isSolid(blocks, targetCol, targetRow)) return [];

  const distances = bfsDistancesFromTarget(blocks, targetCol, targetRow, cols, rows);
  const candidates: Vec2[] = [];

  for (const [key, depth] of distances) {
    if (depth < HINT_TRAIL_MIN_DEPTH || depth > HINT_TRAIL_MAX_DEPTH) continue;
    const [x, y] = key.split(",").map(Number);
    candidates.push({ x, y });
  }

  if (candidates.length === 0) {
    for (const [key, depth] of distances) {
      if (depth < 3) continue;
      const [x, y] = key.split(",").map(Number);
      candidates.push({ x, y });
    }
  }
  if (candidates.length === 0) return [{ x: targetCol, y: targetRow }];

  const rng = makeTrailRng(targetCol, targetRow);
  const start = candidates[Math.floor(rng() * candidates.length)];
  return buildWindingSolidPath(
    blocks,
    start,
    { x: targetCol, y: targetRow },
    distances,
    cols,
    rows,
    rng,
  );
}

export function manhattanDist(a: Vec2, b: Vec2): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function chebyshevDist(a: Vec2, b: Vec2): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

export function getBlock(blocks: BlockCell[][], col: number, row: number): BlockCell {
  return blocks[row]?.[col] ?? 0;
}

export function pickaxeLabel(level: PickaxeLevel, hasPierce: boolean, hasSideBreak: boolean): string {
  const parts: string[] = [];
  if (level === 0) parts.push("Обычная");
  else if (level === 1) parts.push("Улучш.");
  else if (level === 2) parts.push("3 ур.");
  else parts.push("4 ур.");
  if (hasPierce) parts.push("+пробив");
  if (hasSideBreak) parts.push("+бок");
  return parts.join(" ");
}
