export interface GameState {
  elapsed: number;
  width: number;
  height: number;
}

export class Game {
  private elapsed = 0;
  private width = window.innerWidth;
  private height = window.innerHeight;
  private lastTime = 0;
  private running = false;
  private readonly onResize = (): void => {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.emitState();
  };

  constructor(private onStateChange?: (state: GameState) => void) {
    window.addEventListener("resize", this.onResize);
    this.emitState();
  }

  start(): void {
    this.running = true;
    requestAnimationFrame((time) => this.loop(time));
  }

  stop(): void {
    this.running = false;
    window.removeEventListener("resize", this.onResize);
  }

  restart(): void {
    this.elapsed = 0;
    this.lastTime = 0;
    this.emitState();
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
    this.emitState();
  }

  private emitState(): void {
    this.onStateChange?.({
      elapsed: this.elapsed,
      width: this.width,
      height: this.height,
    });
  }
}

export function createInitialGameState(): GameState {
  return {
    elapsed: 0,
    width: window.innerWidth,
    height: window.innerHeight,
  };
}
