export class Input {
  private keys = new Set<string>();
  private justPressed = new Set<string>();
  private pressedChars: string[] = [];
  private readonly onKeyDown: (e: KeyboardEvent) => void;
  private readonly onKeyUp: (e: KeyboardEvent) => void;
  private readonly onVisibilityChange: () => void;

  constructor() {
    this.onKeyDown = (e) => {
      if (this.isGameKey(e.code)) {
        e.preventDefault();
      }

      if (!this.keys.has(e.code)) {
        this.justPressed.add(e.code);
      }
      this.keys.add(e.code);

      // Physical key (KeyA…KeyZ) — layout-independent Latin letters.
      if (e.code.length === 4 && e.code.startsWith("Key")) {
        const letter = e.code.slice(3);
        if (letter >= "A" && letter <= "Z") {
          this.pressedChars.push(letter);
        }
      }
    };

    this.onKeyUp = (e) => {
      this.keys.delete(e.code);
    };

    this.onVisibilityChange = () => {
      if (document.hidden) {
        this.clear();
      }
    };

    document.addEventListener("keydown", this.onKeyDown, true);
    document.addEventListener("keyup", this.onKeyUp, true);
    document.addEventListener("visibilitychange", this.onVisibilityChange);
  }

  destroy(): void {
    document.removeEventListener("keydown", this.onKeyDown, true);
    document.removeEventListener("keyup", this.onKeyUp, true);
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    this.clear();
  }

  private clear(): void {
    this.keys.clear();
    this.justPressed.clear();
    this.pressedChars = [];
  }

  private isGameKey(code: string): boolean {
    if (code.startsWith("Arrow") || code.startsWith("Key")) return true;
    return (
      code === "Space" ||
      code === "ShiftLeft" ||
      code === "ShiftRight" ||
      code === "Escape" ||
      code === "Enter" ||
      code === "NumpadEnter" ||
      code === "Backspace"
    );
  }

  consumePressedChars(): string[] {
    const chars = [...this.pressedChars];
    this.pressedChars = [];
    return chars;
  }

  isDown(code: string): boolean {
    return this.keys.has(code);
  }

  isPressed(code: string): boolean {
    if (!this.justPressed.has(code)) return false;
    this.justPressed.delete(code);
    return true;
  }
}
