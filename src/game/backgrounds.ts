/**
 * Golden Axe Stage Background & Full-Screen Magic Spell Renderer
 * Features parallax scrolling, animated ocean/clouds, torchlight, and iconic magic summons.
 */

import { StageConfig, MagicCastEffect } from "../types/game";

export class BackgroundRenderer {
  public static render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    cameraX: number,
    stage: StageConfig,
    inBonusCamp: boolean,
    tick: number
  ) {
    if (inBonusCamp) {
      this.renderCampfire(ctx, width, height, cameraX, tick);
      return;
    }

    switch (stage.backgroundTheme) {
      case "turtle":
        this.renderTurtleVillage(ctx, width, height, cameraX, tick);
        break;
      case "eagle":
        this.renderGreatEagle(ctx, width, height, cameraX, tick);
        break;
      case "castle":
      case "throne":
        this.renderCastleFortress(ctx, width, height, cameraX, tick);
        break;
      case "forest":
      default:
        this.renderWoodland(ctx, width, height, cameraX, tick);
        break;
    }
  }

  // --- STAGE 1: WOODLAND OUTSKIRTS ---
  private static renderWoodland(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    cameraX: number,
    tick: number
  ) {
    // 1. Dusk Sky Gradient
    const sky = ctx.createLinearGradient(0, 0, 0, 200);
    sky.addColorStop(0, "#7c2d12"); // Deep amber dusk
    sky.addColorStop(0.5, "#c2410c");
    sky.addColorStop(1, "#fb923c");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, 220);

    // 2. Distant Mountains (Parallax 0.1)
    ctx.fillStyle = "#431407";
    ctx.beginPath();
    ctx.moveTo(0, 200);
    for (let x = 0; x <= width; x += 60) {
      const px = x + (cameraX * 0.1) % 60;
      const h = 50 + Math.sin(px * 0.015) * 35;
      ctx.lineTo(x, 200 - h);
    }
    ctx.lineTo(width, 200);
    ctx.closePath();
    ctx.fill();

    // 3. Ancient Ruined Pillars & Arches (Parallax 0.3)
    ctx.fillStyle = "#78716c";
    for (let i = 0; i < 6; i++) {
      const pillarX = (i * 350 - cameraX * 0.35) % (width + 300);
      if (pillarX > -80 && pillarX < width + 80) {
        // Ruined column
        ctx.fillRect(pillarX, 70, 28, 140);
        // Capital & base
        ctx.fillRect(pillarX - 6, 64, 40, 8);
        ctx.fillRect(pillarX - 4, 195, 36, 15);
      }
    }

    // 4. Parallax Pine Trees (Parallax 0.5)
    ctx.fillStyle = "#14532d";
    for (let i = 0; i < 15; i++) {
      const treeX = (i * 120 - cameraX * 0.5) % (width + 150);
      if (treeX > -60 && treeX < width + 60) {
        ctx.beginPath();
        ctx.moveTo(treeX, 220);
        ctx.lineTo(treeX + 35, 110);
        ctx.lineTo(treeX + 70, 220);
        ctx.closePath();
        ctx.fill();
      }
    }

    // 5. Playable Dirt Road & Earth Floor
    const ground = ctx.createLinearGradient(0, 220, 0, height);
    ground.addColorStop(0, "#78350f"); // Warm forest dirt
    ground.addColorStop(0.3, "#92400e");
    ground.addColorStop(1, "#451a03");
    ctx.fillStyle = ground;
    ctx.fillRect(0, 220, width, height - 220);

    // Dirt textures & grass tufts
    ctx.fillStyle = "#15803d";
    for (let i = 0; i < 30; i++) {
      const gx = (i * 95 - cameraX) % (width + 100);
      if (gx > -20 && gx < width + 20) {
        const gy = 222 + (i % 6) * 32;
        ctx.fillRect(gx, gy, 8, 3);
        ctx.fillRect(gx + 3, gy - 3, 3, 3);
      }
    }

    // Torch braziers along path
    this.renderBraziers(ctx, width, cameraX, tick, [200, 700, 1300, 1900, 2400]);
  }

  // --- STAGE 2: TURTLE VILLAGE ---
  private static renderTurtleVillage(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    cameraX: number,
    tick: number
  ) {
    // 1. Ocean Sky
    const sky = ctx.createLinearGradient(0, 0, 0, 180);
    sky.addColorStop(0, "#1e3a8a");
    sky.addColorStop(1, "#38bdf8");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, 180);

    // 2. Rolling Ocean Waves (Parallax 0.2)
    ctx.fillStyle = "#0284c7";
    ctx.fillRect(0, 180, width, 50);
    ctx.fillStyle = "#bae6fd";
    for (let x = 0; x < width; x += 40) {
      const waveX = (x - cameraX * 0.2 + tick * 1.5) % width;
      ctx.fillRect(waveX, 190 + Math.sin(tick * 0.1 + x * 0.05) * 5, 25, 4);
    }

    // 3. Colossal Turtle Shell Scutes (The floor!)
    const shell = ctx.createLinearGradient(0, 230, 0, height);
    shell.addColorStop(0, "#1c1917"); // Dark ancient shell plates
    shell.addColorStop(0.5, "#292524");
    shell.addColorStop(1, "#0c0a09");
    ctx.fillStyle = shell;
    ctx.fillRect(0, 230, width, height - 230);

    // Turtle Shell Hexagonal Grooves
    ctx.strokeStyle = "#44403c";
    ctx.lineWidth = 3;
    for (let row = 0; row < 5; row++) {
      const y = 240 + row * 40;
      ctx.beginPath();
      for (let x = -50; x < width + 50; x += 70) {
        const sx = x - (cameraX % 70);
        ctx.moveTo(sx, y);
        ctx.lineTo(sx + 35, y + 20);
        ctx.lineTo(sx + 70, y);
      }
      ctx.stroke();
    }

    // Thatched huts & barrels on the turtle shell
    ctx.fillStyle = "#854d0e";
    for (let i = 0; i < 5; i++) {
      const hx = (i * 500 - cameraX * 0.8) % (width + 400);
      if (hx > -100 && hx < width + 100) {
        // Hut roof
        ctx.beginPath();
        ctx.moveTo(hx, 230);
        ctx.lineTo(hx + 45, 140);
        ctx.lineTo(hx + 90, 230);
        ctx.closePath();
        ctx.fill();
        // Barrel
        ctx.fillStyle = "#78350f";
        ctx.fillRect(hx + 110, 220, 16, 22);
      }
    }
  }

  // --- STAGE 3: ACROSS THE SEA ON THE GREAT EAGLE ---
  private static renderGreatEagle(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    cameraX: number,
    tick: number
  ) {
    // 1. High Altitude Dawn Sky
    const sky = ctx.createLinearGradient(0, 0, 0, 200);
    sky.addColorStop(0, "#4c1d95"); // Violet stratosphere
    sky.addColorStop(0.6, "#be185d");
    sky.addColorStop(1, "#f59e0b");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, 220);

    // 2. High Altitude Drifting Clouds (Fast parallax)
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    for (let i = 0; i < 8; i++) {
      const cx = (i * 220 - cameraX * 0.3 - tick * 2.5) % (width + 300);
      const cy = 60 + (i % 3) * 45;
      ctx.beginPath();
      ctx.arc(cx, cy, 35, 0, Math.PI * 2);
      ctx.arc(cx + 30, cy - 10, 45, 0, Math.PI * 2);
      ctx.arc(cx + 65, cy, 30, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Great Eagle Feathered Back (Floor)
    const feathers = ctx.createLinearGradient(0, 220, 0, height);
    feathers.addColorStop(0, "#713f12"); // Golden brown eagle plumage
    feathers.addColorStop(0.4, "#854d0e");
    feathers.addColorStop(1, "#3f2305");
    ctx.fillStyle = feathers;
    ctx.fillRect(0, 220, width, height - 220);

    // Feather overlapping pattern
    ctx.fillStyle = "#a16207";
    for (let row = 0; row < 6; row++) {
      const fy = 230 + row * 35;
      for (let x = -40; x < width + 40; x += 55) {
        const fx = x - (cameraX % 55) + (row % 2 === 0 ? 25 : 0);
        ctx.beginPath();
        ctx.ellipse(fx, fy, 24, 14, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Giant Eagle Wing in background
    ctx.strokeStyle = "#451a03";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(0, 210 + Math.sin(tick * 0.08) * 15);
    ctx.quadraticCurveTo(width * 0.5, 150 + Math.sin(tick * 0.08) * 20, width, 210);
    ctx.stroke();
  }

  // --- STAGE 4: CASTLE FORTRESS ---
  private static renderCastleFortress(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    cameraX: number,
    tick: number
  ) {
    // 1. Dark Apocalyptic Sky with blood moon
    const sky = ctx.createLinearGradient(0, 0, 0, 200);
    sky.addColorStop(0, "#09090b");
    sky.addColorStop(1, "#450a0a"); // Blood red castle mist
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, 220);

    // Blood Moon
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.arc(width - 120, 75, 42, 0, Math.PI * 2);
    ctx.fill();

    // 2. Stone Castle Ramparts & Towers
    ctx.fillStyle = "#18181b";
    for (let i = 0; i < 7; i++) {
      const tx = (i * 240 - cameraX * 0.4) % (width + 260);
      if (tx > -100 && tx < width + 100) {
        // Tower
        ctx.fillRect(tx, 60, 70, 160);
        // Battlement crenellations
        ctx.fillRect(tx - 6, 50, 82, 14);
        ctx.clearRect(tx + 12, 50, 14, 8);
        ctx.clearRect(tx + 44, 50, 14, 8);
      }
    }

    // 3. Polished Obsidian / Stone Flagstone Floor
    const stoneFloor = ctx.createLinearGradient(0, 220, 0, height);
    stoneFloor.addColorStop(0, "#27272a");
    stoneFloor.addColorStop(0.5, "#18181b");
    stoneFloor.addColorStop(1, "#09090b");
    ctx.fillStyle = stoneFloor;
    ctx.fillRect(0, 220, width, height - 220);

    // Flagstone grid
    ctx.strokeStyle = "#3f3f46";
    ctx.lineWidth = 2;
    for (let row = 0; row < 6; row++) {
      const y = 230 + row * 38;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      for (let x = -80; x < width + 80; x += 90) {
        const fx = x - (cameraX % 90) + (row % 2 === 0 ? 45 : 0);
        ctx.beginPath();
        ctx.moveTo(fx, y);
        ctx.lineTo(fx, y + 38);
        ctx.stroke();
      }
    }

    // Braziers
    this.renderBraziers(ctx, width, cameraX, tick, [150, 600, 1100, 1650, 2200, 2750]);
  }

  // --- CAMPFIRE BONUS STAGE ---
  private static renderCampfire(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    _cameraX: number,
    tick: number
  ) {
    // Midnight Sky with stars
    ctx.fillStyle = "#09090b";
    ctx.fillRect(0, 0, width, height);

    // Stars
    ctx.fillStyle = "#fef08a";
    for (let i = 0; i < 40; i++) {
      const sx = (i * 97) % width;
      const sy = (i * 53) % 200;
      if (Math.sin(tick * 0.05 + i) > 0) {
        ctx.fillRect(sx, sy, 2, 2);
      }
    }

    // Camp Ground
    ctx.fillStyle = "#44403c";
    ctx.fillRect(0, 240, width, height - 240);

    // Center Campfire
    const cx = width / 2;
    const cy = 300;

    // Glowing circle on ground
    const fireLight = ctx.createRadialGradient(cx, cy, 10, cx, cy, 140);
    fireLight.addColorStop(0, "rgba(249, 115, 22, 0.5)");
    fireLight.addColorStop(1, "rgba(249, 115, 22, 0)");
    ctx.fillStyle = fireLight;
    ctx.beginPath();
    ctx.arc(cx, cy, 140, 0, Math.PI * 2);
    ctx.fill();

    // Firewood logs
    ctx.fillStyle = "#78350f";
    ctx.fillRect(cx - 24, cy + 4, 48, 8);
    ctx.fillRect(cx - 20, cy, 40, 8);

    // Animated pixel fire flames
    const flameHeight = 28 + Math.sin(tick * 0.4) * 8;
    ctx.fillStyle = "#ea580c";
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy + 6);
    ctx.lineTo(cx, cy - flameHeight);
    ctx.lineTo(cx + 18, cy + 6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy + 4);
    ctx.lineTo(cx, cy - flameHeight * 0.7);
    ctx.lineTo(cx + 10, cy + 4);
    ctx.closePath();
    ctx.fill();
  }

  // Helper: Animated Torch Braziers
  private static renderBraziers(
    ctx: CanvasRenderingContext2D,
    width: number,
    cameraX: number,
    tick: number,
    positions: number[]
  ) {
    for (const bx of positions) {
      const screenX = bx - cameraX;
      if (screenX >= -40 && screenX <= width + 40) {
        // Iron stand
        ctx.fillStyle = "#3f3f46";
        ctx.fillRect(screenX - 3, 205, 6, 25);
        ctx.fillRect(screenX - 8, 200, 16, 6);

        // Flame light halo
        const halo = ctx.createRadialGradient(screenX, 195, 4, screenX, 195, 45);
        halo.addColorStop(0, "rgba(249, 115, 22, 0.4)");
        halo.addColorStop(1, "rgba(249, 115, 22, 0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(screenX, 195, 45, 0, Math.PI * 2);
        ctx.fill();

        // Dancing flame
        const flameH = 12 + Math.sin(tick * 0.3 + bx) * 4;
        ctx.fillStyle = "#f97316";
        ctx.beginPath();
        ctx.moveTo(screenX - 6, 200);
        ctx.lineTo(screenX, 200 - flameH);
        ctx.lineTo(screenX + 6, 200);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#fef08a";
        ctx.fillRect(screenX - 2, 198 - flameH * 0.5, 4, 5);
      }
    }
  }

  // --- FULL-SCREEN MAGIC SPELL EFFECTS ---
  public static renderMagicOverlay(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    magic: MagicCastEffect,
    tick: number
  ) {
    if (!magic.active) return;
    const progress = magic.timer / magic.maxTimer;

    ctx.save();

    if (magic.heroId === "ax") {
      // EARTH MAGIC: Volcanic eruptions & falling giant boulders
      ctx.fillStyle = `rgba(180, 83, 9, ${0.4 * (1 - Math.abs(progress - 0.5) * 2)})`;
      ctx.fillRect(0, 0, width, height);

      // Fissures across ground
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 4;
      for (let i = 0; i < 5; i++) {
        const fx = i * 160 + Math.sin(tick * 0.2) * 20;
        ctx.beginPath();
        ctx.moveTo(fx, 240);
        ctx.lineTo(fx + 30, 310);
        ctx.lineTo(fx - 20, 390);
        ctx.stroke();
      }

      // Falling and erupting boulders
      for (let i = 0; i < 10; i++) {
        const bx = (i * 90 + tick * 8) % width;
        const by = 80 + Math.sin(progress * Math.PI) * 240 + (i % 3) * 20;
        ctx.fillStyle = "#78716c";
        ctx.beginPath();
        ctx.arc(bx, by, 18 + (i % 4) * 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f59e0b"; // Lava glow
        ctx.fillRect(bx - 6, by - 6, 12, 12);
      }
    } else if (magic.heroId === "tyris") {
      // FIRE MAGIC: Searing red screen, gigantic Fire Dragon head rising!
      ctx.fillStyle = `rgba(220, 38, 38, ${0.5 * (1 - Math.abs(progress - 0.5) * 1.8)})`;
      ctx.fillRect(0, 0, width, height);

      // Searing flame wall at bottom
      ctx.fillStyle = "#f97316";
      for (let x = 0; x < width; x += 25) {
        const fh = 40 + Math.sin(tick * 0.4 + x) * 25;
        ctx.fillRect(x, height - fh, 22, fh);
      }

      // Colossal Fire Dragon Head sweeping across screen!
      const dragonProgress = Math.min(1, progress * 1.6);
      const dragonX = -120 + dragonProgress * (width + 240);
      const dragonY = 160 + Math.sin(tick * 0.2) * 15;

      // Draw Giant Dragon Head
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.ellipse(dragonX, dragonY, 80, 50, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Dragon Horns
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.moveTo(dragonX - 30, dragonY - 35);
      ctx.lineTo(dragonX - 70, dragonY - 80);
      ctx.lineTo(dragonX - 10, dragonY - 45);
      ctx.closePath();
      ctx.fill();

      // Roaring Fiery Maw
      ctx.fillStyle = "#450a0a";
      ctx.beginPath();
      ctx.arc(dragonX + 50, dragonY + 10, 30, 0, Math.PI);
      ctx.fill();

      // Roaring Screen-Incinerating Fire Stream from Maw
      const fireStream = ctx.createLinearGradient(dragonX + 70, dragonY + 10, width, dragonY + 10);
      fireStream.addColorStop(0, "rgba(254, 240, 138, 0.95)");
      fireStream.addColorStop(0.4, "rgba(249, 115, 22, 0.85)");
      fireStream.addColorStop(1, "rgba(220, 38, 38, 0)");
      ctx.fillStyle = fireStream;
      ctx.beginPath();
      ctx.moveTo(dragonX + 70, dragonY - 15);
      ctx.lineTo(width, 40);
      ctx.lineTo(width, height - 30);
      ctx.lineTo(dragonX + 70, dragonY + 35);
      ctx.closePath();
      ctx.fill();
    } else {
      // LIGHTNING MAGIC: Gilius Thunderhead thunderstorm & cyan lightning bolts
      ctx.fillStyle = `rgba(15, 23, 42, ${0.7 * (1 - Math.abs(progress - 0.5) * 1.5)})`;
      ctx.fillRect(0, 0, width, height);

      // Flashing storm clouds
      if (Math.floor(tick * 0.8) % 2 === 0) {
        ctx.fillStyle = "rgba(147, 197, 253, 0.25)";
        ctx.fillRect(0, 0, width, 120);
      }

      // Jagged Lightning Bolts striking targets
      for (let bolt = 0; bolt < 4 + magic.level * 2; bolt++) {
        const lx = (bolt * 125 + (tick * 23) % 150) % width;
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 3 + (bolt % 2) * 2;
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        let currY = 0;
        let currX = lx;
        while (currY < height) {
          currY += 35 + Math.random() * 20;
          currX += (Math.random() - 0.5) * 50;
          ctx.lineTo(currX, currY);
        }
        ctx.stroke();

        // White core
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}
