/**
 * Golden Axe High-Fidelity Pixel Art Sprite Drawer
 * Renders authentic arcade pixel art with animation frames, mounts, cosmetics, and hit FX.
 */

import { Entity, HeroId, EnemyType, MountType, Particle } from "../types/game";
import { VoxelRenderer } from "./voxelRenderer";

export const HERO_COLORS: Record<HeroId, { primary: string; skin: string; hair: string; weapon: string; accent: string }> = {
  ax: {
    primary: "#2563eb", // Blue boots/trunks
    skin: "#d97706",    // Tanned muscular
    hair: "#fbbf24",    // Blond barbarian
    weapon: "#e2e8f0",  // Steel broadsword
    accent: "#f59e0b",
  },
  tyris: {
    primary: "#dc2626", // Red amazon mail
    skin: "#f59e0b",    // Sun-kissed skin
    hair: "#78350f",    // Long flowing dark hair
    weapon: "#f8fafc",  // Gleaming rapier/blade
    accent: "#ef4444",
  },
  gilius: {
    primary: "#15803d", // Green tunic
    skin: "#fbbf24",    // Dwarf skin
    hair: "#f1f5f9",    // Pure white braided beard
    weapon: "#94a3b8",  // Heavy double-headed battleaxe
    accent: "#eab308",  // Bronze horned helmet
  },
};

export class SpriteRenderer {
  // Draw shadow on ground plane
  public static drawShadow(ctx: CanvasRenderingContext2D, entity: Entity, cameraX: number) {
    const screenX = Math.round(entity.x - cameraX);
    const screenY = Math.round(entity.y);
    const radiusX = Math.max(12, entity.width * 0.45);
    const radiusY = Math.max(5, radiusX * 0.4);

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
    ctx.beginPath();
    ctx.ellipse(screenX, screenY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Main entity drawing dispatcher
  public static drawEntity(
    ctx: CanvasRenderingContext2D,
    entity: Entity,
    cameraX: number,
    tick: number,
    voxelMode: boolean = true
  ) {
    if (voxelMode) {
      VoxelRenderer.drawEntity(ctx, entity, cameraX, tick);
      return;
    }

    const screenX = Math.round(entity.x - cameraX);
    const screenY = Math.round(entity.y - entity.z); // z is jump height

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.scale(entity.facing, 1);

    // Hit flash or invulnerability flicker
    if (entity.invulnerableTimer > 0 && Math.floor(entity.invulnerableTimer * 20) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    if (entity.state === "hurt") {
      ctx.filter = "brightness(1.8) drop-shadow(0 0 4px #ef4444)";
    }

    // Render cosmetic aura if equipped
    if (entity.equippedCosmetics?.aura) {
      ctx.save();
      ctx.strokeStyle = entity.equippedCosmetics.aura;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, -entity.height * 0.5, entity.width * 0.6, entity.height * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    switch (entity.type) {
      case "player":
        this.drawPlayer(ctx, entity, tick);
        break;
      case "enemy":
      case "boss":
        this.drawEnemy(ctx, entity, tick);
        break;
      case "mount":
        this.drawMount(ctx, entity, tick);
        break;
      case "gnome":
        this.drawGnome(ctx, entity, tick);
        break;
      case "potion":
        this.drawPotion(ctx, tick);
        break;
      case "meat":
        this.drawMeat(ctx, tick);
        break;
      case "projectile":
        this.drawProjectile(ctx, entity, tick);
        break;
    }

    ctx.restore();
  }

  // --- PLAYER SPRITE DRAWING ---
  private static drawPlayer(ctx: CanvasRenderingContext2D, player: Entity, tick: number) {
    const hero = player.heroId || "ax";
    const colors = { ...HERO_COLORS[hero] };

    // Apply cosmetic skin override
    if (player.equippedCosmetics?.skin) {
      if (player.equippedCosmetics.skin.includes("golden")) colors.primary = "#eab308";
      if (player.equippedCosmetics.skin.includes("crimson")) colors.primary = "#be123c";
      if (player.equippedCosmetics.skin.includes("storm")) colors.primary = "#06b6d4";
    }

    const frame = player.animFrame;
    const isWalking = player.state === "walk";
    const isRunning = player.state === "run";
    const isAttacking = player.state.startsWith("attack") || player.state === "finisher" || player.state === "dash_attack";
    const isJumping = player.state === "jump" || player.state === "jump_attack";
    const isDownPlunge = player.state === "down_plunge";
    const isKnocked = player.state === "knockdown" || player.state === "dead";
    const isRiding = Boolean(player.mountedOnId);

    // If knocked down on floor
    if (isKnocked) {
      ctx.rotate(-Math.PI / 2 * player.facing);
      ctx.translate(-20, -10);
    }

    // Base body dimensions
    const scale = hero === "gilius" ? 0.85 : 1.0;
    ctx.scale(scale, scale);

    // Offset if riding mount
    if (isRiding) {
      ctx.translate(0, -28);
    }

    // Head Bobbing
    let bobY = isWalking ? Math.sin(tick * 0.25) * 2 : isRunning ? Math.sin(tick * 0.4) * 4 : 0;
    if (isDownPlunge) bobY = 6;

    // 1. Torso & Armor
    ctx.fillStyle = hero === "tyris" ? colors.primary : colors.skin; // Ax & Gilius bare chest / mail
    ctx.fillRect(-10, -52 + bobY, 20, 24);

    // Shoulder Pauldrons / Straps
    ctx.fillStyle = colors.primary;
    if (hero === "ax") {
      ctx.fillRect(-12, -54 + bobY, 7, 7); // Blue pauldron
      ctx.fillRect(-6, -48 + bobY, 12, 4); // Leather belt harness
    } else if (hero === "tyris") {
      ctx.fillRect(-10, -50 + bobY, 20, 10); // Red mail bikini top
      ctx.fillStyle = "#eab308";
      ctx.fillRect(-2, -49 + bobY, 4, 4); // Gold brooch
    } else if (hero === "gilius") {
      ctx.fillStyle = colors.primary;
      ctx.fillRect(-11, -50 + bobY, 22, 22); // Green tunic
      ctx.fillStyle = "#78350f";
      ctx.fillRect(-11, -38 + bobY, 22, 5); // Brown broad belt with buckle
      ctx.fillStyle = "#eab308";
      ctx.fillRect(-3, -39 + bobY, 6, 7);
    }

    // 2. Legs / Boots
    ctx.fillStyle = hero === "ax" ? colors.primary : hero === "tyris" ? colors.skin : "#475569";
    const legOffset1 = isWalking ? Math.sin(tick * 0.25) * 8 : isRunning ? Math.sin(tick * 0.4) * 14 : 0;
    const legOffset2 = isWalking ? -Math.sin(tick * 0.25) * 8 : isRunning ? -Math.sin(tick * 0.4) * 14 : 0;

    if (!isRiding) {
      // Left leg
      ctx.fillRect(-8 + legOffset1 * 0.5, -28 + bobY, 7, 14);
      // Right leg
      ctx.fillRect(1 + legOffset2 * 0.5, -28 + bobY, 7, 14);

      // Boots
      ctx.fillStyle = hero === "tyris" ? "#dc2626" : "#78350f";
      ctx.fillRect(-9 + legOffset1 * 0.5, -14 + bobY, 9, 14);
      ctx.fillRect(0 + legOffset2 * 0.5, -14 + bobY, 9, 14);
    } else {
      // Riding legs hooked around saddle
      ctx.fillStyle = hero === "tyris" ? "#dc2626" : "#78350f";
      ctx.fillRect(-8, -28 + bobY, 16, 12);
    }

    // 3. Head & Hair / Helmet
    ctx.fillStyle = colors.skin;
    ctx.fillRect(-7, -68 + bobY, 14, 16);

    // Facial feature (Eyes, brows)
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(2, -64 + bobY, 3, 3);

    // Hair / Helmet
    if (hero === "ax") {
      ctx.fillStyle = colors.hair;
      ctx.fillRect(-8, -72 + bobY, 16, 7);
      ctx.fillRect(-9, -68 + bobY, 5, 10); // Barbarian mane
    } else if (hero === "tyris") {
      ctx.fillStyle = colors.hair;
      ctx.fillRect(-8, -72 + bobY, 16, 7);
      ctx.fillRect(-10, -68 + bobY, 6, 18); // Long brown hair blowing behind
    } else if (hero === "gilius") {
      // Horned Helmet
      ctx.fillStyle = colors.accent;
      ctx.fillRect(-9, -74 + bobY, 18, 9);
      // Horns
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(-13, -78 + bobY, 5, 6);
      ctx.fillRect(8, -78 + bobY, 5, 6);
      // White Beard
      ctx.fillStyle = colors.hair;
      ctx.fillRect(-7, -59 + bobY, 14, 14);
    }

    // 4. Arms & Weapons
    this.drawPlayerArmsAndWeapon(ctx, player, hero, colors, bobY, tick);

    // 5. Downward Plunge Impact FX
    if (isDownPlunge) {
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.arc(8, 0, 16, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private static drawPlayerArmsAndWeapon(
    ctx: CanvasRenderingContext2D,
    player: Entity,
    hero: HeroId,
    colors: { primary: string; skin: string; hair: string; weapon: string; accent: string },
    bobY: number,
    tick: number
  ) {
    const isAttacking = player.state.startsWith("attack") || player.state === "finisher" || player.state === "dash_attack";
    const isDownPlunge = player.state === "down_plunge";
    const isJumpAttack = player.state === "jump_attack";
    const isCasting = player.state === "casting_magic";

    ctx.save();
    ctx.fillStyle = colors.skin;

    // Custom weapon trail color if cosmetic
    const weaponColor = player.equippedCosmetics?.weapon ? "#fb923c" : colors.weapon;

    if (isCasting) {
      // Magic raise sword to the heavens
      ctx.fillRect(-2, -75 + bobY, 6, 20);
      this.drawWeapon(ctx, hero, 1, -95 + bobY, -Math.PI / 2, weaponColor);
    } else if (isDownPlunge) {
      // Sword plunging straight down
      ctx.fillRect(4, -40 + bobY, 6, 18);
      this.drawWeapon(ctx, hero, 7, -10 + bobY, Math.PI / 2, weaponColor);
    } else if (isJumpAttack) {
      // Aerial diagonal slash
      ctx.fillRect(6, -48 + bobY, 8, 8);
      this.drawWeapon(ctx, hero, 14, -45 + bobY, Math.PI / 4, weaponColor);
      this.drawSlashArc(ctx, 16, -42, 28, -Math.PI / 3, Math.PI / 2);
    } else if (player.state === "dash_attack") {
      // Shoulder charge / running dash thrust
      ctx.fillRect(10, -46 + bobY, 12, 8);
      this.drawWeapon(ctx, hero, 24, -45 + bobY, 0, weaponColor);
      this.drawSlashArc(ctx, 24, -45, 32, -0.4, 0.4);
    } else if (player.state === "finisher") {
      // Spartan kick / overhead launch
      ctx.fillRect(-4, -44 + bobY, 10, 8);
      // Extended kick leg
      ctx.fillStyle = hero === "tyris" ? "#dc2626" : "#78350f";
      ctx.fillRect(6, -34 + bobY, 22, 9);
      this.drawSlashArc(ctx, 24, -30, 24, -0.5, 0.5);
    } else if (player.state === "attack2") {
      // Upward backhand slash
      ctx.fillRect(8, -50 + bobY, 10, 8);
      this.drawWeapon(ctx, hero, 18, -60 + bobY, -Math.PI / 4, weaponColor);
      this.drawSlashArc(ctx, 18, -48, 30, -Math.PI / 2, 0.2);
    } else if (player.state === "attack1") {
      // Forward horizontal slash
      ctx.fillRect(8, -46 + bobY, 12, 8);
      this.drawWeapon(ctx, hero, 22, -45 + bobY, 0.1, weaponColor);
      this.drawSlashArc(ctx, 20, -45, 30, -0.8, 0.8);
    } else {
      // Idle / Walking arm position
      const armAngle = Math.sin(tick * 0.2) * 0.3;
      ctx.fillRect(-2, -48 + bobY, 7, 16);
      // Weapon sheathed or held at ready
      if (hero === "gilius") {
        this.drawWeapon(ctx, hero, 6, -40 + bobY, 0.4 + armAngle, weaponColor);
      } else {
        this.drawWeapon(ctx, hero, 8, -42 + bobY, -0.6 + armAngle, weaponColor);
      }
    }

    ctx.restore();
  }

  private static drawWeapon(
    ctx: CanvasRenderingContext2D,
    hero: HeroId,
    x: number,
    y: number,
    angle: number,
    color: string
  ) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    if (hero === "gilius") {
      // Double headed battleaxe
      ctx.fillStyle = "#78350f";
      ctx.fillRect(-2, -18, 4, 36); // Wooden shaft
      ctx.fillStyle = color;
      // Double axe blades
      ctx.beginPath();
      ctx.moveTo(-2, -14);
      ctx.lineTo(-14, -22);
      ctx.lineTo(-12, -6);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(2, -14);
      ctx.lineTo(14, -22);
      ctx.lineTo(12, -6);
      ctx.closePath();
      ctx.fill();
    } else {
      // Broadsword / Blade
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(-6, 0, 12, 3); // Crossguard
      ctx.fillStyle = "#78350f";
      ctx.fillRect(-2, 3, 4, 8); // Hilt
      ctx.fillStyle = "#eab308";
      ctx.fillRect(-3, 11, 6, 4); // Pommel

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.lineTo(-2, -34);
      ctx.lineTo(0, -38); // Point
      ctx.lineTo(2, -34);
      ctx.lineTo(3, 0);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  private static drawSlashArc(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number
  ) {
    ctx.save();
    ctx.strokeStyle = "rgba(254, 240, 138, 0.85)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, radius, startAngle, endAngle);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, radius - 2, startAngle, endAngle);
    ctx.stroke();
    ctx.restore();
  }

  // --- ENEMY SPRITE DRAWING ---
  private static drawEnemy(ctx: CanvasRenderingContext2D, enemy: Entity, tick: number) {
    const type = (enemy.subType as EnemyType) || "henning";
    const isKnocked = enemy.state === "knockdown" || enemy.state === "dead";
    const bob = Math.sin(tick * 0.2) * 2;

    if (isKnocked) {
      ctx.rotate(-Math.PI / 2 * enemy.facing);
      ctx.translate(-20, -10);
    }

    switch (type) {
      case "henning":
        // Club Thug
        ctx.fillStyle = "#78350f"; // Leather armor
        ctx.fillRect(-9, -46 + bob, 18, 22);
        ctx.fillStyle = "#f59e0b"; // Skin
        ctx.fillRect(-6, -60 + bob, 12, 14); // Bald head
        ctx.fillStyle = "#451a03"; // Pants
        ctx.fillRect(-8, -24 + bob, 7, 14);
        ctx.fillRect(1, -24 + bob, 7, 14);
        // Wooden Club
        ctx.fillStyle = "#92400e";
        if (enemy.state.startsWith("attack")) {
          ctx.fillRect(8, -45 + bob, 24, 7);
        } else {
          ctx.fillRect(8, -50 + bob, 6, 26);
        }
        break;

      case "longmoan":
        // Purple mace wielder
        ctx.fillStyle = "#7e22ce"; // Purple tunic
        ctx.fillRect(-10, -48 + bob, 20, 24);
        ctx.fillStyle = "#e2e8f0"; // Steel helmet
        ctx.fillRect(-7, -64 + bob, 14, 16);
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(-8, -24 + bob, 8, 14);
        ctx.fillRect(1, -24 + bob, 8, 14);
        // Spiked Mace
        ctx.fillStyle = "#64748b";
        ctx.fillRect(8, -48 + bob, 4, 24);
        ctx.beginPath();
        ctx.arc(10, -50 + bob, 6, 0, Math.PI * 2);
        ctx.fill();
        break;

      case "amazon":
        // Swift warrior
        ctx.fillStyle = "#059669"; // Emerald mail
        ctx.fillRect(-8, -46 + bob, 16, 20);
        ctx.fillStyle = "#f59e0b";
        ctx.fillRect(-5, -60 + bob, 10, 14);
        ctx.fillStyle = "#fbbf24"; // Blond ponytail
        ctx.fillRect(-9, -62 + bob, 5, 16);
        // Scimitar
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(6, -45 + bob, 18, 4);
        break;

      case "skeleton":
        // Undead skeleton soldier
        ctx.fillStyle = "#f1f5f9"; // Bone white ribcage
        ctx.fillRect(-7, -46 + bob, 14, 20);
        // Skull
        ctx.fillRect(-6, -60 + bob, 12, 14);
        ctx.fillStyle = "#0f172a"; // Eye sockets
        ctx.fillRect(-3, -56 + bob, 3, 3);
        ctx.fillRect(2, -56 + bob, 3, 3);
        // Bone legs
        ctx.fillStyle = "#e2e8f0";
        ctx.fillRect(-5, -26 + bob, 4, 16);
        ctx.fillRect(2, -26 + bob, 4, 16);
        // Round Steel Shield
        ctx.fillStyle = "#475569";
        ctx.beginPath();
        ctx.arc(-8, -38 + bob, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#eab308";
        ctx.beginPath();
        ctx.arc(-8, -38 + bob, 4, 0, Math.PI * 2);
        ctx.fill();
        // Curved Bone Scimitar
        ctx.fillStyle = "#94a3b8";
        ctx.fillRect(6, -42 + bob, 18, 5);
        break;

      case "bad_brother":
        // Massive hammer giant
        ctx.scale(1.35, 1.35);
        ctx.fillStyle = "#b45309"; // Giant tanned bulk
        ctx.fillRect(-14, -54 + bob, 28, 30);
        ctx.fillStyle = "#f59e0b";
        ctx.fillRect(-10, -70 + bob, 20, 18);
        ctx.fillStyle = "#334155";
        ctx.fillRect(-12, -24 + bob, 11, 16);
        ctx.fillRect(2, -24 + bob, 11, 16);
        // Massive War Hammer
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(10, -58 + bob, 6, 40);
        ctx.fillStyle = "#64748b";
        ctx.fillRect(6, -72 + bob, 16, 18);
        break;

      case "death_adder":
        // Final Boss: Death Adder!
        ctx.scale(1.5, 1.5);
        // Dark iron horned armor
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(-16, -60 + bob, 32, 34);
        // Pauldrons with menacing spikes
        ctx.fillStyle = "#334155";
        ctx.fillRect(-22, -64 + bob, 10, 14);
        ctx.fillRect(12, -64 + bob, 10, 14);
        // Menacing horned helm with glowing red slit eyes
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(-10, -76 + bob, 20, 18);
        ctx.fillStyle = "#dc2626";
        ctx.fillRect(-5, -70 + bob, 4, 3);
        ctx.fillRect(3, -70 + bob, 4, 3);
        // Horns
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(-16, -82 + bob, 6, 10);
        ctx.fillRect(10, -82 + bob, 6, 10);
        // THE GOLDEN AXE!
        ctx.fillStyle = "#78350f";
        ctx.fillRect(14, -68 + bob, 6, 52); // Long haft
        ctx.fillStyle = "#eab308"; // Pure gold blade!
        ctx.beginPath();
        ctx.moveTo(14, -65 + bob);
        ctx.lineTo(34, -76 + bob);
        ctx.lineTo(30, -50 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(14, -65 + bob);
        ctx.lineTo(-4, -76 + bob);
        ctx.lineTo(0, -50 + bob);
        ctx.closePath();
        ctx.fill();
        break;
    }
  }

  // --- MOUNT SPRITE DRAWING ---
  private static drawMount(ctx: CanvasRenderingContext2D, mount: Entity, tick: number) {
    const type = (mount.subType as MountType) || "chicken_leg";
    const walkBob = mount.vx !== 0 ? Math.sin(tick * 0.3) * 3 : 0;

    if (type === "chicken_leg") {
      // Cockatrice / Chicken-Leg: Pink/Purple bipedal beast
      ctx.fillStyle = "#db2777"; // Magenta body
      ctx.beginPath();
      ctx.ellipse(0, -26 + walkBob, 22, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // Long Bipedal reptilian legs
      ctx.fillStyle = "#eab308";
      ctx.fillRect(-8, -14, 6, 16);
      ctx.fillRect(4, -14, 6, 16);

      // Bird-like beak & eye
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(18, -32 + walkBob, 10, 8);
      ctx.fillStyle = "#000";
      ctx.fillRect(14, -34 + walkBob, 3, 3);

      // Tail Whip
      ctx.strokeStyle = "#be185d";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-18, -26 + walkBob);
      const tailAngle = mount.state === "attack1" ? Math.sin(tick * 0.6) * 25 : Math.sin(tick * 0.2) * 10;
      ctx.quadraticCurveTo(-35, -25 + tailAngle, -45, -20 + tailAngle);
      ctx.stroke();

      // Saddle
      ctx.fillStyle = "#78350f";
      ctx.fillRect(-6, -38 + walkBob, 12, 6);
    } else {
      // Fire Dragon
      ctx.fillStyle = "#dc2626"; // Crimson scaled dragon
      ctx.beginPath();
      ctx.ellipse(0, -24 + walkBob, 26, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dragon Head
      ctx.fillRect(18, -36 + walkBob, 18, 14);
      // Horns / Spines
      ctx.fillStyle = "#eab308";
      ctx.fillRect(16, -42 + walkBob, 5, 8);
      ctx.fillStyle = "#000";
      ctx.fillRect(26, -34 + walkBob, 3, 3);

      // Dragon Legs
      ctx.fillStyle = "#991b1b";
      ctx.fillRect(-14, -12, 8, 14);
      ctx.fillRect(8, -12, 8, 14);

      // Saddle
      ctx.fillStyle = "#451a03";
      ctx.fillRect(-6, -36 + walkBob, 14, 6);
    }
  }

  // --- GNOME (THIEF) SPRITE DRAWING ---
  private static drawGnome(ctx: CanvasRenderingContext2D, gnome: Entity, tick: number) {
    const isMagic = gnome.subType !== "meat";
    const color = isMagic ? "#3b82f6" : "#22c55e"; // Blue magic gnome or Green meat gnome
    const runWaddle = Math.sin(tick * 0.4) * 3;

    // Pointy Hat
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-10, -32 + runWaddle);
    ctx.lineTo(0, -52 + runWaddle);
    ctx.lineTo(10, -32 + runWaddle);
    ctx.closePath();
    ctx.fill();

    // Round Face
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(-6, -32 + runWaddle, 12, 10);

    // Tunic Body
    ctx.fillStyle = color;
    ctx.fillRect(-8, -22 + runWaddle, 16, 14);

    // Tiny legs
    ctx.fillStyle = "#78350f";
    ctx.fillRect(-6, -8, 5, 8);
    ctx.fillRect(2, -8, 5, 8);

    // Burlap Sack on Back full of loot!
    ctx.fillStyle = isMagic ? "#60a5fa" : "#86efac";
    ctx.beginPath();
    ctx.ellipse(-14, -20 + runWaddle, 9, 12, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#94a3b8"; // String tie
    ctx.fillRect(-16, -28 + runWaddle, 6, 2);
  }

  // --- POTION PICKUP ---
  private static drawPotion(ctx: CanvasRenderingContext2D, tick: number) {
    const floatY = Math.sin(tick * 0.1) * 3;
    // Glowing aura
    ctx.fillStyle = "rgba(59, 130, 246, 0.4)";
    ctx.beginPath();
    ctx.arc(0, -12 + floatY, 14, 0, Math.PI * 2);
    ctx.fill();

    // Glass Flask
    ctx.fillStyle = "#3b82f6";
    ctx.beginPath();
    ctx.ellipse(0, -10 + floatY, 8, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Flask Neck & Cork
    ctx.fillStyle = "#93c5fd";
    ctx.fillRect(-3, -22 + floatY, 6, 6);
    ctx.fillStyle = "#b45309";
    ctx.fillRect(-4, -26 + floatY, 8, 4);
  }

  // --- MEAT PICKUP ---
  private static drawMeat(ctx: CanvasRenderingContext2D, tick: number) {
    const floatY = Math.sin(tick * 0.1) * 3;
    // Roasted meat on bone
    ctx.fillStyle = "rgba(234, 179, 8, 0.4)";
    ctx.beginPath();
    ctx.arc(0, -10 + floatY, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#9a3412"; // Roasted chunk
    ctx.beginPath();
    ctx.ellipse(0, -10 + floatY, 11, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // White Bone ends
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(-16, -12 + floatY, 6, 4);
    ctx.fillRect(10, -12 + floatY, 6, 4);
  }

  // --- PROJECTILES (FIREBALL / MAGIC BOLTS) ---
  private static drawProjectile(ctx: CanvasRenderingContext2D, proj: Entity, tick: number) {
    // Roaring Fireball
    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fef08a";
    ctx.beginPath();
    ctx.arc(2, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    // Flame tail
    ctx.fillStyle = "rgba(239, 68, 68, 0.6)";
    ctx.beginPath();
    ctx.moveTo(-6, -8);
    ctx.lineTo(-20 + Math.sin(tick * 0.5) * 6, 0);
    ctx.lineTo(-6, 8);
    ctx.closePath();
    ctx.fill();
  }

  // --- PARTICLES ---
  public static drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[], cameraX: number) {
    for (const p of particles) {
      const alpha = p.life / p.maxLife;
      const screenX = Math.round(p.x - cameraX);
      const screenY = Math.round(p.y - p.z);

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.fillStyle = p.color;

      if (p.shape === "text" && p.text) {
        ctx.font = "bold 12px 'Press Start 2P', monospace";
        ctx.fillText(p.text, screenX, screenY);
      } else if (p.shape === "spark") {
        ctx.fillRect(screenX - p.size / 2, screenY - p.size / 2, p.size, p.size);
      } else if (p.shape === "ring") {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screenX, screenY, p.size * (1 - alpha), 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }
}
