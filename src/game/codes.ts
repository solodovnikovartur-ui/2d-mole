import { getIronRegionStart, getWorldCols, isSkyRow, type BlockCell } from "./grid";
import type { Vec2 } from "./types";

export const CODE_LENGTH = 6;
export const LADDER_CODE_REWARD = 20;

export type CodeType = "ladder" | "pierce" | "sidebreak";

export interface HiddenCode {
  col: number;
  row: number;
  type: CodeType;
  code: string;
}

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export function codeKey(col: number, row: number): string {
  return `${col},${row}`;
}

function isExcluded(col: number, row: number, exclude: Vec2[]): boolean {
  return exclude.some((cell) => cell.x === col && cell.y === row);
}

function pickRandom<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

export function createHiddenCodes(
  worldCols: number,
  rows: number,
  surfaceRows: number,
  viewportCols: number,
  exclude: Vec2[] = [],
): HiddenCode[] {
  const ironStart = getIronRegionStart(viewportCols);
  const mainCandidates: Vec2[] = [];
  const ironCandidates: Vec2[] = [];

  for (let row = surfaceRows; row < rows; row += 1) {
    for (let col = 0; col < worldCols; col += 1) {
      if (isExcluded(col, row, exclude)) continue;

      if (col >= ironStart) {
        ironCandidates.push({ x: col, y: row });
      } else {
        mainCandidates.push({ x: col, y: row });
      }
    }
  }

  const ladderCell = pickRandom(mainCandidates);
  const pierceCell = pickRandom(
    mainCandidates.filter(
      (cell) => !ladderCell || cell.x !== ladderCell.x || cell.y !== ladderCell.y,
    ),
  );
  const sideCell = pickRandom(ironCandidates);

  const codes: HiddenCode[] = [];

  if (ladderCell) {
    codes.push({ col: ladderCell.x, row: ladderCell.y, type: "ladder", code: generateCode() });
  }
  if (pierceCell) {
    codes.push({ col: pierceCell.x, row: pierceCell.y, type: "pierce", code: generateCode() });
  }
  if (sideCell) {
    codes.push({ col: sideCell.x, row: sideCell.y, type: "sidebreak", code: generateCode() });
  }

  return codes;
}

export function hiddenCodesToMap(codes: HiddenCode[]): Map<string, HiddenCode> {
  const map = new Map<string, HiddenCode>();
  for (const entry of codes) {
    map.set(codeKey(entry.col, entry.row), entry);
  }
  return map;
}

export function resizeHiddenCodes(
  codes: HiddenCode[],
  _oldViewportCols: number,
  _rows: number,
  surfaceRows: number,
  newViewportCols: number,
  newRows: number,
  newSurfaceRows: number,
  exclude: Vec2[] = [],
): HiddenCode[] {
  const newWorldCols = getWorldCols(newViewportCols);
  const preserved = codes
    .map((entry) => {
      if (entry.row < surfaceRows) return null;

      const newRow = entry.row - surfaceRows + newSurfaceRows;
      if (newRow < newSurfaceRows || newRow >= newRows) return null;
      if (entry.col >= newWorldCols) return null;

      return { ...entry, row: newRow, col: entry.col };
    })
    .filter((entry): entry is HiddenCode => entry !== null);

  if (preserved.length >= 3) {
    return preserved.slice(0, 3);
  }

  return createHiddenCodes(newWorldCols, newRows, newSurfaceRows, newViewportCols, exclude);
}

export function codeTypeLabel(type: CodeType): string {
  switch (type) {
    case "ladder":
      return "магазина лестниц";
    case "pierce":
      return "магазина кирок";
    case "sidebreak":
      return "железных земель";
  }
}

export function createComputerPosition(viewportCols: number, surfaceRows: number): Vec2 {
  return {
    x: Math.floor(viewportCols / 2),
    y: surfaceRows - 1,
  };
}

export function isValidCodeChar(char: string): boolean {
  return /^[A-Z]$/.test(char);
}

export function isComputerCell(col: number, row: number, computer: Vec2): boolean {
  return computer.x === col && computer.y === row;
}

export function hasCodeBlock(
  blocks: BlockCell[][],
  codeMap: Map<string, HiddenCode>,
  col: number,
  row: number,
  surfaceRows: number,
): boolean {
  if (isSkyRow(row, surfaceRows)) return false;
  return (blocks[row]?.[col] ?? 0) > 0 && codeMap.has(codeKey(col, row));
}
