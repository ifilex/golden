/**
 * Golden Axe Arcade Input Manager
 * Handles Keyboard (P1 & P2), HTML5 Gamepad API (P1 & P2), and Virtual Touch Joystick.
 */

export interface PlayerInputState {
  dx: number;
  dy: number;
  attack: boolean;
  jump: boolean;
  magic: boolean;
  dash: boolean;
}

export class InputManager {
  private keysPressed: Set<string> = new Set();
  private prevKeysPressed: Set<string> = new Set();

  // Virtual touch input state (for mobile / tablet)
  public virtualTouch: PlayerInputState = {
    dx: 0,
    dy: 0,
    attack: false,
    jump: false,
    magic: false,
    dash: false,
  };

  private prevGamepadButtonsP1: boolean[] = [];
  private prevGamepadButtonsP2: boolean[] = [];

  constructor() {
    this.setupListeners();
  }

  private setupListeners() {
    window.addEventListener("keydown", (e) => {
      // Prevent scrolling when pressing arrow keys or space in arcade
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
        e.preventDefault();
      }
      this.keysPressed.add(e.code);
    });

    window.addEventListener("keyup", (e) => {
      this.keysPressed.delete(e.code);
    });
  }

  public update() {
    this.prevKeysPressed = new Set(this.keysPressed);
  }

  public getPlayerInputs(playerIndex: 1 | 2): PlayerInputState {
    const isP1 = playerIndex === 1;

    // Start with zero
    let dx = 0;
    let dy = 0;
    let attack = false;
    let jump = false;
    let magic = false;
    let dash = false;

    // --- 1. Keyboard Controls ---
    if (isP1) {
      // P1: WASD + J (Attack) + K (Jump) + L (Magic) + Shift (Dash)
      if (this.keysPressed.has("KeyA")) dx -= 1;
      if (this.keysPressed.has("KeyD")) dx += 1;
      if (this.keysPressed.has("KeyW")) dy -= 1;
      if (this.keysPressed.has("KeyS")) dy += 1;

      attack = this.keysPressed.has("KeyJ");
      jump = this.keysPressed.has("KeyK") || this.keysPressed.has("Space");
      magic = this.keysPressed.has("KeyL");
      dash = this.keysPressed.has("ShiftLeft");

      // Merge Touch Joystick if P1
      if (this.virtualTouch.dx !== 0 || this.virtualTouch.dy !== 0) {
        dx = this.virtualTouch.dx;
        dy = this.virtualTouch.dy;
      }
      if (this.virtualTouch.attack) attack = true;
      if (this.virtualTouch.jump) jump = true;
      if (this.virtualTouch.magic) magic = true;
      if (this.virtualTouch.dash) dash = true;
    } else {
      // P2: Arrows + U/Num1 (Attack) + I/Num2 (Jump) + O/Num3 (Magic) + Enter/Num0 (Dash)
      if (this.keysPressed.has("ArrowLeft")) dx -= 1;
      if (this.keysPressed.has("ArrowRight")) dx += 1;
      if (this.keysPressed.has("ArrowUp")) dy -= 1;
      if (this.keysPressed.has("ArrowDown")) dy += 1;

      attack = this.keysPressed.has("KeyU") || this.keysPressed.has("Numpad1") || this.keysPressed.has("Digit1");
      jump = this.keysPressed.has("KeyI") || this.keysPressed.has("Numpad2") || this.keysPressed.has("Digit2");
      magic = this.keysPressed.has("KeyO") || this.keysPressed.has("Numpad3") || this.keysPressed.has("Digit3");
      dash = this.keysPressed.has("ShiftRight") || this.keysPressed.has("Numpad0");
    }

    // --- 2. HTML5 Gamepad API Support ---
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const padIdx = isP1 ? 0 : 1;
    const pad = gamepads[padIdx];

    if (pad && pad.connected) {
      // Analog Stick / D-Pad
      const axisX = pad.axes[0] || 0;
      const axisY = pad.axes[1] || 0;
      const deadzone = 0.25;

      if (Math.abs(axisX) > deadzone) dx = axisX;
      if (Math.abs(axisY) > deadzone) dy = axisY;

      // D-Pad buttons
      if (pad.buttons[14]?.pressed) dx = -1;
      if (pad.buttons[15]?.pressed) dx = 1;
      if (pad.buttons[12]?.pressed) dy = -1;
      if (pad.buttons[13]?.pressed) dy = 1;

      // Standard Gamepad mapping:
      // Button 0 (A/Cross) -> Attack
      // Button 1 (B/Circle) or Button 2 (X/Square) -> Jump
      // Button 3 (Y/Triangle) -> Magic
      // Button 5 (RB / R1) or Button 7 (RT / R2) -> Dash
      if (pad.buttons[0]?.pressed) attack = true;
      if (pad.buttons[1]?.pressed || pad.buttons[2]?.pressed) jump = true;
      if (pad.buttons[3]?.pressed) magic = true;
      if (pad.buttons[5]?.pressed || pad.buttons[7]?.pressed) dash = true;
    }

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      const len = Math.hypot(dx, dy);
      dx = (dx / len);
      dy = (dy / len);
    }

    return { dx, dy, attack, jump, magic, dash };
  }
}

export const inputManager = new InputManager();
