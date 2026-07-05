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

/** 0 empty · 1 normal · 2 hard · 3 hard dmg · 4 iron · 5 iron dmg1 · 6 iron dmg2 */
export type BlockCell = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type Direction = "up" | "down" | "left" | "right";
export type PickaxeLevel = 0 | 1 | 2;

export interface MoleState {
  col: number;
  row: number;
  facing: Direction;
}

export interface Currency {
  normal: number;
  hard: number;
}

export interface ShopPositions {
  ladder: Vec2;
  pickaxe: Vec2;
  deepPickaxe: Vec2 | null;
}

/** Visible columns on screen (viewport width). */
export function getViewportDimensions(width: number, height: number): { viewportCols: number; rows: number } {
  return {
    viewportCols: Math.max(1, Math.floor(width / CELL_SIZE)),
    rows: Math.max(1, Math.floor(height / CELL_SIZE)),
  };
}

/** @deprecated Use getViewportDimensions — kept for module compatibility. */
export function getGridDimensions(width: number, height: number): { cols: number; rows: number } {
  const { viewportCols, rows } = getViewportDimensions(width, height);
  return { cols: viewportCols, rows };
}

/** Extra columns to the right of the viewport (off-screen iron lands). */
export function getIronRegionExtraCols(viewportCols: number): number {
  return viewportCols;
}

export function getWorldCols(viewportCols: number): number {
  return viewportCols + getIronRegionExtraCols(viewportCols);
}

export function getIronRegionStart(viewportCols: number): number {
  return viewportCols;
}

export function isIronRegionCol(col: number, viewportCols: number): boolean {
  return col >= getIronRegionStart(viewportCols);
}

export function getCameraCol(moleCol: number, viewportCols: number, worldCols: number): number {
  const maxCamera = Math.max(0, worldCols - viewportCols);
  if (maxCamera === 0) return 0;

  const centered = moleCol - Math.floor(viewportCols / 2);
  return Math.max(0, Math.min(centered, maxCamera));
}

export function getWorldOffset(width: number, viewportCols: number, cameraCol: number): Vec2 {
  const viewportOffset = getGridOffset(width, viewportCols);
  return {
    x: viewportOffset.x - cameraCol * CELL_SIZE,
    y: 0,
  };
}

export function getSurfaceRows(totalRows: number): number {
  return Math.max(3, Math.floor(totalRows * 0.2));
}

export function getGridOffset(width: number, cols: number): Vec2 {
  const gridWidth = cols * CELL_SIZE;
  return {
    x: (width - gridWidth) / 2,
    y: 0,
  };
}

export function isSkyRow(row: number, surfaceRows: number): boolean {
  return row < surfaceRows;
}

export function isIronBlock(cell: BlockCell): boolean {
  return cell >= 4 && cell <= 6;
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
  if (pickaxeLevel >= 2) return 3;
  if (pickaxeLevel >= 1) return 2;
  return 1;
}

export function ironCellFromHitsRemaining(hits: number): BlockCell {
  return (7 - hits) as BlockCell;
}

export function createBlockForCell(
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

export function createSolidGrid(
  worldCols: number,
  rows: number,
  surfaceRows: number,
  viewportCols: number,
): BlockCell[][] {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: worldCols }, (_, col) =>
      createBlockForCell(col, row, viewportCols, surfaceRows),
    ),
  );
}

export function createEmptyLadders(cols: number, rows: number): boolean[][] {
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

export function createDeepPickaxeShop(
  worldCols: number,
  rows: number,
  surfaceRows: number,
  viewportCols: number,
  exclude: Vec2[],
): Vec2 {
  const ironStart = getIronRegionStart(viewportCols);
  const candidates: Vec2[] = [];

  for (let row = surfaceRows + 2; row < rows - 1; row += 1) {
    for (let col = ironStart; col < worldCols; col += 1) {
      if (exclude.some((cell) => cell.x === col && cell.y === row)) continue;
      candidates.push({ x: col, y: row });
    }
  }

  if (candidates.length === 0) {
    return { x: Math.max(ironStart, worldCols - 2), y: surfaceRows + 2 };
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

export function resizeGrid(
  blocks: BlockCell[][],
  oldViewportCols: number,
  rows: number,
  surfaceRows: number,
  newViewportCols: number,
  newRows: number,
  newSurfaceRows: number,
): BlockCell[][] {
  const oldWorldCols = getWorldCols(oldViewportCols);
  const newWorldCols = getWorldCols(newViewportCols);
  const oldIronStart = getIronRegionStart(oldViewportCols);
  const newIronStart = getIronRegionStart(newViewportCols);

  return Array.from({ length: newRows }, (_, row) =>
    Array.from({ length: newWorldCols }, (_, col) => {
      if (row < newSurfaceRows) return 0;

      const oldRow = row - newSurfaceRows + surfaceRows;

      if (oldRow >= surfaceRows && oldRow < rows && col < oldWorldCols && col < newWorldCols) {
        const oldCell = blocks[oldRow][col];
        const wasIron = col >= oldIronStart;
        const isIron = col >= newIronStart;
        if (wasIron === isIron) return oldCell;
      }

      return createBlockForCell(col, row, newViewportCols, newSurfaceRows);
    }),
  );
}

export function resizeLadders(
  ladders: boolean[][],
  oldViewportCols: number,
  rows: number,
  surfaceRows: number,
  newViewportCols: number,
  newRows: number,
  newSurfaceRows: number,
): boolean[][] {
  const oldWorldCols = getWorldCols(oldViewportCols);
  const newWorldCols = getWorldCols(newViewportCols);

  return Array.from({ length: newRows }, (_, row) =>
    Array.from({ length: newWorldCols }, (_, col) => {
      if (row < newSurfaceRows && row < rows && col < oldWorldCols && col < newWorldCols) {
        return ladders[row][col];
      }

      if (row < newSurfaceRows) return false;

      const oldRow = row - newSurfaceRows + surfaceRows;
      if (oldRow >= surfaceRows && oldRow < rows && col < oldWorldCols && col < newWorldCols) {
        return ladders[oldRow][col];
      }

      return false;
    }),
  );
}

export function hasLadder(ladders: boolean[][], col: number, row: number): boolean {
  return ladders[row]?.[col] ?? false;
}

export function isSolid(blocks: BlockCell[][], col: number, row: number): boolean {
  return (blocks[row]?.[col] ?? 0) > 0;
}

export function getBlock(blocks: BlockCell[][], col: number, row: number): BlockCell {
  return blocks[row]?.[col] ?? 0;
}

export function pickaxeLabel(level: PickaxeLevel, hasPierce: boolean, hasSideBreak: boolean): string {
  const parts: string[] = [];
  if (level === 0) parts.push("Обычная");
  else if (level === 1) parts.push("Улучш.");
  else parts.push("3 ур.");
  if (hasPierce) parts.push("+пробив");
  if (hasSideBreak) parts.push("+бок");
  return parts.join(" ");
}
