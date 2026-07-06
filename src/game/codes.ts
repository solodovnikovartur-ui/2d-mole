import {
  getDeepRegionStartRow,
  getDeepSurfaceRows,
  getIronRegionStart,
  getWorldCols,
  getWorldRows,
  HARD_LAYER_DEPTH,
  isSkyRow,
  type BlockCell,
} from "./grid";
import type { Vec2 } from "./types";

export const CODE_LENGTH = 6;
export const LADDER_CODE_REWARD = 20;
export const BOOST_DURATION = 8;
export const BOOST_COOLDOWN = 20;

export type CodeType = "ladder" | "pierce" | "sidebreak" | "boost" | "lamp";

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
  worldRows: number,
  surfaceRows: number,
  viewportCols: number,
  viewportRows: number,
  exclude: Vec2[] = [],
): HiddenCode[] {
  const ironStart = getIronRegionStart(viewportCols);
  const deepStart = getDeepRegionStartRow(viewportRows);
  const deepMinRow = deepStart + getDeepSurfaceRows(viewportRows) + HARD_LAYER_DEPTH;
  const mainCandidates: Vec2[] = [];
  const ironCandidates: Vec2[] = [];
  const deepCandidates: Vec2[] = [];

  for (let row = surfaceRows; row < viewportRows; row += 1) {
    for (let col = 0; col < worldCols; col += 1) {
      if (isExcluded(col, row, exclude)) continue;

      if (col >= ironStart) {
        ironCandidates.push({ x: col, y: row });
      } else {
        mainCandidates.push({ x: col, y: row });
      }
    }
  }

  for (let row = deepMinRow; row < worldRows - 1; row += 1) {
    for (let col = 0; col < worldCols; col += 1) {
      if (isExcluded(col, row, exclude)) continue;
      deepCandidates.push({ x: col, y: row });
    }
  }

  const ladderCell = pickRandom(mainCandidates);
  const pierceCell = pickRandom(
    mainCandidates.filter(
      (cell) => !ladderCell || cell.x !== ladderCell.x || cell.y !== ladderCell.y,
    ),
  );
  const sideCell = pickRandom(ironCandidates);
  const boostCell = pickRandom(deepCandidates);
  const lampCell = pickRandom(
    deepCandidates.filter(
      (cell) => !boostCell || cell.x !== boostCell.x || cell.y !== boostCell.y,
    ),
  );

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
  if (boostCell) {
    codes.push({ col: boostCell.x, row: boostCell.y, type: "boost", code: generateCode() });
  }
  if (lampCell) {
    codes.push({ col: lampCell.x, row: lampCell.y, type: "lamp", code: generateCode() });
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

function remapCodeRow(
  entry: HiddenCode,
  surfaceRows: number,
  newSurfaceRows: number,
  oldDeepStart: number,
  newDeepStart: number,
  newWorldCols: number,
  newWorldRows: number,
): HiddenCode | null {
  if (entry.col >= newWorldCols) return null;

  if (entry.row >= oldDeepStart) {
    const localRow = entry.row - oldDeepStart;
    const newRow = newDeepStart + localRow;
    if (newRow < newDeepStart || newRow >= newWorldRows) return null;
    return { ...entry, row: newRow };
  }

  if (entry.row < surfaceRows) return null;

  const newRow = entry.row - surfaceRows + newSurfaceRows;
  if (newRow < newSurfaceRows || newRow >= newDeepStart) return null;
  return { ...entry, row: newRow };
}

export function resizeHiddenCodes(
  codes: HiddenCode[],
  _oldViewportCols: number,
  oldViewportRows: number,
  surfaceRows: number,
  newViewportCols: number,
  newViewportRows: number,
  newSurfaceRows: number,
  exclude: Vec2[] = [],
): HiddenCode[] {
  const newWorldCols = getWorldCols(newViewportCols);
  const newWorldRows = getWorldRows(newViewportRows);
  const oldDeepStart = getDeepRegionStartRow(oldViewportRows);
  const newDeepStart = getDeepRegionStartRow(newViewportRows);

  const preserved = codes
    .map((entry) =>
      remapCodeRow(
        entry,
        surfaceRows,
        newSurfaceRows,
        oldDeepStart,
        newDeepStart,
        newWorldCols,
        newWorldRows,
      ),
    )
    .filter((entry): entry is HiddenCode => entry !== null);

  if (preserved.length >= 5) {
    return preserved.slice(0, 5);
  }

  return createHiddenCodes(
    newWorldCols,
    newWorldRows,
    newSurfaceRows,
    newViewportCols,
    newViewportRows,
    exclude,
  );
}

export function codeTypeLabel(type: CodeType): string {
  switch (type) {
    case "ladder":
      return "магазина лестниц";
    case "pierce":
      return "магазина кирок";
    case "sidebreak":
      return "железных земель";
    case "boost":
      return "магазина кирок 4 уровня";
    case "lamp":
      return "магазина ламп";
  }
}

export function createComputerPosition(viewportCols: number, surfaceRows: number): Vec2 {
  const shaftCol = Math.floor(viewportCols / 2);
  return {
    x: shaftCol <= 2 ? shaftCol + 2 : shaftCol - 2,
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
