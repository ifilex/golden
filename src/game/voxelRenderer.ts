/**
 * Golden Axe - 3D Minecraft Voxel Engine (2.5D Oblique Canvas Projection)
 * Transforms Golden Axe characters, enemies, bosses, beasts, gnomes, and items
 * into high-fidelity 3D voxel models with shaded volumetric blocks, articulated
 * joint animation, and retro arcade aesthetic.
 */

import { Entity, HeroId, EnemyType, MountType } from "../types/game";

// Color shading helpers
function parseHex(hex: string): [number, number, number] {
  let c = hex.replace("#", "");
  if (c.length === 3) {
    c = c.split("").map((ch) => ch + ch).join("");
  }
  const num = parseInt(c, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function adjustColor(hex: string, factor: number): string {
  try {
    const [r, g, b] = parseHex(hex);
    const nr = Math.min(255, Math.max(0, Math.round(r * factor)));
    const ng = Math.min(255, Math.max(0, Math.round(g * factor)));
    const nb = Math.min(255, Math.max(0, Math.round(b * factor)));
    return `rgb(${nr}, ${ng}, ${nb})`;
  } catch {
    return hex;
  }
}

export interface VoxelBox {
  x: number; // local X offset (horizontal across character)
  y: number; // local Y offset (depth forward/backward)
  z: number; // local Z offset (vertical upwards from ground)
  w: number; // width along X
  d: number; // depth along Y
  h: number; // height along Z
  color: string;
  rx?: number; // rotation around X (radians)
  ry?: number; // rotation around Y (radians)
  rz?: number; // rotation around Z (radians)
}

export class VoxelRenderer {
  /**
   * Renders a single 3D volumetric Voxel Block with 3 illuminated faces (Minecraft style):
   * - Top Face: Lit by overhead ambient sky light (brightest)
   * - Front Face: Main diffuse tone
   * - Right/Side Face: Ambient occlusion / shadow facet (darkest)
   */
  public static drawVoxelBlock(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    color: string
  ) {
    // Oblique 2.5D camera projection:
    // depth (d) projects up and right at ~30 degrees
    const skewX = 0.45;
    const skewY = 0.35;

    // Projected front-face center-bottom
    const px = x;
    const py = -z;

    const x0 = px - w / 2;
    const x1 = px + w / 2;
    const yBottom = py;
    const yTop = py - h;

    const topOffsetRx = d * skewX;
    const topOffsetRy = -d * skewY;

    // 1. Side Face (Right facet showing thickness / depth)
    ctx.fillStyle = adjustColor(color, 0.72);
    ctx.beginPath();
    ctx.moveTo(x1, yTop);
    ctx.lineTo(x1 + topOffsetRx, yTop + topOffsetRy);
    ctx.lineTo(x1 + topOffsetRx, yBottom + topOffsetRy);
    ctx.lineTo(x1, yBottom);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = adjustColor(color, 0.55);
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // 2. Top Face (Sky lit surface)
    ctx.fillStyle = adjustColor(color, 1.28);
    ctx.beginPath();
    ctx.moveTo(x0, yTop);
    ctx.lineTo(x0 + topOffsetRx, yTop + topOffsetRy);
    ctx.lineTo(x1 + topOffsetRx, yTop + topOffsetRy);
    ctx.lineTo(x1, yTop);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = adjustColor(color, 0.95);
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // 3. Front Face (Camera-facing square/rectangle)
    ctx.fillStyle = color;
    ctx.fillRect(x0, yTop, w, h);
    ctx.strokeStyle = adjustColor(color, 0.82);
    ctx.lineWidth = 0.6;
    ctx.strokeRect(x0, yTop, w, h);
  }

  /**
   * Main entry point: Draw entity in full 3D Minecraft Voxel aesthetic
   */
  public static drawEntity(
    ctx: CanvasRenderingContext2D,
    entity: Entity,
    cameraX: number,
    tick: number
  ) {
    const screenX = Math.round(entity.x - cameraX);
    const screenY = Math.round(entity.y - entity.z);

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.scale(entity.facing, 1);

    // Invulnerability / Hurt visual FX
    if (entity.invulnerableTimer > 0 && Math.floor(entity.invulnerableTimer * 20) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }
    if (entity.state === "hurt") {
      ctx.filter = "brightness(1.9) drop-shadow(0 0 6px #ef4444)";
    }

    switch (entity.type) {
      case "enemy":
      case "boss":
        this.drawVoxelEnemy(ctx, entity, tick);
        break;
      case "player":
        this.drawVoxelPlayer(ctx, entity, tick);
        break;
      case "mount":
        this.drawVoxelMount(ctx, entity, tick);
        break;
      case "gnome":
        this.drawVoxelGnome(ctx, entity, tick);
        break;
      case "potion":
        this.drawVoxelPotion(ctx, tick);
        break;
      case "meat":
        this.drawVoxelMeat(ctx, tick);
        break;
      case "projectile":
        this.drawVoxelProjectile(ctx, entity, tick);
        break;
    }

    ctx.restore();
  }

  // =========================================================================
  // ENEMY & BOSS VOXEL MODELS
  // =========================================================================

  private static drawVoxelEnemy(ctx: CanvasRenderingContext2D, enemy: Entity, tick: number) {
    const type = (enemy.subType as EnemyType) || "henning";
    const isKnocked = enemy.state === "knockdown" || enemy.state === "dead";
    const isAttacking = enemy.state.startsWith("attack");
    const isWalking = enemy.state === "walk";

    // Knockdown tilt
    if (isKnocked) {
      ctx.rotate(-Math.PI / 2 * enemy.facing);
      ctx.translate(-24, -12);
    }

    // Walking stride angles
    const stride = isWalking ? Math.sin(tick * 0.28) : 0;
    const armSwing = isWalking ? Math.cos(tick * 0.28) : 0;
    const bob = isWalking ? Math.abs(Math.sin(tick * 0.28)) * 3 : 0;

    switch (type) {
      case "henning":
        this.renderVoxelHenning(ctx, enemy, stride, armSwing, bob, isAttacking);
        break;
      case "longmoan":
        this.renderVoxelLongmoan(ctx, enemy, stride, armSwing, bob, isAttacking);
        break;
      case "amazon":
        this.renderVoxelAmazon(ctx, enemy, stride, armSwing, bob, isAttacking);
        break;
      case "skeleton":
        this.renderVoxelSkeleton(ctx, enemy, stride, armSwing, bob, isAttacking);
        break;
      case "bad_brother":
        this.renderVoxelBadBrother(ctx, enemy, stride, armSwing, bob, isAttacking);
        break;
      case "death_adder":
        this.renderVoxelDeathAdder(ctx, enemy, stride, armSwing, bob, isAttacking);
        break;
    }
  }

  // 1. HENNING (Club Thug)
  private static renderVoxelHenning(
    ctx: CanvasRenderingContext2D,
    enemy: Entity,
    stride: number,
    armSwing: number,
    bob: number,
    isAttacking: boolean
  ) {
    const skin = "#f59e0b";
    const vest = "#78350f";
    const pants = "#451a03";
    const wood = "#92400e";
    const spike = "#d97706";

    // Legs
    this.drawVoxelBlock(ctx, -5 + stride * 4, 0, 0, 6, 16, 6, pants);
    this.drawVoxelBlock(ctx, 5 - stride * 4, 0, 0, 6, 16, 6, pants);

    // Torso (Leather Vest)
    this.drawVoxelBlock(ctx, 0, 0, 16 + bob, 16, 18, 10, vest);
    // Studded belt
    this.drawVoxelBlock(ctx, 0, 0, 15 + bob, 17, 3, 11, "#d97706");

    // Head (Bald Scowler)
    this.drawVoxelBlock(ctx, 0, 0, 34 + bob, 12, 12, 12, skin);
    // Brow / Eyes
    this.drawVoxelBlock(ctx, 2, 2, 38 + bob, 8, 3, 2, "#1c1917");

    // Left Arm
    this.drawVoxelBlock(ctx, -10 - armSwing * 4, 0, 20 + bob, 5, 14, 5, skin);

    // Right Arm + Spiked Wooden Club
    if (isAttacking) {
      // Thrusting / swinging club forward
      this.drawVoxelBlock(ctx, 12, 4, 24 + bob, 6, 10, 6, skin);
      // Horizontal Club
      this.drawVoxelBlock(ctx, 24, 6, 26 + bob, 22, 6, 6, wood);
      this.drawVoxelBlock(ctx, 32, 8, 30 + bob, 4, 4, 4, spike);
      this.drawVoxelBlock(ctx, 26, 8, 22 + bob, 4, 4, 4, spike);
    } else {
      // Resting club on shoulder
      this.drawVoxelBlock(ctx, 10 + armSwing * 4, 0, 20 + bob, 5, 14, 5, skin);
      this.drawVoxelBlock(ctx, 14 + armSwing * 3, 2, 28 + bob, 6, 22, 6, wood);
      this.drawVoxelBlock(ctx, 14 + armSwing * 3, 4, 46 + bob, 4, 4, 4, spike);
    }
  }

  // 2. LONGMOAN (Armored Mace Guard)
  private static renderVoxelLongmoan(
    ctx: CanvasRenderingContext2D,
    enemy: Entity,
    stride: number,
    armSwing: number,
    bob: number,
    isAttacking: boolean
  ) {
    const tunic = "#7e22ce"; // Royal purple
    const plate = "#64748b"; // Steel mail
    const helm = "#94a3b8";
    const dark = "#1e293b";

    // Greaved Legs
    this.drawVoxelBlock(ctx, -5 + stride * 4, 0, 0, 6, 16, 6, dark);
    this.drawVoxelBlock(ctx, 5 - stride * 4, 0, 0, 6, 16, 6, dark);

    // Purple Tunic + Steel Breastplate
    this.drawVoxelBlock(ctx, 0, 0, 16 + bob, 18, 20, 10, tunic);
    this.drawVoxelBlock(ctx, 0, 2, 20 + bob, 14, 12, 4, plate);

    // Steel Horned Helmet
    this.drawVoxelBlock(ctx, 0, 0, 36 + bob, 14, 14, 14, helm);
    // Horns
    this.drawVoxelBlock(ctx, -8, 0, 44 + bob, 4, 6, 4, "#cbd5e1");
    this.drawVoxelBlock(ctx, 8, 0, 44 + bob, 4, 6, 4, "#cbd5e1");
    // Visor eye slit
    this.drawVoxelBlock(ctx, 1, 3, 40 + bob, 10, 3, 2, "#0f172a");

    // Left Arm (Buckler shield)
    this.drawVoxelBlock(ctx, -11 - armSwing * 3, 0, 20 + bob, 5, 12, 5, plate);
    this.drawVoxelBlock(ctx, -14 - armSwing * 3, 2, 22 + bob, 4, 12, 12, "#475569");
    this.drawVoxelBlock(ctx, -15 - armSwing * 3, 3, 24 + bob, 2, 6, 6, "#eab308"); // Gold boss

    // Right Arm + Spiked Morningstar
    if (isAttacking) {
      this.drawVoxelBlock(ctx, 12, 4, 26 + bob, 6, 12, 6, plate);
      // Shaft forward
      this.drawVoxelBlock(ctx, 22, 6, 28 + bob, 16, 4, 4, dark);
      // Spiked Mace Head
      this.drawVoxelBlock(ctx, 32, 8, 26 + bob, 10, 10, 10, plate);
      this.drawVoxelBlock(ctx, 32, 10, 34 + bob, 3, 4, 3, "#f8fafc");
      this.drawVoxelBlock(ctx, 38, 8, 26 + bob, 4, 3, 3, "#f8fafc");
    } else {
      this.drawVoxelBlock(ctx, 11 + armSwing * 3, 0, 20 + bob, 5, 14, 5, plate);
      this.drawVoxelBlock(ctx, 13 + armSwing * 3, 2, 22 + bob, 4, 24, 4, dark);
      this.drawVoxelBlock(ctx, 13 + armSwing * 3, 4, 42 + bob, 9, 9, 9, plate);
    }
  }

  // 3. AMAZON (Swift Emerald Warrior)
  private static renderVoxelAmazon(
    ctx: CanvasRenderingContext2D,
    enemy: Entity,
    stride: number,
    armSwing: number,
    bob: number,
    isAttacking: boolean
  ) {
    const skin = "#f59e0b";
    const mail = "#059669"; // Emerald
    const hair = "#fbbf24";
    const steel = "#f8fafc";

    // Agile boots
    this.drawVoxelBlock(ctx, -4 + stride * 5, 0, 0, 5, 16, 5, "#047857");
    this.drawVoxelBlock(ctx, 4 - stride * 5, 0, 0, 5, 16, 5, "#047857");

    // Slim Torso (Emerald Mail)
    this.drawVoxelBlock(ctx, 0, 0, 16 + bob, 14, 18, 8, mail);

    // Head
    this.drawVoxelBlock(ctx, 0, 0, 34 + bob, 11, 12, 11, skin);
    // Eyes
    this.drawVoxelBlock(ctx, 2, 2, 38 + bob, 7, 2, 2, "#1e293b");
    // Golden Ponytail (swings behind with motion)
    this.drawVoxelBlock(ctx, -7 - stride * 3, -4, 38 + bob, 5, 16, 5, hair);
    this.drawVoxelBlock(ctx, -9 - stride * 4, -6, 30 + bob, 4, 10, 4, hair);

    // Left Arm with Parrying Dagger
    this.drawVoxelBlock(ctx, -9 - armSwing * 4, 0, 20 + bob, 4, 12, 4, skin);
    this.drawVoxelBlock(ctx, -11 - armSwing * 4, 2, 24 + bob, 3, 10, 3, steel);

    // Right Arm with Scimitar
    if (isAttacking) {
      this.drawVoxelBlock(ctx, 10, 4, 24 + bob, 5, 12, 5, skin);
      // Slicing Scimitar
      this.drawVoxelBlock(ctx, 22, 6, 28 + bob, 20, 3, 5, steel);
      this.drawVoxelBlock(ctx, 32, 8, 32 + bob, 8, 3, 5, steel);
    } else {
      this.drawVoxelBlock(ctx, 9 + armSwing * 4, 0, 20 + bob, 4, 12, 4, skin);
      this.drawVoxelBlock(ctx, 12 + armSwing * 4, 2, 22 + bob, 3, 20, 4, steel);
    }
  }

  // 4. SKELETON (Minecraft Undead Soldier homage)
  private static renderVoxelSkeleton(
    ctx: CanvasRenderingContext2D,
    enemy: Entity,
    stride: number,
    armSwing: number,
    bob: number,
    isAttacking: boolean
  ) {
    const bone = "#f1f5f9";
    const darkBone = "#cbd5e1";
    const shadow = "#0f172a";
    const blade = "#94a3b8";

    // Voxel Femur Legs
    this.drawVoxelBlock(ctx, -4 + stride * 4, 0, 0, 4, 16, 4, bone);
    this.drawVoxelBlock(ctx, 4 - stride * 4, 0, 0, 4, 16, 4, bone);

    // Voxel Ribcage (hollowed look with darkened center)
    this.drawVoxelBlock(ctx, 0, 0, 16 + bob, 14, 18, 8, darkBone);
    // Rib horizontal lines
    this.drawVoxelBlock(ctx, 0, 2, 28 + bob, 15, 3, 2, bone);
    this.drawVoxelBlock(ctx, 0, 2, 23 + bob, 15, 3, 2, bone);
    this.drawVoxelBlock(ctx, 0, 2, 18 + bob, 13, 3, 2, bone);

    // Voxel Skull (Classic Minecraft Hollow Eye Sockets)
    this.drawVoxelBlock(ctx, 0, 0, 34 + bob, 13, 13, 13, bone);
    // Hollow black eye sockets
    this.drawVoxelBlock(ctx, -2, 3, 39 + bob, 3, 4, 2, shadow);
    this.drawVoxelBlock(ctx, 3, 3, 39 + bob, 3, 4, 2, shadow);
    // Nose cavity
    this.drawVoxelBlock(ctx, 0, 3, 37 + bob, 2, 2, 2, shadow);

    // Left Arm (Bone Arm + Wooden Viking Shield)
    this.drawVoxelBlock(ctx, -9 - armSwing * 3, 0, 18 + bob, 3, 14, 3, bone);
    this.drawVoxelBlock(ctx, -12 - armSwing * 3, 2, 20 + bob, 3, 14, 14, "#78350f");
    this.drawVoxelBlock(ctx, -13 - armSwing * 3, 3, 24 + bob, 2, 6, 6, "#cbd5e1"); // Metal boss

    // Right Arm (Bone arm + Sword)
    if (isAttacking) {
      this.drawVoxelBlock(ctx, 10, 4, 24 + bob, 4, 12, 4, bone);
      // Sword thrust forward
      this.drawVoxelBlock(ctx, 22, 6, 26 + bob, 22, 3, 5, blade);
      this.drawVoxelBlock(ctx, 32, 7, 26 + bob, 6, 2, 3, "#f8fafc");
    } else {
      this.drawVoxelBlock(ctx, 9 + armSwing * 3, 0, 18 + bob, 3, 14, 3, bone);
      this.drawVoxelBlock(ctx, 11 + armSwing * 3, 2, 22 + bob, 3, 22, 4, blade);
    }
  }

  // 5. BAD BROTHER (Giant Warhammer Boss)
  private static renderVoxelBadBrother(
    ctx: CanvasRenderingContext2D,
    enemy: Entity,
    stride: number,
    armSwing: number,
    bob: number,
    isAttacking: boolean
  ) {
    ctx.scale(1.4, 1.4); // Giant scale!

    const skin = "#b45309";
    const darkSkin = "#92400e";
    const leather = "#451a03";
    const iron = "#334155";
    const stone = "#64748b";

    // Massive Tree-Trunk Legs
    this.drawVoxelBlock(ctx, -7 + stride * 5, 0, 0, 9, 18, 9, leather);
    this.drawVoxelBlock(ctx, 7 - stride * 5, 0, 0, 9, 18, 9, leather);

    // Massive Muscular Torso & Boulder Shoulders
    this.drawVoxelBlock(ctx, 0, 0, 18 + bob, 24, 24, 14, skin);
    this.drawVoxelBlock(ctx, -14, 0, 32 + bob, 9, 9, 9, darkSkin); // Left shoulder pauldron
    this.drawVoxelBlock(ctx, 14, 0, 32 + bob, 9, 9, 9, darkSkin);  // Right shoulder pauldron

    // Heavy Studded Girdle
    this.drawVoxelBlock(ctx, 0, 1, 18 + bob, 25, 6, 15, iron);

    // Giant Horned Head
    this.drawVoxelBlock(ctx, 0, 0, 42 + bob, 16, 16, 16, skin);
    this.drawVoxelBlock(ctx, 0, 2, 50 + bob, 17, 8, 17, iron); // Iron skullcap
    this.drawVoxelBlock(ctx, -10, 0, 52 + bob, 5, 8, 5, "#e2e8f0"); // Giant horns
    this.drawVoxelBlock(ctx, 10, 0, 52 + bob, 5, 8, 5, "#e2e8f0");
    // Fierce grimace
    this.drawVoxelBlock(ctx, 2, 4, 46 + bob, 10, 4, 2, "#1c1917");

    // Left Giant Arm
    this.drawVoxelBlock(ctx, -16 - armSwing * 4, 0, 22 + bob, 8, 18, 8, skin);
    this.drawVoxelBlock(ctx, -16 - armSwing * 4, 1, 20 + bob, 9, 5, 9, iron); // Iron bracer

    // Right Giant Arm + COLOSSAL WAR HAMMER
    if (isAttacking) {
      // Smashing down on the floor!
      this.drawVoxelBlock(ctx, 16, 6, 32 + bob, 8, 16, 8, skin);
      // Hammer Haft angled downwards
      this.drawVoxelBlock(ctx, 26, 8, 18 + bob, 6, 32, 6, "#1e293b");
      // Giant Hammerhead crashing into ground
      this.drawVoxelBlock(ctx, 30, 10, 6, 20, 18, 18, stone);
      this.drawVoxelBlock(ctx, 30, 10, 6, 22, 5, 19, iron); // Iron reinforcing band
    } else {
      // Held upright menacingly
      this.drawVoxelBlock(ctx, 16 + armSwing * 3, 0, 22 + bob, 8, 18, 8, skin);
      this.drawVoxelBlock(ctx, 20 + armSwing * 3, 4, 26 + bob, 6, 42, 6, "#1e293b");
      this.drawVoxelBlock(ctx, 20 + armSwing * 3, 6, 56 + bob, 18, 16, 16, stone);
      this.drawVoxelBlock(ctx, 20 + armSwing * 3, 6, 56 + bob, 20, 4, 18, iron);
    }
  }

  // 6. DEATH ADDER (Final Boss - The Tyrant)
  private static renderVoxelDeathAdder(
    ctx: CanvasRenderingContext2D,
    enemy: Entity,
    stride: number,
    armSwing: number,
    bob: number,
    isAttacking: boolean
  ) {
    ctx.scale(1.55, 1.55); // Maximum Boss scale!

    const obsidian = "#0f172a";
    const armor = "#1e293b";
    const gold = "#eab308";
    const brightGold = "#facc15";
    const bloodRuby = "#dc2626";
    const eyeRed = "#ef4444";

    // Massive Armored Boots
    this.drawVoxelBlock(ctx, -8 + stride * 5, 0, 0, 10, 18, 10, obsidian);
    this.drawVoxelBlock(ctx, 8 - stride * 5, 0, 0, 10, 18, 10, obsidian);

    // Billowing Dark Crimson Voxel Cape (Back)
    this.drawVoxelBlock(ctx, -stride * 3, -6, 12 + bob, 26, 28, 4, "#991b1b");
    this.drawVoxelBlock(ctx, -stride * 4, -8, 4 + bob, 28, 16, 3, "#7f1d1d");

    // Obsidian Plate Torso
    this.drawVoxelBlock(ctx, 0, 0, 18 + bob, 26, 26, 14, obsidian);
    // Golden Tyrant Crest on Chest
    this.drawVoxelBlock(ctx, 0, 2, 28 + bob, 12, 12, 3, gold);
    this.drawVoxelBlock(ctx, 0, 3, 30 + bob, 4, 6, 2, bloodRuby);

    // Spiked Pauldrons
    this.drawVoxelBlock(ctx, -16, 0, 36 + bob, 11, 11, 11, armor);
    this.drawVoxelBlock(ctx, -16, 0, 44 + bob, 4, 8, 4, gold); // Left pauldron spike
    this.drawVoxelBlock(ctx, 16, 0, 36 + bob, 11, 11, 11, armor);
    this.drawVoxelBlock(ctx, 16, 0, 44 + bob, 4, 8, 4, gold);  // Right pauldron spike

    // Menacing Horned Helm
    this.drawVoxelBlock(ctx, 0, 0, 44 + bob, 16, 18, 16, obsidian);
    // Horns
    this.drawVoxelBlock(ctx, -12, 0, 56 + bob, 6, 12, 6, "#f8fafc");
    this.drawVoxelBlock(ctx, 12, 0, 56 + bob, 6, 12, 6, "#f8fafc");
    // Visor with glowing red slit eyes
    this.drawVoxelBlock(ctx, -3, 3, 50 + bob, 4, 3, 2, eyeRed);
    this.drawVoxelBlock(ctx, 3, 3, 50 + bob, 4, 3, 2, eyeRed);

    // Left Arm (Dark Tower Shield)
    this.drawVoxelBlock(ctx, -18 - armSwing * 3, 0, 22 + bob, 8, 16, 8, obsidian);
    this.drawVoxelBlock(ctx, -22 - armSwing * 3, 3, 16 + bob, 5, 28, 16, armor);
    this.drawVoxelBlock(ctx, -23 - armSwing * 3, 4, 24 + bob, 3, 12, 8, gold); // Embossed golden skull boss

    // Right Arm + THE LEGENDARY GOLDEN AXE!
    if (isAttacking) {
      // Sweeping double axe cleave!
      this.drawVoxelBlock(ctx, 18, 6, 32 + bob, 8, 16, 8, obsidian);
      // Shaft forward
      this.drawVoxelBlock(ctx, 30, 8, 34 + bob, 8, 38, 8, "#78350f");
      // Double Golden Crescent Blades!
      this.drawVoxelBlock(ctx, 42, 10, 36 + bob, 26, 22, 6, gold);
      this.drawVoxelBlock(ctx, 42, 12, 36 + bob, 28, 4, 4, brightGold); // Blade edge
      this.drawVoxelBlock(ctx, 36, 10, 36 + bob, 6, 6, 6, bloodRuby);   // Center Gem
    } else {
      // Ready Stance
      this.drawVoxelBlock(ctx, 18 + armSwing * 3, 0, 24 + bob, 8, 18, 8, obsidian);
      // Shaft
      this.drawVoxelBlock(ctx, 22 + armSwing * 3, 4, 28 + bob, 6, 48, 6, "#78350f");
      // Golden Double Axe Blades
      this.drawVoxelBlock(ctx, 22 + armSwing * 3, 6, 62 + bob, 24, 20, 6, gold);
      this.drawVoxelBlock(ctx, 22 + armSwing * 3, 7, 62 + bob, 26, 4, 4, brightGold);
      this.drawVoxelBlock(ctx, 22 + armSwing * 3, 7, 62 + bob, 6, 6, 6, bloodRuby);
    }
  }

  // =========================================================================
  // MOUNT VOXEL MODELS (BIZARRIANS)
  // =========================================================================

  private static drawVoxelMount(ctx: CanvasRenderingContext2D, mount: Entity, tick: number) {
    const type = (mount.subType as MountType) || "chicken_leg";
    const walkBob = mount.vx !== 0 ? Math.abs(Math.sin(tick * 0.3)) * 4 : 0;
    const stride = mount.vx !== 0 ? Math.sin(tick * 0.3) * 5 : 0;

    if (type === "chicken_leg") {
      // Cockatrice / Chicken-Leg: Pink/Magenta bipedal raptor
      const bodyColor = "#db2777";
      const legColor = "#eab308";
      const beakColor = "#f59e0b";

      // Powerful bipedal legs
      this.drawVoxelBlock(ctx, -8 + stride, 0, 0, 6, 18, 6, legColor);
      this.drawVoxelBlock(ctx, 8 - stride, 0, 0, 6, 18, 6, legColor);

      // Rounded Voxel Body
      this.drawVoxelBlock(ctx, 0, 0, 18 + walkBob, 26, 18, 16, bodyColor);

      // Raptor Beak & Head
      this.drawVoxelBlock(ctx, 16, 2, 26 + walkBob, 12, 10, 10, bodyColor);
      this.drawVoxelBlock(ctx, 24, 2, 24 + walkBob, 8, 6, 6, beakColor); // Beak
      this.drawVoxelBlock(ctx, 18, 4, 30 + walkBob, 3, 3, 2, "#000");     // Eye

      // Feathered Crest
      this.drawVoxelBlock(ctx, 12, 0, 36 + walkBob, 6, 6, 6, "#be185d");

      // Segmented Whipping Tail (5 articulate voxels)
      const tailSwing = Math.sin(tick * 0.35) * 6;
      this.drawVoxelBlock(ctx, -14, 0, 22 + walkBob, 8, 6, 6, bodyColor);
      this.drawVoxelBlock(ctx, -20 + tailSwing * 0.5, 0, 20 + walkBob, 7, 5, 5, bodyColor);
      this.drawVoxelBlock(ctx, -26 + tailSwing, 0, 18 + walkBob, 6, 5, 5, "#be185d");
      this.drawVoxelBlock(ctx, -32 + tailSwing * 1.5, 0, 16 + walkBob, 5, 4, 4, "#9d174d");

      // Leather Saddle Block
      this.drawVoxelBlock(ctx, -2, 0, 28 + walkBob, 14, 4, 12, "#78350f");
    } else {
      // Fire Dragon: Crimson scaled dragon
      const dragonRed = "#dc2626";
      const darkRed = "#991b1b";
      const hornGold = "#eab308";

      // 4 Sturdy Voxel Legs
      this.drawVoxelBlock(ctx, -12 + stride, 0, 0, 7, 14, 7, darkRed);
      this.drawVoxelBlock(ctx, 12 - stride, 0, 0, 7, 14, 7, darkRed);

      // Heavy Scaled Body
      this.drawVoxelBlock(ctx, 0, 0, 14 + walkBob, 32, 20, 18, dragonRed);

      // Horned Dragon Snout & Jaw
      this.drawVoxelBlock(ctx, 18, 0, 24 + walkBob, 16, 14, 14, dragonRed);
      this.drawVoxelBlock(ctx, 28, 2, 22 + walkBob, 8, 8, 10, darkRed); // Snout
      this.drawVoxelBlock(ctx, 18, 2, 34 + walkBob, 4, 8, 4, hornGold); // Horns
      this.drawVoxelBlock(ctx, 22, 4, 28 + walkBob, 3, 3, 2, "#facc15"); // Glowing reptile eye

      // Voxel Wings (Flapping slightly)
      const wingFlap = Math.sin(tick * 0.4) * 8;
      this.drawVoxelBlock(ctx, -4, 4 + wingFlap, 26 + walkBob, 18, 4, 12, "#b91c1c");

      // Spiked Dragon Tail
      this.drawVoxelBlock(ctx, -18, 0, 18 + walkBob, 10, 8, 8, dragonRed);
      this.drawVoxelBlock(ctx, -26, 0, 16 + walkBob, 8, 6, 6, darkRed);
      this.drawVoxelBlock(ctx, -32, 0, 14 + walkBob, 6, 5, 5, hornGold);

      // Saddle
      this.drawVoxelBlock(ctx, -2, 0, 25 + walkBob, 14, 4, 12, "#451a03");
    }
  }

  // =========================================================================
  // GNOME (THIEF) VOXEL MODEL
  // =========================================================================

  private static drawVoxelGnome(ctx: CanvasRenderingContext2D, gnome: Entity, tick: number) {
    const isMagic = gnome.subType !== "meat";
    const hatColor = isMagic ? "#3b82f6" : "#22c55e";
    const skin = "#fcd34d";
    const sackColor = "#a16207"; // Burlap sack
    const waddle = Math.sin(tick * 0.45) * 4;

    // Little voxel running feet
    this.drawVoxelBlock(ctx, -4 + waddle, 0, 0, 4, 8, 4, "#78350f");
    this.drawVoxelBlock(ctx, 4 - waddle, 0, 0, 4, 8, 4, "#78350f");

    // Little round body
    this.drawVoxelBlock(ctx, 0, 0, 8, 12, 12, 10, hatColor);

    // Cute chubby head + big nose
    this.drawVoxelBlock(ctx, 2, 0, 20, 10, 10, 10, skin);
    this.drawVoxelBlock(ctx, 7, 2, 22, 4, 4, 4, "#f59e0b"); // Big round nose

    // Tall pointy floppy hat (Minecraft stepped blocks)
    this.drawVoxelBlock(ctx, 0, 0, 28, 12, 6, 12, hatColor);
    this.drawVoxelBlock(ctx, -2, 0, 34, 8, 6, 8, hatColor);
    this.drawVoxelBlock(ctx, -5, 0, 40, 5, 6, 5, hatColor);

    // Bulging Burlap Sack on back (jiggling with run)
    this.drawVoxelBlock(ctx, -10, 0, 12 + Math.abs(waddle), 14, 16, 12, sackColor);
    // Tied rope knot
    this.drawVoxelBlock(ctx, -6, 2, 24 + Math.abs(waddle), 4, 4, 4, "#fef08a");
  }

  // =========================================================================
  // 3D VOXEL ITEMS & PICKUPS (ROTATING IN MID-AIR)
  // =========================================================================

  /**
   * 3D Voxel Magic Potion: Spinning crystal glass flask with glowing blue elixir
   */
  private static drawVoxelPotion(ctx: CanvasRenderingContext2D, tick: number) {
    const spinAngle = tick * 0.08;
    const floatBob = Math.sin(tick * 0.15) * 6;

    ctx.save();
    ctx.translate(0, -18 + floatBob);
    ctx.rotate(Math.sin(spinAngle) * 0.18);

    // Blue Magic Elixir Cube
    this.drawVoxelBlock(ctx, 0, 0, 0, 14, 14, 14, "#38bdf8");
    // Sparkle Highlight
    this.drawVoxelBlock(ctx, 2, 2, 4, 6, 6, 6, "#e0f2fe");
    // Glass Neck
    this.drawVoxelBlock(ctx, 0, 0, 14, 8, 6, 8, "#bae6fd");
    // Cork Stopper
    this.drawVoxelBlock(ctx, 0, 0, 20, 6, 5, 6, "#b45309");

    // Orbiting magic sparkle voxels
    for (let i = 0; i < 3; i++) {
      const a = spinAngle * 2 + (i * Math.PI * 2) / 3;
      const ox = Math.cos(a) * 16;
      const oz = Math.sin(a) * 8 + 8;
      this.drawVoxelBlock(ctx, ox, 0, oz, 3, 3, 3, "#fef08a");
    }

    ctx.restore();
  }

  /**
   * 3D Voxel Roast Meat: Sizzling golden leg of beast with ivory bone, rotating
   */
  private static drawVoxelMeat(ctx: CanvasRenderingContext2D, tick: number) {
    const spinAngle = tick * 0.07;
    const floatBob = Math.sin(tick * 0.12) * 5;

    ctx.save();
    ctx.translate(0, -16 + floatBob);
    ctx.rotate(Math.cos(spinAngle) * 0.15);

    // White Voxel Bone
    this.drawVoxelBlock(ctx, -10, 0, 0, 6, 6, 6, "#f8fafc");
    this.drawVoxelBlock(ctx, -14, 0, 0, 4, 8, 4, "#e2e8f0");

    // Golden Roasted Drumstick Voxels
    this.drawVoxelBlock(ctx, 0, 0, 0, 16, 16, 16, "#b45309");
    this.drawVoxelBlock(ctx, 4, 2, 2, 12, 12, 12, "#d97706");
    this.drawVoxelBlock(ctx, 8, 3, 3, 8, 8, 8, "#f59e0b");

    // Sizzle steam particles (little white rising voxels)
    const steamY = ((tick * 1.2) % 18);
    this.drawVoxelBlock(ctx, 2, 0, 16 + steamY, 3, 3, 3, "rgba(255, 255, 255, 0.75)");

    ctx.restore();
  }

  /**
   * 3D Voxel Projectile (Fireball, Dark magic blast)
   */
  private static drawVoxelProjectile(
    ctx: CanvasRenderingContext2D,
    projectile: Entity,
    tick: number
  ) {
    const spin = tick * 0.3;
    ctx.save();
    ctx.rotate(spin);

    // Fiery Core
    this.drawVoxelBlock(ctx, 0, 0, 0, 14, 14, 14, "#facc15");
    this.drawVoxelBlock(ctx, 0, 0, 0, 18, 18, 18, "#f97316");
    this.drawVoxelBlock(ctx, 0, 0, 0, 22, 22, 22, "#dc2626");

    // Trailing spark voxels
    this.drawVoxelBlock(ctx, -14, 0, 0, 6, 6, 6, "#fbbf24");
    this.drawVoxelBlock(ctx, -22, 0, 0, 4, 4, 4, "#ef4444");

    ctx.restore();
  }

  // =========================================================================
  // HERO PLAYER VOXEL MODELS (AX, TYRIS, GILIUS)
  // =========================================================================

  private static drawVoxelPlayer(ctx: CanvasRenderingContext2D, player: Entity, tick: number) {
    const hero = player.heroId || "ax";
    const isKnocked = player.state === "knockdown" || player.state === "dead";
    const isAttacking = player.state.startsWith("attack") || player.state === "finisher";
    const isWalking = player.state === "walk" || player.state === "run";
    const isRiding = Boolean(player.mountedOnId);

    if (isKnocked) {
      ctx.rotate(-Math.PI / 2 * player.facing);
      ctx.translate(-24, -12);
    }

    if (isRiding) {
      ctx.translate(0, -22);
    }

    const stride = isWalking ? Math.sin(tick * 0.3) : 0;
    const armSwing = isWalking ? Math.cos(tick * 0.3) : 0;
    const bob = isWalking ? Math.abs(Math.sin(tick * 0.3)) * 3 : 0;

    if (hero === "ax") {
      // AX BATTLER (Barbarian Broadsword)
      const skin = "#d97706";
      const trunks = "#2563eb";
      const hair = "#fbbf24";
      const steel = "#e2e8f0";

      // Boots/Legs
      if (!isRiding) {
        this.drawVoxelBlock(ctx, -5 + stride * 4, 0, 0, 6, 16, 6, "#78350f");
        this.drawVoxelBlock(ctx, 5 - stride * 4, 0, 0, 6, 16, 6, "#78350f");
      }
      // Blue Trunks & Muscular Bare Torso
      this.drawVoxelBlock(ctx, 0, 0, 16 + bob, 16, 8, 10, trunks);
      this.drawVoxelBlock(ctx, 0, 0, 24 + bob, 18, 16, 10, skin);
      // Blue shoulder pauldron
      this.drawVoxelBlock(ctx, -10, 0, 36 + bob, 7, 7, 7, trunks);

      // Barbarian Head + Golden Blond Hair
      this.drawVoxelBlock(ctx, 0, 0, 40 + bob, 12, 12, 12, skin);
      this.drawVoxelBlock(ctx, 0, 0, 48 + bob, 14, 6, 14, hair);
      this.drawVoxelBlock(ctx, -4, -4, 42 + bob, 4, 10, 4, hair);

      // Left Arm
      this.drawVoxelBlock(ctx, -10 - armSwing * 3, 0, 26 + bob, 5, 14, 5, skin);

      // Right Arm + Broadsword
      if (isAttacking) {
        this.drawVoxelBlock(ctx, 12, 4, 30 + bob, 6, 12, 6, skin);
        // Slashing broadsword
        this.drawVoxelBlock(ctx, 24, 6, 32 + bob, 26, 4, 5, steel);
        this.drawVoxelBlock(ctx, 14, 5, 31 + bob, 4, 10, 4, "#94a3b8"); // Crossguard
      } else {
        this.drawVoxelBlock(ctx, 10 + armSwing * 3, 0, 26 + bob, 5, 14, 5, skin);
        this.drawVoxelBlock(ctx, 13 + armSwing * 3, 2, 32 + bob, 4, 28, 4, steel);
      }
    } else if (hero === "tyris") {
      // TYRIS FLARE (Amazon Flame Rapier)
      const skin = "#f59e0b";
      const mail = "#dc2626"; // Crimson
      const hair = "#78350f";
      const steel = "#f8fafc";

      if (!isRiding) {
        this.drawVoxelBlock(ctx, -4 + stride * 5, 0, 0, 5, 16, 5, "#991b1b");
        this.drawVoxelBlock(ctx, 4 - stride * 5, 0, 0, 5, 16, 5, "#991b1b");
      }
      this.drawVoxelBlock(ctx, 0, 0, 16 + bob, 14, 18, 8, mail);
      this.drawVoxelBlock(ctx, 0, 0, 34 + bob, 11, 12, 11, skin);
      this.drawVoxelBlock(ctx, -6, -4, 36 + bob, 5, 18, 5, hair); // Long dark hair

      this.drawVoxelBlock(ctx, -9 - armSwing * 3, 0, 22 + bob, 4, 12, 4, skin);
      if (isAttacking) {
        this.drawVoxelBlock(ctx, 10, 4, 26 + bob, 5, 12, 5, skin);
        this.drawVoxelBlock(ctx, 24, 6, 28 + bob, 26, 3, 4, steel);
      } else {
        this.drawVoxelBlock(ctx, 9 + armSwing * 3, 0, 22 + bob, 4, 12, 4, skin);
        this.drawVoxelBlock(ctx, 12 + armSwing * 3, 2, 26 + bob, 3, 24, 3, steel);
      }
    } else {
      // GILIUS THUNDERHEAD (Dwarf Battleaxe)
      ctx.scale(0.85, 0.85); // Stout dwarf
      const tunic = "#15803d"; // Green
      const bronze = "#eab308";
      const beard = "#f1f5f9"; // White beard
      const iron = "#94a3b8";

      if (!isRiding) {
        this.drawVoxelBlock(ctx, -5 + stride * 3, 0, 0, 6, 12, 6, "#78350f");
        this.drawVoxelBlock(ctx, 5 - stride * 3, 0, 0, 6, 12, 6, "#78350f");
      }
      this.drawVoxelBlock(ctx, 0, 0, 12 + bob, 18, 18, 12, tunic);

      // Horned Helmet + Grand White Beard
      this.drawVoxelBlock(ctx, 0, 0, 30 + bob, 14, 14, 14, "#fbbf24");
      this.drawVoxelBlock(ctx, 0, 0, 38 + bob, 16, 8, 16, bronze); // Helmet
      this.drawVoxelBlock(ctx, -9, 0, 42 + bob, 4, 6, 4, "#cbd5e1"); // Horns
      this.drawVoxelBlock(ctx, 9, 0, 42 + bob, 4, 6, 4, "#cbd5e1");
      // White Braided Beard cascading down chest
      this.drawVoxelBlock(ctx, 2, 3, 22 + bob, 12, 14, 6, beard);

      this.drawVoxelBlock(ctx, -10 - armSwing * 3, 0, 18 + bob, 5, 12, 5, tunic);

      // Double-headed Battleaxe
      if (isAttacking) {
        this.drawVoxelBlock(ctx, 12, 4, 22 + bob, 5, 12, 5, tunic);
        this.drawVoxelBlock(ctx, 22, 6, 24 + bob, 6, 26, 6, "#78350f");
        this.drawVoxelBlock(ctx, 28, 8, 24 + bob, 18, 16, 6, iron);
      } else {
        this.drawVoxelBlock(ctx, 10 + armSwing * 3, 0, 18 + bob, 5, 12, 5, tunic);
        this.drawVoxelBlock(ctx, 13 + armSwing * 3, 2, 22 + bob, 5, 30, 5, "#78350f");
        this.drawVoxelBlock(ctx, 13 + armSwing * 3, 4, 42 + bob, 16, 14, 6, iron);
      }
    }
  }
}
