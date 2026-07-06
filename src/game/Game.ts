import {
  BOOST_COOLDOWN,
  BOOST_DURATION,
  CODE_LENGTH,
  codeTypeLabel,
  createComputerPosition,
  createHiddenCodes,
  hiddenCodesToMap,
  isComputerCell,
  isValidCodeChar,
  LADDER_CODE_REWARD,
  resizeHiddenCodes,
  type CodeType,
  type HiddenCode,
} from "./codes";
import {
  CELL_SIZE,
  createDeepPickaxeShop,
  createDeepShops,
  createEmptyLadders,
  createEmptyRopes,
  createShopPositions,
  createSolidGrid,
  createStartMole,
  diamondCellFromHitsRemaining,
  diamondDamagePerHit,
  diamondHitsRemaining,
  directionDelta,
  buildHintTrail,
  chebyshevDist,
  getBlock,
  getCameraCol,
  getCameraRow,
  getDeepMolePosition,
  getDeepSurfaceRows,
  getIronRegionStart,
  getSurfaceRows,
  getViewportDimensions,
  getWorldCols,
  getWorldOffset,
  getWorldRows,
  hasLadder,
  hasRope,
  hasRopeInColumn,
  ironCellFromHitsRemaining,
  ironDamagePerHit,
  ironHitsRemaining,
  isDeepRegionRow,
  isDeepShopCell,
  isDiamondBlock,
  isHardBlock,
  isInsideGrid,
  isIronBlock,
  isIronUndergroundCell,
  isShopCell,
  isSkyAt,
  isSolid,
  strikeCellType,
  LADDER_PACK_COST,
  LADDER_PACK_SIZE,
  LAMP_COST,
  ROPE_COST,
  PICKAXE_HARD_COST,
  PICKAXE_NORMAL_COST,
  PICKAXE3_HARD_COST,
  PICKAXE3_NORMAL_COST,
  PICKAXE4_DIAMOND_COST,
  PICKAXE4_IRON_COST,
  resizeGrid,
  resizeLadders,
  resizeRopes,
  STARTING_LADDERS,
  type BlockCell,
  type Currency,
  type DeepShopPositions,
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

function trailTargetKey(cell: Vec2): string {
  return `${cell.x},${cell.y}`;
}

export interface BookEntry {
  code: string;
  label: string;
  type: CodeType;
  col: number;
  row: number;
}

export interface BuriedCodeInscription {
  col: number;
  row: number;
  code: string;
}

export interface GameState {
  elapsed: number;
  width: number;
  height: number;
  cellSize: number;
  cols: number;
  viewportCols: number;
  rows: number;
  viewportRows: number;
  surfaceRows: number;
  deepRegionStart: number;
  deepSurfaceRows: number;
  ironRegionStart: number;
  cameraCol: number;
  cameraRow: number;
  worldOffset: Vec2;
  blocks: BlockCell[][];
  ladders: boolean[][];
  ropes: boolean[][];
  mole: MoleState;
  currency: Currency;
  ladderCount: number;
  pickaxeLevel: PickaxeLevel;
  hasPiercePickaxe: boolean;
  hasSideBreak: boolean;
  hasLamp: boolean;
  hasExpandedLamp: boolean;
  boostUnlocked: boolean;
  boostActive: boolean;
  boostTimeLeft: number;
  boostCooldownLeft: number;
  ropeCount: number;
  inDeepRegion: boolean;
  deepMole: Vec2;
  shops: ShopPositions;
  deepShops: DeepShopPositions;
  computer: Vec2;
  atLadderShop: boolean;
  atPickaxeShop: boolean;
  atDeepPickaxeShop: boolean;
  atLampShop: boolean;
  atRopeShop: boolean;
  atDeepPickaxe4Shop: boolean;
  atComputer: boolean;
  usingComputer: boolean;
  codeInput: string;
  codeMessage: string | null;
  bookEntries: BookEntry[];
  buriedCodeInscriptions: BuriedCodeInscription[];
  hintDot: Vec2 | null;
}

interface SecretTrail {
  target: Vec2;
  path: Vec2[];
  progress: number;
  found: boolean;
}

const HINT_ACTIVATE_RADIUS = 10;
const HINT_ADVANCE_RADIUS = 1;
const HINT_FIND_RADIUS = 2;
const CODE_MESSAGE_DURATION = 5;

export class Game {
  private input = new Input();
  private elapsed = 0;
  private width = window.innerWidth;
  private height = window.innerHeight;
  private viewportCols = 1;
  private viewportRows = 1;
  private cols = 1;
  private rows = 1;
  private surfaceRows = 1;
  private deepSurfaceRows = 1;
  private blocks: BlockCell[][] = [];
  private ladders: boolean[][] = [];
  private ropes: boolean[][] = [];
  private ladderCount = STARTING_LADDERS;
  private currency: Currency = { normal: 0, hard: 0, iron: 0, diamond: 0 };
  private pickaxeLevel: PickaxeLevel = 0;
  private hasPiercePickaxe = false;
  private hasSideBreak = false;
  private hasLamp = false;
  private hasExpandedLamp = false;
  private boostUnlocked = false;
  private boostActive = false;
  private boostTimeLeft = 0;
  private boostCooldownLeft = 0;
  private ropeCount = 0;
  private deepMole: Vec2 = { x: 0, y: 0 };
  private shops: ShopPositions = {
    ladder: { x: 2, y: 0 },
    pickaxe: { x: 3, y: 0 },
    deepPickaxe: null,
  };
  private deepShops: DeepShopPositions = {
    lamp: { x: 0, y: 0 },
    rope: { x: 0, y: 0 },
    pickaxe4: null,
  };
  private computer: Vec2 = { x: 0, y: 0 };
  private hiddenCodes: HiddenCode[] = [];
  private codeMap = new Map<string, HiddenCode>();
  private bookEntries: BookEntry[] = [];
  private usedCodes: string[] = [];
  private codeInput = "";
  private codeMessage: string | null = null;
  private codeMessageUntil = 0;
  private usingComputer = false;
  private secretTrails: SecretTrail[] = [];
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

  private get deepRegionStart(): number {
    return this.viewportRows;
  }

  private isSky(row: number): boolean {
    return isSkyAt(row, this.surfaceRows, this.deepRegionStart, this.deepSurfaceRows);
  }

  private initWorld(viewportCols: number, viewportRows: number, surfaceRows: number): void {
    const worldCols = getWorldCols(viewportCols);
    const worldRows = getWorldRows(viewportRows);
    const deepSurfaceRows = getDeepSurfaceRows(viewportRows);

    this.viewportCols = viewportCols;
    this.viewportRows = viewportRows;
    this.cols = worldCols;
    this.rows = worldRows;
    this.surfaceRows = surfaceRows;
    this.deepSurfaceRows = deepSurfaceRows;
    this.blocks = createSolidGrid(worldCols, worldRows, viewportCols, viewportRows, surfaceRows);
    this.ladders = createEmptyLadders(worldCols, worldRows);
    this.ropes = createEmptyRopes(worldCols, worldRows);
    this.ladderCount = STARTING_LADDERS;
    this.currency = { normal: 0, hard: 0, iron: 0, diamond: 0 };
    this.pickaxeLevel = 0;
    this.hasPiercePickaxe = false;
    this.hasSideBreak = false;
    this.hasLamp = false;
    this.hasExpandedLamp = false;
    this.boostUnlocked = false;
    this.boostActive = false;
    this.boostTimeLeft = 0;
    this.boostCooldownLeft = 0;
    this.ropeCount = 0;
    this.shops = createShopPositions(viewportCols, surfaceRows);
    this.computer = createComputerPosition(viewportCols, surfaceRows);
    const deepShop = createDeepPickaxeShop(worldCols, viewportRows, surfaceRows, viewportCols, [
      this.shops.ladder,
      this.shops.pickaxe,
      this.computer,
    ]);
    this.shops = { ...this.shops, deepPickaxe: deepShop };
    this.deepShops = createDeepShops(viewportCols, viewportRows, worldCols, worldRows);
    this.deepMole = getDeepMolePosition(viewportCols, viewportRows);
    this.hiddenCodes = createHiddenCodes(
      worldCols,
      worldRows,
      surfaceRows,
      viewportCols,
      viewportRows,
      [deepShop, this.deepShops.lamp, this.deepShops.rope, ...(this.deepShops.pickaxe4 ? [this.deepShops.pickaxe4] : [])],
    );
    this.bookEntries = [];
    this.usedCodes = [];
    this.codeInput = "";
    this.setCodeMessage(null);
    this.usingComputer = false;
    this.syncCodeMap();
    this.mole = createStartMole(viewportCols, surfaceRows);
    this.initHintTrails();
  }

  private setCodeMessage(message: string | null, duration = CODE_MESSAGE_DURATION): void {
    this.codeMessage = message;
    this.codeMessageUntil = message === null ? 0 : this.elapsed + duration;
  }

  private syncCodeMap(): void {
    const foundCells = new Set(this.bookEntries.map((entry) => codeKey(entry.col, entry.row)));
    this.codeMap = hiddenCodesToMap(
      this.hiddenCodes.filter((entry) => !foundCells.has(codeKey(entry.col, entry.row))),
    );
  }

  private isCodeCellFound(col: number, row: number): boolean {
    return this.bookEntries.some((entry) => entry.col === col && entry.row === row);
  }

  private collectSecretTargets(): Vec2[] {
    const targets: Vec2[] = [];
    for (const entry of this.hiddenCodes) {
      if (this.isCodeCellFound(entry.col, entry.row)) continue;
      if (isSolid(this.blocks, entry.col, entry.row)) {
        targets.push({ x: entry.col, y: entry.row });
      }
    }
    const ironShop = this.shops.deepPickaxe;
    if (ironShop && isSolid(this.blocks, ironShop.x, ironShop.y)) {
      targets.push({ x: ironShop.x, y: ironShop.y });
    }
    const pickaxe4 = this.deepShops.pickaxe4;
    if (pickaxe4 && isSolid(this.blocks, pickaxe4.x, pickaxe4.y)) {
      targets.push({ x: pickaxe4.x, y: pickaxe4.y });
    }
    return targets;
  }

  private initHintTrails(preserveProgress = false): void {
    const oldState = preserveProgress
      ? new Map(
          this.secretTrails.map((trail) => [
            trailTargetKey(trail.target),
            { progress: trail.progress, found: trail.found },
          ]),
        )
      : new Map<string, { progress: number; found: boolean }>();

    this.secretTrails = [];
    for (const target of this.collectSecretTargets()) {
      const path = buildHintTrail(this.blocks, target.x, target.y, this.cols, this.rows);
      if (path.length === 0) continue;
      const saved = oldState.get(trailTargetKey(target));
      const progress = Math.min(saved?.progress ?? 0, path.length - 1);
      this.secretTrails.push({
        target,
        path,
        progress,
        found: saved?.found ?? false,
      });
    }
  }

  private updateHintTrails(): void {
    this.secretTrails = this.secretTrails.filter((trail) =>
      isSolid(this.blocks, trail.target.x, trail.target.y),
    );

    const mole = { x: this.mole.col, y: this.mole.row };

    for (const trail of this.secretTrails) {
      if (!trail.found) {
        const start = trail.path[0];
        if (chebyshevDist(mole, start) <= HINT_FIND_RADIUS) {
          trail.found = true;
          this.setCodeMessage("Кажется, тут начинается какой-то путь…");
        }
        continue;
      }

      const step = trail.path[trail.progress];
      if (!isSolid(this.blocks, step.x, step.y)) {
        trail.progress = Math.min(trail.progress + 1, trail.path.length - 1);
        continue;
      }
      if (
        chebyshevDist(mole, step) <= HINT_ADVANCE_RADIUS &&
        trail.progress < trail.path.length - 1
      ) {
        trail.progress += 1;
      }
    }
  }

  private getActiveHintDot(): Vec2 | null {
    if (this.mole.row < this.surfaceRows) return null;

    let best: SecretTrail | null = null;
    let bestDist = Infinity;

    for (const trail of this.secretTrails) {
      if (!trail.found) continue;
      const step = trail.path[trail.progress];
      if (!isSolid(this.blocks, step.x, step.y)) continue;
      const dist = chebyshevDist({ x: this.mole.col, y: this.mole.row }, step);
      if (dist > HINT_ACTIVATE_RADIUS) continue;
      if (dist < bestDist) {
        bestDist = dist;
        best = trail;
      }
    }

    return best ? { ...best.path[best.progress] } : null;
  }

  private applyViewportSize(reset = false): void {
    const { viewportCols, viewportRows } = getViewportDimensions(this.width, this.height);
    const surfaceRows = getSurfaceRows(viewportRows);
    const worldCols = getWorldCols(viewportCols);
    const worldRows = getWorldRows(viewportRows);

    if (reset || this.blocks.length === 0) {
      this.initWorld(viewportCols, viewportRows, surfaceRows);
      return;
    }

    let deepShop = this.shops.deepPickaxe;
    const surfaceShops = createShopPositions(viewportCols, surfaceRows);
    const shopExclude = [
      surfaceShops.ladder,
      surfaceShops.pickaxe,
      createComputerPosition(viewportCols, surfaceRows),
    ];
    if (
      !deepShop ||
      !isIronUndergroundCell(deepShop.x, deepShop.y, viewportCols, surfaceRows)
    ) {
      deepShop = createDeepPickaxeShop(
        worldCols,
        viewportRows,
        surfaceRows,
        viewportCols,
        shopExclude,
      );
    }
    let pickaxe4Shop = this.deepShops.pickaxe4;
    if (
      pickaxe4Shop &&
      (pickaxe4Shop.x >= worldCols ||
        pickaxe4Shop.y >= worldRows ||
        pickaxe4Shop.x < 0 ||
        pickaxe4Shop.y < 0)
    ) {
      pickaxe4Shop = createDeepShops(viewportCols, viewportRows, worldCols, worldRows).pickaxe4;
    }
    this.blocks = resizeGrid(
      this.blocks,
      this.viewportCols,
      this.viewportRows,
      this.surfaceRows,
      viewportCols,
      viewportRows,
      surfaceRows,
    );
    this.ladders = resizeLadders(
      this.ladders,
      this.viewportCols,
      this.viewportRows,
      viewportCols,
      viewportRows,
    );
    this.ropes = resizeRopes(
      this.ropes,
      this.viewportCols,
      this.viewportRows,
      viewportCols,
      viewportRows,
    );
    this.hiddenCodes = resizeHiddenCodes(
      this.hiddenCodes,
      this.viewportCols,
      this.viewportRows,
      this.surfaceRows,
      viewportCols,
      viewportRows,
      surfaceRows,
      [deepShop, pickaxe4Shop].filter((s): s is Vec2 => s !== null),
    );
    this.syncCodeMap();
    this.viewportCols = viewportCols;
    this.viewportRows = viewportRows;
    this.cols = worldCols;
    this.rows = worldRows;
    this.surfaceRows = surfaceRows;
    this.deepSurfaceRows = getDeepSurfaceRows(viewportRows);
    this.shops = { ...createShopPositions(viewportCols, surfaceRows), deepPickaxe: deepShop };
    this.deepShops = {
      ...createDeepShops(viewportCols, viewportRows, worldCols, worldRows),
      pickaxe4: pickaxe4Shop,
    };
    this.computer = createComputerPosition(viewportCols, surfaceRows);
    this.deepMole = getDeepMolePosition(viewportCols, viewportRows);
    this.mole.col = Math.min(this.mole.col, worldCols - 1);
    this.mole.row = Math.min(this.mole.row, worldRows - 1);
    this.initHintTrails(true);
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
    this.tickBoost(dt);
    this.updateHintTrails();
    if (this.codeMessage && this.codeMessageUntil > 0 && this.elapsed >= this.codeMessageUntil) {
      this.setCodeMessage(null);
    }
    this.handleInput();
    this.applyGravity();
    this.emitState();
  }

  private tickBoost(dt: number): void {
    if (this.boostActive) {
      this.boostTimeLeft -= dt;
      if (this.boostTimeLeft <= 0) {
        this.boostActive = false;
        this.boostTimeLeft = 0;
        this.boostCooldownLeft = BOOST_COOLDOWN;
        this.setCodeMessage("Буст закончился — перезарядка");
      }
      return;
    }
    if (this.boostCooldownLeft > 0) {
      this.boostCooldownLeft = Math.max(0, this.boostCooldownLeft - dt);
    }
  }

  private activateBoost(): void {
    if (!this.boostUnlocked) return;
    if (this.boostActive) return;
    if (this.boostCooldownLeft > 0) return;
    this.boostActive = true;
    this.boostTimeLeft = BOOST_DURATION;
    this.setCodeMessage("Буст! Одно нажатие = два действия");
  }

  private actionRepeats(): number {
    return this.boostActive ? 2 : 1;
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

    if (this.input.isPressed("KeyB")) {
      this.activateBoost();
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
      } else if (
        this.mole.col === this.deepShops.lamp.x &&
        this.mole.row === this.deepShops.lamp.y
      ) {
        this.buyLamp();
      } else if (
        this.mole.col === this.deepShops.rope.x &&
        this.mole.row === this.deepShops.rope.y
      ) {
        this.buyRope();
      } else if (
        this.deepShops.pickaxe4 &&
        this.mole.col === this.deepShops.pickaxe4.x &&
        this.mole.row === this.deepShops.pickaxe4.y
      ) {
        this.buyPickaxe4();
      }
    }

    const placeAhead =
      this.input.isDown("ShiftLeft") ||
      this.input.isDown("ShiftRight") ||
      this.input.isDown("Shift");

    if (this.input.isPressed("KeyQ")) {
      for (let i = 0; i < this.actionRepeats(); i += 1) this.removeLadder();
    } else if (this.input.isPressed("KeyR")) {
      for (let i = 0; i < this.actionRepeats(); i += 1) {
        if (placeAhead) this.placeRopeAhead();
        else this.placeRope();
      }
    } else if (this.input.isPressed("KeyE")) {
      if (isComputerCell(this.mole.col, this.mole.row, this.computer)) {
        this.usingComputer = true;
        this.input.consumePressedChars();
        return;
      }
      if (placeAhead) {
        for (let i = 0; i < this.actionRepeats(); i += 1) this.placeLadderAhead();
      } else {
        for (let i = 0; i < this.actionRepeats(); i += 1) this.placeLadder();
      }
    } else if (this.input.isPressed("Space")) {
      if (placeAhead) {
        for (let i = 0; i < this.actionRepeats(); i += 1) this.placeLadderAhead();
      } else {
        for (let i = 0; i < this.actionRepeats(); i += 1) this.placeLadder();
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

      if (!keyCodes.some((code) => this.input.isPressed(code))) continue;
      for (let i = 0; i < this.actionRepeats(); i += 1) {
        this.move(direction);
      }
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
      this.setCodeMessage("Код должен быть из 6 букв", 8);
      return;
    }
    if (this.usedCodes.includes(this.codeInput)) {
      this.setCodeMessage("Этот код уже использован", 8);
      this.codeInput = "";
      return;
    }
    const match = this.hiddenCodes.find((entry) => entry.code === this.codeInput);
    if (!match) {
      this.setCodeMessage("Неверный код", 8);
      this.codeInput = "";
      return;
    }
    this.usedCodes.push(this.codeInput);
    if (match.type === "ladder") {
      this.ladderCount += LADDER_CODE_REWARD;
      this.setCodeMessage(`+${LADDER_CODE_REWARD} лестниц!`, 8);
    } else if (match.type === "pierce") {
      this.hasPiercePickaxe = true;
      this.setCodeMessage("Кирка пробивает 2 блока за удар!", 8);
    } else if (match.type === "sidebreak") {
      this.hasSideBreak = true;
      this.setCodeMessage("Удары ломают блоки по бокам!", 8);
    } else if (match.type === "lamp") {
      this.hasExpandedLamp = true;
      this.setCodeMessage("Радиус лампы увеличен!", 8);
    } else {
      this.boostUnlocked = true;
      this.setCodeMessage("Буст разблокирован! Нажми B чтобы активировать", 8);
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

  private buyLamp(): void {
    if (this.hasLamp) return;
    if (this.currency.hard < LAMP_COST) return;
    this.currency.hard -= LAMP_COST;
    this.hasLamp = true;
    this.setCodeMessage("Лампа освещает область вокруг крота!");
  }

  private buyRope(): void {
    if (this.currency.iron < ROPE_COST) return;
    this.currency.iron -= ROPE_COST;
    this.ropeCount += 1;
    this.setCodeMessage("Верёвка в инвентаре — нажми R в нужной колонке");
  }

  private placeRope(): void {
    this.placeRopeAt(this.mole.col);
  }

  private placeRopeAhead(): void {
    const delta = directionDelta(this.mole.facing);
    this.placeRopeAt(this.mole.col + delta.x);
  }

  private placeRopeAt(col: number): void {
    if (this.ropeCount <= 0) return;
    if (!isInsideGrid(col, this.mole.row, this.cols, this.rows)) return;
    if (hasRopeInColumn(this.ropes, col)) {
      this.setCodeMessage("В этой колонке уже есть верёвка");
      return;
    }
    for (let row = this.mole.row; row < this.rows; row += 1) {
      this.ropes[row][col] = true;
    }
    this.ropeCount -= 1;
    this.setCodeMessage("Верёвка установлена!");
  }

  private buyPickaxe4(): void {
    if (this.pickaxeLevel < 2) return;
    if (this.pickaxeLevel >= 3) return;
    if (this.currency.diamond < PICKAXE4_DIAMOND_COST) return;
    if (this.currency.iron < PICKAXE4_IRON_COST) return;
    this.currency.diamond -= PICKAXE4_DIAMOND_COST;
    this.currency.iron -= PICKAXE4_IRON_COST;
    this.pickaxeLevel = 3;
    this.setCodeMessage("Кирка 4 уровня — алмазы за 1 удар!");
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
    if (!this.isSky(row) && isSolid(this.blocks, col, row)) return;
    if (hasLadder(this.ladders, col, row)) return;
    if (isShopCell(col, row, this.shops)) return;
    if (isDeepShopCell(col, row, this.deepShops)) return;
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
    if (!this.isCodeCellFound(col, row)) {
      this.bookEntries.push({
        code: entry.code,
        label: codeTypeLabel(entry.type),
        type: entry.type,
        col,
        row,
      });
      this.setCodeMessage(`Код найден! Записан в книжку (${codeTypeLabel(entry.type)})`);
    }
    this.hiddenCodes = this.hiddenCodes.filter((hidden) => hidden.col !== col || hidden.row !== row);
    this.codeMap.delete(codeKey(col, row));
    this.secretTrails = this.secretTrails.filter(
      (trail) => trail.target.x !== col || trail.target.y !== row,
    );
  }

  private strikeBlock(
    col: number,
    row: number,
    direction?: Direction,
    allowSideBreak = true,
    allowPierce = true,
  ): boolean {
    const rawCell = getBlock(this.blocks, col, row);
    if (rawCell === 0) return true;
    const cell = strikeCellType(rawCell, row, this.deepRegionStart, this.deepSurfaceRows);

    if (isDiamondBlock(cell)) {
      const hitsLeft = diamondHitsRemaining(cell);
      const damage = diamondDamagePerHit(this.pickaxeLevel, hitsLeft);
      const newHitsLeft = hitsLeft - damage;
      if (newHitsLeft <= 0) {
        this.blocks[row][col] = 0;
        this.currency.diamond += 1;
        this.revealCodeIfAny(col, row);
        this.pierceNextBlock(col, row, direction, allowPierce);
        if (allowSideBreak) this.strikeSideBlocks(col, row, direction);
        return true;
      }
      this.blocks[row][col] = diamondCellFromHitsRemaining(newHitsLeft);
      return false;
    }

    if (isIronBlock(cell)) {
      const hitsLeft = ironHitsRemaining(cell);
      const damage = ironDamagePerHit(this.pickaxeLevel);
      const newHitsLeft = hitsLeft - damage;
      if (newHitsLeft <= 0) {
        this.blocks[row][col] = 0;
        this.currency.iron += 1;
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
    if (this.isSky(nextRow)) return;
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
      if (this.isSky(sideRow)) continue;
      if (!isSolid(this.blocks, sideCol, sideRow)) continue;
      this.strikeBlock(sideCol, sideRow, direction, false, false);
    }
  }

  private onRopeOrLadder(): boolean {
    return (
      hasLadder(this.ladders, this.mole.col, this.mole.row) ||
      hasRope(this.ropes, this.mole.col, this.mole.row)
    );
  }

  private move(direction: Direction): void {
    this.mole.facing = direction;
    const delta = directionDelta(direction);
    const targetCol = this.mole.col + delta.x;
    const targetRow = this.mole.row + delta.y;

    if (!isInsideGrid(targetCol, targetRow, this.cols, this.rows)) return;

    const targetSolid = !this.isSky(targetRow) && isSolid(this.blocks, targetCol, targetRow);
    const onClimb = this.onRopeOrLadder();

    if (direction === "up") {
      if (targetSolid) {
        if (!this.strikeBlock(targetCol, targetRow, direction)) return;
        this.setMolePosition(targetCol, targetRow);
        return;
      }
      if (!this.canClimbUp(onClimb, targetCol, targetRow)) return;
      this.setMolePosition(targetCol, targetRow);
      return;
    }

    if (direction === "down") {
      if (targetSolid) {
        if (!this.strikeBlock(targetCol, targetRow, direction)) return;
        this.setMolePosition(targetCol, targetRow);
        return;
      }
      if (!onClimb && !this.isSky(this.mole.row)) return;
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

  private canClimbUp(onClimb: boolean, targetCol: number, targetRow: number): boolean {
    if (this.isSky(this.mole.row) && this.isSky(targetRow)) return true;
    return (
      onClimb &&
      (hasLadder(this.ladders, targetCol, targetRow) || hasRope(this.ropes, targetCol, targetRow))
    );
  }

  private isStandingOnSpecial(): boolean {
    return (
      isShopCell(this.mole.col, this.mole.row, this.shops) ||
      isDeepShopCell(this.mole.col, this.mole.row, this.deepShops) ||
      isComputerCell(this.mole.col, this.mole.row, this.computer)
    );
  }

  private applyGravity(): void {
    if (this.usingComputer) return;
    if (this.onRopeOrLadder()) return;
    if (this.isStandingOnSpecial()) return;

    while (true) {
      const belowRow = this.mole.row + 1;
      if (!isInsideGrid(this.mole.col, belowRow, this.cols, this.rows)) break;
      if (isSolid(this.blocks, this.mole.col, belowRow)) break;

      const belowShop =
        isShopCell(this.mole.col, belowRow, this.shops) ||
        isDeepShopCell(this.mole.col, belowRow, this.deepShops) ||
        isComputerCell(this.mole.col, belowRow, this.computer);

      if (belowShop) {
        this.mole.row = belowRow;
        break;
      }

      this.mole.row = belowRow;
      if (this.onRopeOrLadder()) break;
    }
  }

  private getBuriedCodeInscriptions(): BuriedCodeInscription[] {
    const inscriptions: BuriedCodeInscription[] = [];
    for (const entry of this.codeMap.values()) {
      if (this.isCodeCellFound(entry.col, entry.row)) continue;
      if (!isSolid(this.blocks, entry.col, entry.row)) continue;
      inscriptions.push({ col: entry.col, row: entry.row, code: entry.code });
    }
    return inscriptions;
  }

  private emitState(): void {
    const deep = this.shops.deepPickaxe;
    const pickaxe4 = this.deepShops.pickaxe4;
    const cameraCol = getCameraCol(this.mole.col, this.viewportCols, this.cols);
    const cameraRow = getCameraRow(this.mole.row, this.viewportRows, this.rows);

    this.onStateChange?.({
      elapsed: this.elapsed,
      width: this.width,
      height: this.height,
      cellSize: CELL_SIZE,
      cols: this.cols,
      viewportCols: this.viewportCols,
      rows: this.rows,
      viewportRows: this.viewportRows,
      surfaceRows: this.surfaceRows,
      deepRegionStart: this.deepRegionStart,
      deepSurfaceRows: this.deepSurfaceRows,
      ironRegionStart: getIronRegionStart(this.viewportCols),
      cameraCol,
      cameraRow,
      worldOffset: getWorldOffset(
        this.width,
        this.viewportCols,
        cameraCol,
        this.viewportRows,
        cameraRow,
      ),
      blocks: this.blocks.map((row) => [...row]),
      ladders: this.ladders.map((row) => [...row]),
      ropes: this.ropes.map((row) => [...row]),
      mole: { ...this.mole },
      currency: { ...this.currency },
      ladderCount: this.ladderCount,
      pickaxeLevel: this.pickaxeLevel,
      hasPiercePickaxe: this.hasPiercePickaxe,
      hasSideBreak: this.hasSideBreak,
      hasLamp: this.hasLamp,
      hasExpandedLamp: this.hasExpandedLamp,
      boostUnlocked: this.boostUnlocked,
      boostActive: this.boostActive,
      boostTimeLeft: this.boostTimeLeft,
      boostCooldownLeft: this.boostCooldownLeft,
      ropeCount: this.ropeCount,
      inDeepRegion: isDeepRegionRow(this.mole.row, this.deepRegionStart),
      deepMole: { ...this.deepMole },
      shops: {
        ladder: { ...this.shops.ladder },
        pickaxe: { ...this.shops.pickaxe },
        deepPickaxe: deep ? { ...deep } : null,
      },
      deepShops: {
        lamp: { ...this.deepShops.lamp },
        rope: { ...this.deepShops.rope },
        pickaxe4: pickaxe4 ? { ...pickaxe4 } : null,
      },
      computer: { ...this.computer },
      atLadderShop:
        this.mole.col === this.shops.ladder.x && this.mole.row === this.shops.ladder.y,
      atPickaxeShop:
        this.mole.col === this.shops.pickaxe.x && this.mole.row === this.shops.pickaxe.y,
      atDeepPickaxeShop: deep
        ? this.mole.col === deep.x && this.mole.row === deep.y
        : false,
      atLampShop:
        this.mole.col === this.deepShops.lamp.x && this.mole.row === this.deepShops.lamp.y,
      atRopeShop:
        this.mole.col === this.deepShops.rope.x && this.mole.row === this.deepShops.rope.y,
      atDeepPickaxe4Shop: pickaxe4
        ? this.mole.col === pickaxe4.x && this.mole.row === pickaxe4.y
        : false,
      atComputer: isComputerCell(this.mole.col, this.mole.row, this.computer),
      usingComputer: this.usingComputer,
      codeInput: this.codeInput,
      codeMessage: this.codeMessage,
      bookEntries: Array.isArray(this.bookEntries) ? [...this.bookEntries] : [],
      buriedCodeInscriptions: this.getBuriedCodeInscriptions(),
      hintDot: this.getActiveHintDot(),
    });
  }
}

export function createInitialGameState(): GameState {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const { viewportCols, viewportRows } = getViewportDimensions(width, height);
  const surfaceRows = getSurfaceRows(viewportRows);
  const worldCols = getWorldCols(viewportCols);
  const worldRows = getWorldRows(viewportRows);
  const deepSurfaceRows = getDeepSurfaceRows(viewportRows);
  const deepRegionStart = viewportRows;
  const blocks = createSolidGrid(worldCols, worldRows, viewportCols, viewportRows, surfaceRows);
  const ladders = createEmptyLadders(worldCols, worldRows);
  const ropes = createEmptyRopes(worldCols, worldRows);
  const mole = createStartMole(viewportCols, surfaceRows);
  const shops = createShopPositions(viewportCols, surfaceRows);
  const computer = createComputerPosition(viewportCols, surfaceRows);
  const deepPickaxe = createDeepPickaxeShop(worldCols, viewportRows, surfaceRows, viewportCols, [
    shops.ladder,
    shops.pickaxe,
    computer,
  ]);
  const deepShops = createDeepShops(viewportCols, viewportRows, worldCols, worldRows);
  const hiddenCodes = createHiddenCodes(
    worldCols,
    worldRows,
    surfaceRows,
    viewportCols,
    viewportRows,
    [deepPickaxe, deepShops.lamp, deepShops.rope, ...(deepShops.pickaxe4 ? [deepShops.pickaxe4] : [])],
  );
  const deepMole = getDeepMolePosition(viewportCols, viewportRows);
  const cameraCol = getCameraCol(mole.col, viewportCols, worldCols);
  const cameraRow = getCameraRow(mole.row, viewportRows, worldRows);

  return {
    elapsed: 0,
    width,
    height,
    cellSize: CELL_SIZE,
    cols: worldCols,
    viewportCols,
    rows: worldRows,
    viewportRows,
    surfaceRows,
    deepRegionStart,
    deepSurfaceRows,
    ironRegionStart: getIronRegionStart(viewportCols),
    cameraCol,
    cameraRow,
    worldOffset: getWorldOffset(width, viewportCols, cameraCol, viewportRows, cameraRow),
    blocks,
    ladders,
    ropes,
    mole,
    currency: { normal: 0, hard: 0, iron: 0, diamond: 0 },
    ladderCount: STARTING_LADDERS,
    pickaxeLevel: 0,
    hasPiercePickaxe: false,
    hasSideBreak: false,
    hasLamp: false,
    hasExpandedLamp: false,
    boostUnlocked: false,
    boostActive: false,
    boostTimeLeft: 0,
    boostCooldownLeft: 0,
    ropeCount: 0,
    inDeepRegion: false,
    deepMole,
    shops: { ...shops, deepPickaxe },
    deepShops,
    computer,
    atLadderShop: false,
    atPickaxeShop: false,
    atDeepPickaxeShop: false,
    atLampShop: false,
    atRopeShop: false,
    atDeepPickaxe4Shop: false,
    atComputer: false,
    usingComputer: false,
    codeInput: "",
    codeMessage: null,
    bookEntries: [],
    buriedCodeInscriptions: hiddenCodes.map((entry) => ({
      col: entry.col,
      row: entry.row,
      code: entry.code,
    })),
    hintDot: null,
  };
}
