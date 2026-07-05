import {
  CODE_LENGTH,
  codeTypeLabel,
  createComputerPosition,
  createHiddenCodes,
  hiddenCodesToMap,
  isComputerCell,
  isValidCodeChar,
  LADDER_CODE_REWARD,
  resizeHiddenCodes,
  type HiddenCode,
} from "./codes";
import {
  CELL_SIZE,
  createDeepPickaxeShop,
  createEmptyLadders,
  createShopPositions,
  createSolidGrid,
  createStartMole,
  directionDelta,
  getBlock,
  getCameraCol,
  getIronRegionStart,
  getSurfaceRows,
  getViewportDimensions,
  getWorldCols,
  getWorldOffset,
  hasLadder,
  ironCellFromHitsRemaining,
  ironDamagePerHit,
  ironHitsRemaining,
  isHardBlock,
  isInsideGrid,
  isIronBlock,
  isShopCell,
  isSkyRow,
  isSolid,
  LADDER_PACK_COST,
  LADDER_PACK_SIZE,
  PICKAXE_HARD_COST,
  PICKAXE_NORMAL_COST,
  PICKAXE3_HARD_COST,
  PICKAXE3_NORMAL_COST,
  resizeGrid,
  resizeLadders,
  STARTING_LADDERS,
  type BlockCell,
  type Currency,
  type Direction,
  type MoleState,
  type PickaxeLevel,
  type ShopPositions,
} from "./grid";
import { Input } from "./Input";
import type { Vec2 } from "./types";

function codeKey(col: number, row: number): string {
  return `${col},${row}`;
}

export interface GameState {
  elapsed: number;
  width: number;
  height: number;
  cellSize: number;
  cols: number;
  viewportCols: number;
  rows: number;
  surfaceRows: number;
  ironRegionStart: number;
  cameraCol: number;
  worldOffset: Vec2;
  blocks: BlockCell[][];
  ladders: boolean[][];
  mole: MoleState;
  currency: Currency;
  ladderCount: number;
  pickaxeLevel: PickaxeLevel;
  hasPiercePickaxe: boolean;
  hasSideBreak: boolean;
  shops: ShopPositions;
  computer: Vec2;
  atLadderShop: boolean;
  atPickaxeShop: boolean;
  atDeepPickaxeShop: boolean;
  atComputer: boolean;
  usingComputer: boolean;
  codeInput: string;
  codeMessage: string | null;
  discoveredCodes: string[];
  buriedCodeCells: Vec2[];
}

export class Game {
  private input = new Input();
  private elapsed = 0;
  private width = window.innerWidth;
  private height = window.innerHeight;
  private viewportCols = 1;
  private cols = 1;
  private rows = 1;
  private surfaceRows = 1;
  private blocks: BlockCell[][] = [];
  private ladders: boolean[][] = [];
  private ladderCount = STARTING_LADDERS;
  private currency: Currency = { normal: 0, hard: 0 };
  private pickaxeLevel: PickaxeLevel = 0;
  private hasPiercePickaxe = false;
  private hasSideBreak = false;
  private shops: ShopPositions = {
    ladder: { x: 2, y: 0 },
    pickaxe: { x: 3, y: 0 },
    deepPickaxe: null,
  };
  private computer: Vec2 = { x: 0, y: 0 };
  private hiddenCodes: HiddenCode[] = [];
  private codeMap = new Map<string, HiddenCode>();
  private discoveredCodes: string[] = [];
  private usedCodes: string[] = [];
  private codeInput = "";
  private codeMessage: string | null = null;
  private usingComputer = false;
  private mole: MoleState = { col: 0, row: 0, facing: "down" };
  private lastTime = 0;
  private running = false;
  private readonly onResize = (): void => {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.applyViewportSize();
    this.emitState();
  };

  constructor(private onStateChange?: (state: GameState) => void) {
    this.applyViewportSize();
    window.addEventListener("resize", this.onResize);
    this.emitState();
  }

  start(): void {
    this.running = true;
    requestAnimationFrame((time) => this.loop(time));
  }

  stop(): void {
    this.running = false;
    this.input.destroy();
    window.removeEventListener("resize", this.onResize);
  }

  restart(): void {
    this.elapsed = 0;
    this.lastTime = 0;
    this.applyViewportSize(true);
    this.emitState();
  }

  private initWorld(viewportCols: number, rows: number, surfaceRows: number): void {
    const worldCols = getWorldCols(viewportCols);
    this.viewportCols = viewportCols;
    this.cols = worldCols;
    this.rows = rows;
    this.surfaceRows = surfaceRows;
    this.blocks = createSolidGrid(worldCols, rows, surfaceRows, viewportCols);
    this.ladders = createEmptyLadders(worldCols, rows);
    this.ladderCount = STARTING_LADDERS;
    this.currency = { normal: 0, hard: 0 };
    this.pickaxeLevel = 0;
    this.hasPiercePickaxe = false;
    this.hasSideBreak = false;
    this.shops = createShopPositions(viewportCols, surfaceRows);
    this.computer = createComputerPosition(viewportCols, surfaceRows);
    const deepShop = createDeepPickaxeShop(worldCols, rows, surfaceRows, viewportCols, [
      this.shops.ladder,
      this.shops.pickaxe,
      this.computer,
    ]);
    this.shops = { ...this.shops, deepPickaxe: deepShop };
    this.hiddenCodes = createHiddenCodes(worldCols, rows, surfaceRows, viewportCols, [deepShop]);
    this.codeMap = hiddenCodesToMap(this.hiddenCodes);
    this.discoveredCodes = [];
    this.usedCodes = [];
    this.codeInput = "";
    this.codeMessage = null;
    this.usingComputer = false;
    this.mole = createStartMole(viewportCols, surfaceRows);
  }

  private applyViewportSize(reset = false): void {
    const { viewportCols, rows } = getViewportDimensions(this.width, this.height);
    const surfaceRows = getSurfaceRows(rows);
    const worldCols = getWorldCols(viewportCols);

    if (reset || this.blocks.length === 0) {
      this.initWorld(viewportCols, rows, surfaceRows);
      return;
    }

    const deepShop = this.shops.deepPickaxe;
    this.blocks = resizeGrid(
      this.blocks,
      this.viewportCols,
      this.rows,
      this.surfaceRows,
      viewportCols,
      rows,
      surfaceRows,
    );
    this.ladders = resizeLadders(
      this.ladders,
      this.viewportCols,
      this.rows,
      this.surfaceRows,
      viewportCols,
      rows,
      surfaceRows,
    );
    this.hiddenCodes = resizeHiddenCodes(
      this.hiddenCodes,
      this.viewportCols,
      this.rows,
      this.surfaceRows,
      viewportCols,
      rows,
      surfaceRows,
      deepShop ? [deepShop] : [],
    );
    this.codeMap = hiddenCodesToMap(this.hiddenCodes);
    this.viewportCols = viewportCols;
    this.cols = worldCols;
    this.rows = rows;
    this.surfaceRows = surfaceRows;
    this.shops = {
      ...createShopPositions(viewportCols, surfaceRows),
      deepPickaxe: deepShop,
    };
    this.computer = createComputerPosition(viewportCols, surfaceRows);
    this.mole.col = Math.min(this.mole.col, worldCols - 1);
    this.mole.row = Math.min(this.mole.row, rows - 1);
  }

  private loop(time: number): void {
    if (!this.running) return;

    const dt = this.lastTime === 0 ? 0 : (time - this.lastTime) / 1000;
    this.lastTime = time;

    this.update(dt);

    requestAnimationFrame((t) => this.loop(t));
  }

  private update(dt: number): void {
    this.elapsed += dt;
    this.handleInput();
    this.applyGravity();
    this.emitState();
  }

  private handleInput(): void {
    if (this.usingComputer) {
      if (this.input.isPressed("Escape")) {
        this.usingComputer = false;
        this.codeInput = "";
        return;
      }

      this.handleComputerInput();
      return;
    }

    if (this.input.isPressed("KeyF")) {
      if (
        this.mole.col === this.shops.ladder.x &&
        this.mole.row === this.shops.ladder.y
      ) {
        this.buyLadders();
      } else if (
        this.mole.col === this.shops.pickaxe.x &&
        this.mole.row === this.shops.pickaxe.y
      ) {
        this.buySurfacePickaxe();
      } else if (
        this.shops.deepPickaxe &&
        this.mole.col === this.shops.deepPickaxe.x &&
        this.mole.row === this.shops.deepPickaxe.y
      ) {
        this.buyDeepPickaxe();
      }
    }

    const placeAhead =
      this.input.isDown("ShiftLeft") ||
      this.input.isDown("ShiftRight") ||
      this.input.isDown("Shift");

    if (this.input.isPressed("KeyQ")) {
      this.removeLadder();
    } else if (this.input.isPressed("KeyE")) {
      if (isComputerCell(this.mole.col, this.mole.row, this.computer)) {
        this.usingComputer = true;
        this.input.consumePressedChars();
        return;
      }
      if (placeAhead) {
        this.placeLadderAhead();
      } else {
        this.placeLadder();
      }
    } else if (this.input.isPressed("Space")) {
      if (placeAhead) {
        this.placeLadderAhead();
      } else {
        this.placeLadder();
      }
    }

    const directions: Direction[] = ["up", "down", "left", "right"];

    for (const direction of directions) {
      const keyCodes =
        direction === "up"
          ? ["ArrowUp", "KeyW"]
          : direction === "down"
            ? ["ArrowDown", "KeyS"]
            : direction === "left"
              ? ["ArrowLeft", "KeyA"]
              : ["ArrowRight", "KeyD"];

      const pressed = keyCodes.some((code) => this.input.isPressed(code));
      if (!pressed) continue;

      this.move(direction);
      return;
    }
  }

  private handleComputerInput(): void {
    if (this.input.isPressed("Backspace")) {
      this.codeInput = this.codeInput.slice(0, -1);
      return;
    }

    if (this.input.isPressed("Enter") || this.input.isPressed("NumpadEnter")) {
      this.submitCode();
      return;
    }

    for (const char of this.input.consumePressedChars()) {
      if (this.codeInput.length >= CODE_LENGTH) continue;
      if (!isValidCodeChar(char)) continue;
      this.codeInput += char;
    }
  }

  private submitCode(): void {
    if (this.codeInput.length !== CODE_LENGTH) {
      this.codeMessage = "Код должен быть из 6 букв";
      return;
    }

    if (this.usedCodes.includes(this.codeInput)) {
      this.codeMessage = "Этот код уже использован";
      this.codeInput = "";
      return;
    }

    const match = this.hiddenCodes.find((entry) => entry.code === this.codeInput);
    if (!match) {
      this.codeMessage = "Неверный код";
      this.codeInput = "";
      return;
    }

    this.usedCodes.push(this.codeInput);

    if (match.type === "ladder") {
      this.ladderCount += LADDER_CODE_REWARD;
      this.codeMessage = `+${LADDER_CODE_REWARD} лестниц!`;
    } else if (match.type === "pierce") {
      this.hasPiercePickaxe = true;
      this.codeMessage = "Кирка пробивает 2 блока за удар!";
    } else {
      this.hasSideBreak = true;
      this.codeMessage = "Удары ломают блоки по бокам!";
    }

    this.codeInput = "";
  }

  private buyLadders(): void {
    if (this.currency.normal < LADDER_PACK_COST) return;

    this.currency.normal -= LADDER_PACK_COST;
    this.ladderCount += LADDER_PACK_SIZE;
  }

  private buySurfacePickaxe(): void {
    if (this.pickaxeLevel >= 1) return;
    if (this.currency.hard < PICKAXE_HARD_COST) return;
    if (this.currency.normal < PICKAXE_NORMAL_COST) return;

    this.currency.hard -= PICKAXE_HARD_COST;
    this.currency.normal -= PICKAXE_NORMAL_COST;
    this.pickaxeLevel = 1;
  }

  private buyDeepPickaxe(): void {
    if (this.pickaxeLevel < 1) return;
    if (this.pickaxeLevel >= 2) return;
    if (this.currency.hard < PICKAXE3_HARD_COST) return;
    if (this.currency.normal < PICKAXE3_NORMAL_COST) return;

    this.currency.hard -= PICKAXE3_HARD_COST;
    this.currency.normal -= PICKAXE3_NORMAL_COST;
    this.pickaxeLevel = 2;
  }

  private placeLadder(): void {
    this.placeLadderAt(this.mole.col, this.mole.row);
  }

  private placeLadderAhead(): void {
    const delta = directionDelta(this.mole.facing);
    this.placeLadderAt(this.mole.col + delta.x, this.mole.row + delta.y);
  }

  private placeLadderAt(col: number, row: number): void {
    if (this.ladderCount <= 0) return;
    if (!isInsideGrid(col, row, this.cols, this.rows)) return;
    if (!isSkyRow(row, this.surfaceRows) && isSolid(this.blocks, col, row)) return;
    if (hasLadder(this.ladders, col, row)) return;
    if (isShopCell(col, row, this.shops)) return;
    if (isComputerCell(col, row, this.computer)) return;

    this.ladders[row][col] = true;
    this.ladderCount -= 1;
  }

  private removeLadder(): void {
    const { col, row } = this.mole;
    if (!hasLadder(this.ladders, col, row)) return;

    this.ladders[row][col] = false;
    this.ladderCount += 1;
  }

  private revealCodeIfAny(col: number, row: number): void {
    const entry = this.codeMap.get(codeKey(col, row));
    if (!entry) return;

    if (!this.discoveredCodes.includes(entry.code)) {
      this.discoveredCodes.push(entry.code);
      this.codeMessage = `Найден код (${codeTypeLabel(entry.type)}): ${entry.code}`;
    }

    this.codeMap.delete(codeKey(col, row));
  }

  private strikeBlock(
    col: number,
    row: number,
    direction?: Direction,
    allowSideBreak = true,
    allowPierce = true,
  ): boolean {
    const cell = getBlock(this.blocks, col, row);
    if (cell === 0) return true;

    if (isIronBlock(cell)) {
      const hitsLeft = ironHitsRemaining(cell);
      const damage = ironDamagePerHit(this.pickaxeLevel);
      const newHitsLeft = hitsLeft - damage;

      if (newHitsLeft <= 0) {
        this.blocks[row][col] = 0;
        this.revealCodeIfAny(col, row);
        this.pierceNextBlock(col, row, direction, allowPierce);
        if (allowSideBreak) this.strikeSideBlocks(col, row, direction);
        return true;
      }

      this.blocks[row][col] = ironCellFromHitsRemaining(newHitsLeft);
      return false;
    }

    if (this.pickaxeLevel >= 1 && isHardBlock(cell)) {
      this.blocks[row][col] = 0;
      this.currency.hard += 1;
      this.revealCodeIfAny(col, row);
      this.pierceNextBlock(col, row, direction, allowPierce);
      if (allowSideBreak) this.strikeSideBlocks(col, row, direction);
      return true;
    }

    if (cell === 2) {
      this.blocks[row][col] = 3;
      return false;
    }

    const wasHard = cell === 3;
    this.blocks[row][col] = 0;
    if (wasHard) this.currency.hard += 1;
    else this.currency.normal += 1;
    this.revealCodeIfAny(col, row);
    this.pierceNextBlock(col, row, direction, allowPierce);
    if (allowSideBreak) this.strikeSideBlocks(col, row, direction);
    return true;
  }

  private pierceNextBlock(
    col: number,
    row: number,
    direction?: Direction,
    allowPierce = true,
  ): void {
    if (!allowPierce || !this.hasPiercePickaxe || !direction) return;

    const delta = directionDelta(direction);
    const nextCol = col + delta.x;
    const nextRow = row + delta.y;

    if (!isInsideGrid(nextCol, nextRow, this.cols, this.rows)) return;
    if (isSkyRow(nextRow, this.surfaceRows)) return;
    if (!isSolid(this.blocks, nextCol, nextRow)) return;

    this.strikeBlock(nextCol, nextRow, direction, false, false);
  }

  private strikeSideBlocks(col: number, row: number, direction?: Direction): void {
    if (!this.hasSideBreak || !direction) return;

    const sideDirections: Direction[] =
      direction === "left" || direction === "right" ? ["up", "down"] : ["left", "right"];

    for (const side of sideDirections) {
      const delta = directionDelta(side);
      const sideCol = col + delta.x;
      const sideRow = row + delta.y;

      if (!isInsideGrid(sideCol, sideRow, this.cols, this.rows)) continue;
      if (isSkyRow(sideRow, this.surfaceRows)) continue;
      if (!isSolid(this.blocks, sideCol, sideRow)) continue;

      this.strikeBlock(sideCol, sideRow, direction, false, false);
    }
  }

  private move(direction: Direction): void {
    this.mole.facing = direction;

    const delta = directionDelta(direction);
    const targetCol = this.mole.col + delta.x;
    const targetRow = this.mole.row + delta.y;

    if (!isInsideGrid(targetCol, targetRow, this.cols, this.rows)) return;

    const targetSolid = !isSkyRow(targetRow, this.surfaceRows) && isSolid(this.blocks, targetCol, targetRow);
    const onLadder = hasLadder(this.ladders, this.mole.col, this.mole.row);

    if (direction === "up") {
      if (targetSolid) {
        if (!this.strikeBlock(targetCol, targetRow, direction)) return;
        this.setMolePosition(targetCol, targetRow);
        return;
      }

      if (!this.canClimbUp(onLadder, targetCol, targetRow)) return;

      this.setMolePosition(targetCol, targetRow);
      return;
    }

    if (direction === "down") {
      if (targetSolid) {
        if (!this.strikeBlock(targetCol, targetRow, direction)) return;
        this.setMolePosition(targetCol, targetRow);
        return;
      }

      if (!onLadder && !isSkyRow(this.mole.row, this.surfaceRows)) return;

      this.setMolePosition(targetCol, targetRow);
      return;
    }

    if (targetSolid) {
      if (!this.strikeBlock(targetCol, targetRow, direction)) return;
    }

    this.setMolePosition(targetCol, targetRow);
  }

  private setMolePosition(col: number, row: number): void {
    this.mole.col = col;
    this.mole.row = row;
  }

  private canClimbUp(onLadder: boolean, targetCol: number, targetRow: number): boolean {
    if (isSkyRow(this.mole.row, this.surfaceRows) && isSkyRow(targetRow, this.surfaceRows)) {
      return true;
    }

    return onLadder && hasLadder(this.ladders, targetCol, targetRow);
  }

  private applyGravity(): void {
    if (this.usingComputer) return;
    if (hasLadder(this.ladders, this.mole.col, this.mole.row)) return;
    if (isShopCell(this.mole.col, this.mole.row, this.shops)) return;
    if (isComputerCell(this.mole.col, this.mole.row, this.computer)) return;

    while (true) {
      const belowRow = this.mole.row + 1;
      if (!isInsideGrid(this.mole.col, belowRow, this.cols, this.rows)) break;
      if (isSolid(this.blocks, this.mole.col, belowRow)) break;

      if (
        isShopCell(this.mole.col, belowRow, this.shops) ||
        isComputerCell(this.mole.col, belowRow, this.computer)
      ) {
        this.mole.row = belowRow;
        break;
      }

      this.mole.row = belowRow;

      if (hasLadder(this.ladders, this.mole.col, this.mole.row)) break;
    }
  }

  private getBuriedCodeCells(): Vec2[] {
    const cells: Vec2[] = [];
    for (const entry of this.codeMap.values()) {
      if (isSolid(this.blocks, entry.col, entry.row)) {
        cells.push({ x: entry.col, y: entry.row });
      }
    }
    return cells;
  }

  private emitState(): void {
    const deep = this.shops.deepPickaxe;
    const cameraCol = getCameraCol(this.mole.col, this.viewportCols, this.cols);

    this.onStateChange?.({
      elapsed: this.elapsed,
      width: this.width,
      height: this.height,
      cellSize: CELL_SIZE,
      cols: this.cols,
      viewportCols: this.viewportCols,
      rows: this.rows,
      surfaceRows: this.surfaceRows,
      ironRegionStart: getIronRegionStart(this.viewportCols),
      cameraCol,
      worldOffset: getWorldOffset(this.width, this.viewportCols, cameraCol),
      blocks: this.blocks.map((row) => [...row]),
      ladders: this.ladders.map((row) => [...row]),
      mole: { ...this.mole },
      currency: { ...this.currency },
      ladderCount: this.ladderCount,
      pickaxeLevel: this.pickaxeLevel,
      hasPiercePickaxe: this.hasPiercePickaxe,
      hasSideBreak: this.hasSideBreak,
      shops: {
        ladder: { ...this.shops.ladder },
        pickaxe: { ...this.shops.pickaxe },
        deepPickaxe: deep ? { ...deep } : null,
      },
      computer: { ...this.computer },
      atLadderShop:
        this.mole.col === this.shops.ladder.x && this.mole.row === this.shops.ladder.y,
      atPickaxeShop:
        this.mole.col === this.shops.pickaxe.x && this.mole.row === this.shops.pickaxe.y,
      atDeepPickaxeShop: deep
        ? this.mole.col === deep.x && this.mole.row === deep.y
        : false,
      atComputer: isComputerCell(this.mole.col, this.mole.row, this.computer),
      usingComputer: this.usingComputer,
      codeInput: this.codeInput,
      codeMessage: this.codeMessage,
      discoveredCodes: [...this.discoveredCodes],
      buriedCodeCells: this.getBuriedCodeCells(),
    });
  }
}

export function createInitialGameState(): GameState {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const { viewportCols, rows } = getViewportDimensions(width, height);
  const surfaceRows = getSurfaceRows(rows);
  const worldCols = getWorldCols(viewportCols);
  const blocks = createSolidGrid(worldCols, rows, surfaceRows, viewportCols);
  const ladders = createEmptyLadders(worldCols, rows);
  const mole = createStartMole(viewportCols, surfaceRows);
  const shops = createShopPositions(viewportCols, surfaceRows);
  const computer = createComputerPosition(viewportCols, surfaceRows);
  const deepPickaxe = createDeepPickaxeShop(worldCols, rows, surfaceRows, viewportCols, [
    shops.ladder,
    shops.pickaxe,
    computer,
  ]);
  const hiddenCodes = createHiddenCodes(worldCols, rows, surfaceRows, viewportCols, [deepPickaxe]);
  const cameraCol = getCameraCol(mole.col, viewportCols, worldCols);

  return {
    elapsed: 0,
    width,
    height,
    cellSize: CELL_SIZE,
    cols: worldCols,
    viewportCols,
    rows,
    surfaceRows,
    ironRegionStart: getIronRegionStart(viewportCols),
    cameraCol,
    worldOffset: getWorldOffset(width, viewportCols, cameraCol),
    blocks,
    ladders,
    mole,
    currency: { normal: 0, hard: 0 },
    ladderCount: STARTING_LADDERS,
    pickaxeLevel: 0,
    hasPiercePickaxe: false,
    hasSideBreak: false,
    shops: { ...shops, deepPickaxe },
    computer,
    atLadderShop: false,
    atPickaxeShop: false,
    atDeepPickaxeShop: false,
    atComputer: false,
    usingComputer: false,
    codeInput: "",
    codeMessage: null,
    discoveredCodes: [],
    buriedCodeCells: hiddenCodes.map((entry) => ({ x: entry.col, y: entry.row })),
  };
}
