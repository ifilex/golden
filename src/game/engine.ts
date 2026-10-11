/**
 * Golden Axe Arcade Core Gameplay Engine
 * Implements 2.5D beat-'em-up physics, combat combos, mounts, magic, waves, AI, and co-op.
 */

import {
  Entity,
  HeroId,
  HeroConfig,
  EnemyType,
  MountType,
  Particle,
  MagicCastEffect,
  StageConfig,
  GameSettings,
  ActionState,
} from "../types/game";
import { soundEngine } from "../audio/soundEngine";

export const HEROES: Record<HeroId, HeroConfig> = {
  ax: {
    id: "ax",
    name: "Ax Battler",
    title: "The Barbarian",
    maxHealth: 100,
    maxMagicPots: 4,
    speed: 3.5,
    attackPower: 18,
    reach: 48,
    magicElement: "Earth",
    magicName: "Earth Tremor",
    color: "#2563eb",
    accentColor: "#f59e0b",
    description: "Balanced warrior wielding a mighty broadsword. Commands the fury of the earth.",
  },
  tyris: {
    id: "tyris",
    name: "Tyris Flare",
    title: "The Amazon",
    maxHealth: 90,
    maxMagicPots: 6,
    speed: 4.0,
    attackPower: 16,
    reach: 44,
    magicElement: "Fire",
    magicName: "Fire Dragon",
    color: "#dc2626",
    accentColor: "#f59e0b",
    description: "Swift and lethal swordswoman. Commands terrifying high-tier dragon fire magic.",
  },
  gilius: {
    id: "gilius",
    name: "Gilius Thunderhead",
    title: "The Dwarf",
    maxHealth: 110,
    maxMagicPots: 3,
    speed: 3.2,
    attackPower: 22,
    reach: 42,
    magicElement: "Lightning",
    magicName: "Thunderbolt",
    color: "#15803d",
    accentColor: "#eab308",
    description: "Tough mountain dwarf with a heavy battleaxe. Devastating close-range combat and lightning magic.",
  },
};

export const STAGES: StageConfig[] = [
  {
    id: 1,
    name: "Stage 1: Woodland Outskirts",
    subtitle: "The march toward Turtle Village begins...",
    backgroundTheme: "forest",
    length: 2600,
    waves: [
      {
        triggerX: 200,
        enemies: [{ type: "henning", count: 2 }],
        gnomes: [{ type: "magic", count: 1 }],
      },
      {
        triggerX: 750,
        enemies: [
          { type: "henning", count: 2 },
          { type: "longmoan", count: 1, mount: "chicken_leg" },
        ],
      },
      {
        triggerX: 1400,
        enemies: [
          { type: "henning", count: 3 },
          { type: "longmoan", count: 2 },
        ],
        gnomes: [{ type: "magic", count: 2 }, { type: "meat", count: 1 }],
      },
      {
        triggerX: 2050,
        enemies: [
          { type: "bad_brother", count: 1 },
          { type: "henning", count: 2 },
        ],
      },
    ],
  },
  {
    id: 2,
    name: "Stage 2: Turtle Village",
    subtitle: "A civilization built atop the colossal turtle...",
    backgroundTheme: "turtle",
    length: 2800,
    waves: [
      {
        triggerX: 250,
        enemies: [
          { type: "amazon", count: 2 },
          { type: "henning", count: 2 },
        ],
      },
      {
        triggerX: 950,
        enemies: [
          { type: "longmoan", count: 2 },
          { type: "amazon", count: 2, mount: "fire_dragon" },
        ],
        gnomes: [{ type: "magic", count: 2 }],
      },
      {
        triggerX: 1650,
        enemies: [
          { type: "skeleton", count: 2 },
          { type: "amazon", count: 2 },
        ],
        gnomes: [{ type: "meat", count: 1 }],
      },
      {
        triggerX: 2300,
        enemies: [
          { type: "bad_brother", count: 2 },
          { type: "skeleton", count: 2 },
        ],
      },
    ],
  },
  {
    id: 3,
    name: "Stage 3: Across the Sea on the Great Eagle",
    subtitle: "High aloft the clouds toward Death Adder's sanctuary...",
    backgroundTheme: "eagle",
    length: 2800,
    waves: [
      {
        triggerX: 300,
        enemies: [
          { type: "skeleton", count: 3 },
        ],
        gnomes: [{ type: "magic", count: 2 }],
      },
      {
        triggerX: 1100,
        enemies: [
          { type: "amazon", count: 2 },
          { type: "skeleton", count: 2, mount: "chicken_leg" },
        ],
      },
      {
        triggerX: 1800,
        enemies: [
          { type: "bad_brother", count: 1 },
          { type: "skeleton", count: 3 },
        ],
        gnomes: [{ type: "magic", count: 2 }, { type: "meat", count: 1 }],
      },
      {
        triggerX: 2400,
        enemies: [
          { type: "bad_brother", count: 2 },
          { type: "skeleton", count: 2 },
        ],
      },
    ],
  },
  {
    id: 4,
    name: "Stage 4: Death Adder's Fortress",
    subtitle: "The final bastion of the dark overlord...",
    backgroundTheme: "castle",
    length: 3000,
    waves: [
      {
        triggerX: 300,
        enemies: [
          { type: "skeleton", count: 4 },
          { type: "bad_brother", count: 1 },
        ],
      },
      {
        triggerX: 1200,
        enemies: [
          { type: "amazon", count: 3, mount: "fire_dragon" },
          { type: "skeleton", count: 2 },
        ],
        gnomes: [{ type: "magic", count: 3 }, { type: "meat", count: 1 }],
      },
      {
        triggerX: 2000,
        enemies: [
          { type: "bad_brother", count: 2 },
          { type: "skeleton", count: 3 },
        ],
      },
      {
        triggerX: 2600,
        enemies: [
          { type: "death_adder", count: 1 },
          { type: "skeleton", count: 2 },
        ],
      },
    ],
  },
];

export class GameEngine {
  public entities: Entity[] = [];
  public particles: Particle[] = [];
  public cameraX: number = 0;
  public currentStageIndex: number = 0;
  public currentWaveIndex: number = 0;
  public waveInProgress: boolean = false;
  public stageClear: boolean = false;
  public gameOver: boolean = false;
  public victory: boolean = false;
  public inBonusCamp: boolean = false;
  public bonusTimer: number = 0;

  public magicCast: MagicCastEffect = {
    active: false,
    heroId: "ax",
    level: 1,
    timer: 0,
    maxTimer: 1.5,
    damageDealt: false,
  };

  public score: number = 0;
  public kills: number = 0;
  public goldEarned: number = 0;
  public isCoop: boolean = false;
  public settings: GameSettings;
  public tick: number = 0;

  // Screen shake
  public screenShakeTimer: number = 0;
  public screenShakeIntensity: number = 0;

  // Callbacks
  public onAchievementUnlock?: (id: string, title: string) => void;
  public onGameOver?: (finalScore: number, stage: number, kills: number) => void;

  constructor(settings: GameSettings) {
    this.settings = settings;
  }

  public initGame(heroP1: HeroId, heroP2?: HeroId, startingCosmetics?: { p1?: any; p2?: any }) {
    this.entities = [];
    this.particles = [];
    this.cameraX = 0;
    this.currentStageIndex = 0;
    this.currentWaveIndex = 0;
    this.waveInProgress = false;
    this.stageClear = false;
    this.gameOver = false;
    this.victory = false;
    this.inBonusCamp = false;
    this.score = 0;
    this.kills = 0;
    this.goldEarned = 0;
    this.isCoop = Boolean(heroP2);

    // Spawn Player 1
    const p1Config = HEROES[heroP1];
    const p1: Entity = {
      id: "player_1",
      type: "player",
      playerIndex: 1,
      heroId: heroP1,
      x: 100,
      y: 280,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      facing: 1,
      health: p1Config.maxHealth,
      maxHealth: p1Config.maxHealth,
      magicPots: 1,
      lives: 3,
      state: "idle",
      stateTimer: 0,
      animFrame: 0,
      animTimer: 0,
      isGrounded: true,
      invulnerableTimer: 0,
      comboStep: 0,
      comboResetTimer: 0,
      width: 36,
      height: 60,
      equippedCosmetics: startingCosmetics?.p1 || {},
    };
    this.entities.push(p1);

    // Spawn Player 2 if co-op
    if (heroP2) {
      const p2Config = HEROES[heroP2];
      const p2: Entity = {
        id: "player_2",
        type: "player",
        playerIndex: 2,
        heroId: heroP2,
        x: 80,
        y: 330,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        facing: 1,
        health: p2Config.maxHealth,
        maxHealth: p2Config.maxHealth,
        magicPots: 1,
        lives: 3,
        state: "idle",
        stateTimer: 0,
        animFrame: 0,
        animTimer: 0,
        isGrounded: true,
        invulnerableTimer: 0,
        comboStep: 0,
        comboResetTimer: 0,
        width: 36,
        height: 60,
        equippedCosmetics: startingCosmetics?.p2 || {},
      };
      this.entities.push(p2);
    }

    this.startStage(0);
  }

  public startStage(stageIdx: number) {
    this.currentStageIndex = stageIdx;
    this.currentWaveIndex = 0;
    this.stageClear = false;
    this.waveInProgress = false;

    // Reposition living players at left edge of stage
    const players = this.getPlayers();
    players.forEach((p, idx) => {
      p.x = this.cameraX + 80 + idx * 30;
      p.y = 280 + idx * 40;
      p.z = 0;
      p.state = "idle";
      p.stateTimer = 0;
    });

    const stage = STAGES[stageIdx];
    if (stage) {
      const track = stage.id === 4 ? "death_adder" : stage.id === 2 ? "turtle" : stage.id === 3 ? "battle" : "wilderness";
      soundEngine.playMusic(track);
    }
  }

  public update(dt: number) {
    this.tick++;

    // Magic cast freeze / damage sequence
    if (this.magicCast.active) {
      this.updateMagicCast(dt);
      return; // Freeze entities during screen-clearing magic spectacle!
    }

    // Screen shake damping
    if (this.screenShakeTimer > 0) {
      this.screenShakeTimer -= dt;
      if (this.screenShakeTimer <= 0) this.screenShakeIntensity = 0;
    }

    // Campfire bonus stage loop
    if (this.inBonusCamp) {
      this.updateCampfire(dt);
      return;
    }

    // Check wave triggers
    this.checkWaves();

    // Update all entities
    for (const entity of this.entities) {
      this.updateEntity(entity, dt);
    }

    // Clean up dead non-player entities
    this.entities = this.entities.filter(e => {
      if (e.type === "player") return true; // Keep players even if 0 lives for Game Over logic
      if (e.state === "dead" && e.stateTimer > 1.8) return false;
      return true;
    });

    // Update particles
    this.updateParticles(dt);

    // Camera follow players
    this.updateCamera();

    // Check game over or stage clear
    this.checkGameState();
  }

  private updateEntity(entity: Entity, dt: number) {
    entity.stateTimer += dt;
    entity.animTimer += dt;
    if (entity.invulnerableTimer > 0) entity.invulnerableTimer -= dt;
    if (entity.attackCooldown !== undefined && entity.attackCooldown > 0) {
      entity.attackCooldown -= dt;
    }
    if (entity.comboResetTimer > 0) {
      entity.comboResetTimer -= dt;
      if (entity.comboResetTimer <= 0) entity.comboStep = 0;
    }

    // Mount attachment sync
    if (entity.mountedOnId) {
      const mount = this.entities.find(e => e.id === entity.mountedOnId);
      if (mount && mount.health > 0) {
        entity.x = mount.x;
        entity.y = mount.y;
        entity.z = mount.z + 10;
        entity.facing = mount.facing;
      } else {
        entity.mountedOnId = undefined;
      }
    }

    // Gravity and jumping physics
    if (!entity.isGrounded && !entity.mountedOnId) {
      entity.vz -= 38 * dt; // Gravity
      entity.z += entity.vz;
      if (entity.z <= 0) {
        entity.z = 0;
        entity.vz = 0;
        entity.isGrounded = true;

        if (entity.state === "down_plunge") {
          // Down plunge ground impact!
          soundEngine.playDownPlunge();
          this.triggerScreenShake(0.3, 7);
          this.spawnImpactDust(entity.x, entity.y);
          this.dealPlungeAoeDamage(entity);
          entity.state = "idle";
          entity.stateTimer = 0;
        } else if (entity.state === "jump" || entity.state === "jump_attack") {
          entity.state = "idle";
          entity.stateTimer = 0;
        }
      }
    }

    // Active attack collision window check for enemies and bosses
    if (
      (entity.type === "enemy" || entity.type === "boss") &&
      entity.state.startsWith("attack") &&
      !entity.hasHitInCurrentAttack &&
      entity.stateTimer >= 0.12 &&
      entity.stateTimer <= 0.28
    ) {
      this.checkEnemyAttackHit(entity);
    }

    // Action state timer transitions
    if (entity.state.startsWith("attack") || entity.state === "finisher" || entity.state === "dash_attack") {
      const attackDuration = entity.state === "finisher" ? 0.35 : 0.3;
      if (entity.stateTimer >= attackDuration) {
        entity.state = "idle";
        entity.stateTimer = 0;
      }
    } else if (entity.state === "hurt" && entity.stateTimer > 0.32) {
      entity.state = "idle";
      entity.stateTimer = 0;
    } else if (entity.state === "knockdown" && entity.stateTimer > 1.1) {
      if (entity.health <= 0) {
        if (entity.type === "player" && (entity.lives || 0) > 0) {
          // Player Respawn! Drop in from sky with full health & shield
          entity.lives!--;
          entity.health = entity.maxHealth;
          entity.z = 180;
          entity.vz = -3;
          entity.isGrounded = false;
          entity.invulnerableTimer = 3.0;
          entity.state = "jump";
          entity.stateTimer = 0;
          this.spawnScoreText(entity.x, entity.y - 60, "RESPAWN!", "#38bdf8");
          soundEngine.playJump();
        } else {
          entity.state = "dead";
        }
      } else {
        entity.state = "get_up";
        entity.stateTimer = 0;
        entity.invulnerableTimer = 0.9;
      }
    } else if (entity.state === "get_up" && entity.stateTimer > 0.35) {
      entity.state = "idle";
      entity.stateTimer = 0;
    }

    // Ground movement bounds
    if (entity.mountedOnId) return;

    entity.x += entity.vx * (entity.state === "run" ? 1.75 : 1);
    entity.y += entity.vy;

    // Clamp Y to playable 2.5D floor corridor
    if (entity.y < 230) entity.y = 230;
    if (entity.y > 425) entity.y = 425;

    // Clamp X to camera bounds for players
    if (entity.type === "player") {
      const minX = this.cameraX + 25;
      const maxX = this.cameraX + 780;
      if (entity.x < minX) entity.x = minX;
      if (entity.x > maxX) entity.x = maxX;
    }

    // AI and Projectile updates
    if (entity.type === "enemy" || entity.type === "boss") {
      this.updateEnemyAI(entity, dt);
    } else if (entity.type === "gnome") {
      this.updateGnomeAI(entity, dt);
    } else if (entity.type === "projectile") {
      this.updateProjectile(entity, dt);
    }
  }

  // --- ENEMY AI ---
  private static readonly ENEMY_SPEEDS: Record<EnemyType, number> = {
    henning: 1.9,
    longmoan: 2.2,
    amazon: 2.8,
    skeleton: 2.5,
    bad_brother: 1.7,
    death_adder: 2.4,
  };

  private updateEnemyAI(enemy: Entity, _dt: number) {
    if (enemy.state === "dead" || enemy.state === "knockdown" || enemy.state === "hurt") {
      enemy.vx = 0;
      enemy.vy = 0;
      return;
    }

    if (enemy.state.startsWith("attack") || enemy.state === "get_up") {
      enemy.vx = 0;
      enemy.vy = 0;
      return;
    }

    const players = this.getLivingPlayers();
    if (players.length === 0) {
      enemy.vx = 0;
      enemy.vy = 0;
      enemy.state = "idle";
      return;
    }

    // Target nearest living player
    let nearestPlayer = players[0];
    let minDist = Infinity;
    for (const p of players) {
      const dist = Math.hypot(p.x - enemy.x, p.y - enemy.y);
      if (dist < minDist) {
        minDist = dist;
        nearestPlayer = p;
      }
    }

    // Flank slot calculation so multiple enemies encircle player
    const hash = enemy.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const flankSide = (hash % 2 === 0) ? 1 : -1;
    const targetSlotX = nearestPlayer.x + flankSide * 42;
    const targetSlotY = nearestPlayer.y + ((hash % 3) - 1) * 9;

    const dx = nearestPlayer.x - enemy.x;
    const dy = nearestPlayer.y - enemy.y;
    const slotDx = targetSlotX - enemy.x;
    const slotDy = targetSlotY - enemy.y;

    enemy.facing = dx >= 0 ? 1 : -1;

    const isHeavy = enemy.subType === "bad_brother" || enemy.subType === "death_adder";
    const attackReach = enemy.subType === "death_adder" ? 92 : enemy.subType === "bad_brother" ? 82 : 56;
    const depthReach = 24;

    const inRange = Math.abs(dx) <= attackReach && Math.abs(dy) <= depthReach;

    if (inRange) {
      enemy.vx = 0;
      enemy.vy = 0;
      if (enemy.state === "walk") {
        enemy.state = "idle";
        enemy.stateTimer = 0;
      }

      // Attack if cooldown ready
      if ((enemy.attackCooldown || 0) <= 0) {
        this.enemyPerformAttack(enemy, nearestPlayer);
      }
    } else {
      // Approach target slot
      const baseSpeed = GameEngine.ENEMY_SPEEDS[enemy.subType as EnemyType] || 1.9;
      const speedMult = this.settings.difficulty === "hardcore" ? 1.3 : this.settings.difficulty === "novice" ? 0.75 : 1.0;
      const speed = baseSpeed * speedMult;

      const angle = Math.atan2(slotDy, slotDx);
      enemy.vx = Math.cos(angle) * speed;
      enemy.vy = Math.sin(angle) * speed * 0.75;
      enemy.state = "walk";

      // Boss Death Adder ranged dark flame wave
      if (enemy.subType === "death_adder" && Math.abs(dx) > 170 && Math.abs(dy) < 32 && (enemy.attackCooldown || 0) <= 0) {
        this.enemyPerformRangedAttack(enemy);
      }
    }
  }

  private enemyPerformAttack(enemy: Entity, _target: Entity) {
    enemy.state = "attack1";
    enemy.stateTimer = 0;
    enemy.hasHitInCurrentAttack = false;

    const isHeavy = enemy.subType === "bad_brother" || enemy.subType === "death_adder";
    soundEngine.playSwordSwing(isHeavy);

    // Dynamic attack cooldown
    const baseCd = isHeavy ? 1.4 : enemy.subType === "amazon" ? 0.75 : 1.0;
    const cdMult = this.settings.difficulty === "hardcore" ? 0.65 : this.settings.difficulty === "novice" ? 1.4 : 1.0;
    enemy.attackCooldown = baseCd * cdMult;
  }

  private enemyPerformRangedAttack(enemy: Entity) {
    enemy.state = "attack1";
    enemy.stateTimer = 0;
    enemy.hasHitInCurrentAttack = true;
    enemy.attackCooldown = 3.2;
    soundEngine.playMagicCast("Fire", 1);

    const proj: Entity = {
      id: "dark_proj_" + Date.now() + "_" + Math.random(),
      type: "projectile",
      x: enemy.x + enemy.facing * 35,
      y: enemy.y - 10,
      z: 15,
      vx: enemy.facing * 6.5,
      vy: 0,
      vz: 0,
      facing: enemy.facing,
      health: 1,
      maxHealth: 1,
      state: "idle",
      stateTimer: 0,
      animFrame: 0,
      animTimer: 0,
      isGrounded: true,
      invulnerableTimer: 0,
      comboStep: 0,
      comboResetTimer: 0,
      width: 22,
      height: 22,
    };
    this.entities.push(proj);
  }

  private checkEnemyAttackHit(enemy: Entity) {
    const isHeavy = enemy.subType === "bad_brother" || enemy.subType === "death_adder";
    const reach = enemy.subType === "death_adder" ? 95 : enemy.subType === "bad_brother" ? 85 : 58;
    const depthTolerance = 26;

    const targets = this.getLivingPlayers();
    for (const player of targets) {
      if (player.invulnerableTimer > 0) continue;

      const distX = player.x - enemy.x;
      const distY = Math.abs(player.y - enemy.y);
      const inFront = distX * enemy.facing >= -12;

      if (inFront && Math.abs(distX) <= reach && distY <= depthTolerance) {
        enemy.hasHitInCurrentAttack = true;

        let dmg = 12;
        if (enemy.subType === "henning") dmg = 14;
        else if (enemy.subType === "longmoan") dmg = 18;
        else if (enemy.subType === "amazon") dmg = 16;
        else if (enemy.subType === "skeleton") dmg = 22;
        else if (enemy.subType === "bad_brother") dmg = 36;
        else if (enemy.subType === "death_adder") dmg = 48;

        if (this.settings.difficulty === "hardcore") dmg = Math.round(dmg * 1.35);
        if (this.settings.difficulty === "novice") dmg = Math.round(dmg * 0.75);

        const knockdown = isHeavy || Math.random() < 0.35;
        this.damageEntity(player, dmg, enemy.facing, knockdown, enemy);

        if (isHeavy) {
          this.triggerScreenShake(0.35, 8);
          this.spawnImpactDust(player.x, player.y);
        }
        break;
      }
    }
  }

  private updateProjectile(projectile: Entity, _dt: number) {
    projectile.x += projectile.vx;

    // Check hit against living characters
    for (const ent of this.entities) {
      if (ent.id === projectile.id || ent.type === "projectile" || ent.health <= 0) continue;
      if (ent.invulnerableTimer > 0) continue;

      const distX = Math.abs(ent.x - projectile.x);
      const distY = Math.abs(ent.y - projectile.y);
      if (distX <= 28 && distY <= 22) {
        projectile.health = 0;
        projectile.state = "dead";
        this.damageEntity(ent, 38, projectile.facing, true);
        this.spawnHitSparks(projectile.x, projectile.y, true);
        soundEngine.playHit(true);
        break;
      }
    }

    // Remove if off-screen or lived too long
    if (
      projectile.x < this.cameraX - 120 ||
      projectile.x > this.cameraX + 920 ||
      projectile.stateTimer > 3.0
    ) {
      projectile.health = 0;
      projectile.state = "dead";
    }
  }

  // --- GNOME (THIEF) AI ---
  private updateGnomeAI(gnome: Entity, _dt: number) {
    if (gnome.state === "dead" || gnome.state === "hurt") {
      gnome.vx = 0;
      gnome.vy = 0;
      return;
    }

    // Run away from nearest player in panic
    const players = this.getLivingPlayers();
    if (players.length > 0) {
      const p = players[0];
      const dx = gnome.x - p.x;
      const dy = gnome.y - p.y;
      gnome.facing = dx >= 0 ? 1 : -1;
      gnome.vx = (dx >= 0 ? 1 : -1) * 3.8;
      gnome.vy = (Math.sin(this.tick * 0.1) * 1.5);
      gnome.state = "run";

      // If escaped far off screen, remove
      if (gnome.x < this.cameraX - 100 || gnome.x > this.cameraX + 900) {
        gnome.health = 0;
        gnome.state = "dead";
      }
    }
  }

  // --- PLAYER CONTROLS & COMBAT DISPATCHER ---
  public handlePlayerInput(
    playerIndex: 1 | 2,
    inputs: {
      dx: number;
      dy: number;
      attack: boolean;
      jump: boolean;
      magic: boolean;
      dash: boolean;
    }
  ) {
    const player = this.entities.find(e => e.type === "player" && e.playerIndex === playerIndex);
    if (!player || player.health <= 0 || player.state === "dead" || player.state === "knockdown" || player.state === "hurt") {
      return;
    }

    const heroConfig = HEROES[player.heroId || "ax"];

    // 1. Magic Cast Trigger
    if (inputs.magic && (player.magicPots || 0) > 0 && player.isGrounded && !player.mountedOnId) {
      this.triggerMagicCast(player);
      return;
    }

    // 2. Mount / Dismount Interaction
    if (inputs.jump && player.mountedOnId) {
      // Dismount!
      this.dismount(player);
      return;
    }

    // 3. Jump Trigger
    if (inputs.jump && player.isGrounded && !player.mountedOnId) {
      player.isGrounded = false;
      player.vz = 11.5;
      player.state = "jump";
      player.stateTimer = 0;
      soundEngine.playJump();
      return;
    }

    // 4. In-Air Attacks: Down Plunge vs Jump Slash
    if (!player.isGrounded && inputs.attack && player.state !== "down_plunge") {
      if (inputs.dy > 0.4) {
        // Down Plunge (Down + Attack)
        player.state = "down_plunge";
        player.stateTimer = 0;
        player.vz = -18; // Accelerate downward fast!
        soundEngine.playSwordSwing(true);
      } else {
        // Jump slash
        player.state = "jump_attack";
        player.stateTimer = 0;
        soundEngine.playSwordSwing(false);
        this.executePlayerAttack(player, "jump_attack");
      }
      return;
    }

    // 5. Ground Attacks & Combos
    if (inputs.attack && player.isGrounded && !player.state.startsWith("attack") && player.state !== "finisher" && player.state !== "dash_attack") {
      if (player.mountedOnId) {
        // Mount attack!
        this.executeMountAttack(player);
        return;
      }

      if (player.state === "run" || inputs.dash) {
        // Dash / Running attack!
        player.state = "dash_attack";
        player.stateTimer = 0;
        player.vx = player.facing * 7;
        soundEngine.playSwordSwing(true);
        this.executePlayerAttack(player, "dash_attack");
        return;
      }

      // Combo Chain (Attack 1 -> Attack 2 -> Finisher)
      if (player.comboStep === 0) {
        player.state = "attack1";
        player.comboStep = 1;
        player.comboResetTimer = 0.6;
        soundEngine.playSwordSwing(false);
        this.executePlayerAttack(player, "attack1");
      } else if (player.comboStep === 1) {
        player.state = "attack2";
        player.comboStep = 2;
        player.comboResetTimer = 0.6;
        soundEngine.playSwordSwing(false);
        this.executePlayerAttack(player, "attack2");
      } else {
        player.state = "finisher";
        player.comboStep = 0;
        player.comboResetTimer = 0;
        soundEngine.playSwordSwing(true);
        this.executePlayerAttack(player, "finisher");
      }
      player.stateTimer = 0;
      return;
    }

    // 6. Movement & Walking / Running
    if (player.state.startsWith("attack") || player.state === "finisher" || player.state === "dash_attack" || player.state === "down_plunge") {
      // Rooted or decelerating during attacks
      player.vx *= 0.85;
      player.vy *= 0.85;
      return;
    }

    // Set Facing
    if (inputs.dx !== 0) {
      player.facing = inputs.dx > 0 ? 1 : -1;
    }

    const moveSpeed = heroConfig.speed * (inputs.dash ? 1.75 : 1.0);
    player.vx = inputs.dx * moveSpeed;
    player.vy = inputs.dy * (moveSpeed * 0.7);

    if (inputs.dx !== 0 || inputs.dy !== 0) {
      player.state = inputs.dash ? "run" : "walk";
      // Check if walking over an empty mount to mount it!
      this.checkMountRide(player);
    } else {
      player.state = "idle";
    }
  }

  // --- ATTACK EXECUTION & HIT DETECTION ---
  private executePlayerAttack(player: Entity, attackType: ActionState) {
    const heroConfig = HEROES[player.heroId || "ax"];
    const reach = heroConfig.reach + (attackType === "dash_attack" ? 18 : 0);
    const isHeavy = attackType === "finisher" || attackType === "dash_attack" || attackType === "down_plunge";

    // Find targets within attack range
    for (const target of this.entities) {
      if (target.id === player.id) continue;
      if (target.health <= 0) continue;
      if (target.invulnerableTimer > 0) continue;

      // Friendly fire check
      if (target.type === "player" && !this.settings.friendlyFire) continue;
      if (target.type === "mount" && target.riderId === player.id) continue;

      const inFront = (target.x - player.x) * player.facing >= -10;
      const distX = Math.abs(target.x - player.x);
      const distY = Math.abs(target.y - player.y);

      if (inFront && distX <= reach && distY <= 26) {
        let dmg = heroConfig.attackPower;
        if (attackType === "attack2") dmg *= 1.25;
        if (attackType === "finisher") dmg *= 1.8;
        if (attackType === "dash_attack") dmg *= 1.6;

        this.damageEntity(target, dmg, player.facing, isHeavy, player);

        // Vibrate gamepad if heavy hit
        if (navigator.vibrate) navigator.vibrate(isHeavy ? 60 : 30);
      }
    }
  }

  private executeMountAttack(player: Entity) {
    const mount = this.entities.find(e => e.id === player.mountedOnId);
    if (!mount) return;

    mount.state = "attack1";
    mount.stateTimer = 0;
    const type = (mount.subType as MountType) || "chicken_leg";
    soundEngine.playMountAttack(type);

    if (type === "chicken_leg") {
      // 360 degree tail whip!
      for (const target of this.entities) {
        if (target.id === player.id || target.id === mount.id) continue;
        if (target.health <= 0 || target.invulnerableTimer > 0) continue;
        const dist = Math.hypot(target.x - mount.x, (target.y - mount.y) * 2);
        if (dist <= 75) {
          this.damageEntity(target, 32, (target.x >= mount.x ? 1 : -1), true, player);
        }
      }
    } else {
      // Fire Dragon: shoot roaring fireball projectile!
      const fireball: Entity = {
        id: "proj_" + Date.now() + "_" + Math.random(),
        type: "projectile",
        x: mount.x + mount.facing * 30,
        y: mount.y - 12,
        z: 15,
        vx: mount.facing * 7.5,
        vy: 0,
        vz: 0,
        facing: mount.facing,
        health: 1,
        maxHealth: 1,
        state: "idle",
        stateTimer: 0,
        animFrame: 0,
        animTimer: 0,
        isGrounded: true,
        invulnerableTimer: 0,
        comboStep: 0,
        comboResetTimer: 0,
        width: 20,
        height: 20,
      };
      this.entities.push(fireball);

      // Check immediate enemies in flame jet path
      for (const target of this.entities) {
        if (target.id === player.id || target.id === mount.id) continue;
        const inFront = (target.x - mount.x) * mount.facing > 0;
        if (inFront && Math.abs(target.x - mount.x) <= 120 && Math.abs(target.y - mount.y) <= 24) {
          this.damageEntity(target, 42, mount.facing, true, player);
        }
      }
    }
  }

  private dealPlungeAoeDamage(player: Entity) {
    for (const target of this.entities) {
      if (target.id === player.id || target.health <= 0 || target.invulnerableTimer > 0) continue;
      if (target.type === "player" && !this.settings.friendlyFire) continue;

      const dist = Math.hypot(target.x - player.x, (target.y - player.y) * 2);
      if (dist <= 85) {
        this.damageEntity(target, 38, (target.x >= player.x ? 1 : -1), true, player);
      }
    }
  }

  // --- DAMAGE & IMPACTS ---
  public damageEntity(
    target: Entity,
    damage: number,
    hitDirection: 1 | -1,
    knockdown: boolean,
    attacker?: Entity
  ) {
    if (target.invulnerableTimer > 0 || target.health <= 0) return;
    target.health -= damage;
    target.invulnerableTimer = target.type === "player" ? 0.75 : 0.35;
    soundEngine.playHit(knockdown);
    this.triggerScreenShake(knockdown ? 0.25 : 0.1, knockdown ? 5 : 2);
    this.spawnHitSparks(target.x, target.y - target.z - 25, knockdown);

    // If gnome, kick drops items!
    if (target.type === "gnome") {
      soundEngine.playGnomeKick();
      this.spawnGnomeDrop(target);
      target.vx = hitDirection * 5;
      target.state = "hurt";
      target.stateTimer = 0;
      return;
    }

    // Knock rider off mount if hit hard
    if (target.mountedOnId && knockdown) {
      this.dismount(target);
    }

    if (target.health <= 0) {
      target.health = 0;
      target.state = "knockdown";
      target.stateTimer = 0;
      target.vx = hitDirection * 5;
      target.vz = 4;
      target.isGrounded = false;

      // Score and Kills
      if (target.type === "enemy" || target.type === "boss") {
        this.kills++;
        const points = target.scoreValue || (target.type === "boss" ? 15000 : 800);
        this.score += points;
        this.goldEarned += Math.floor(points / 25);
        this.spawnScoreText(target.x, target.y - 45, `+${points}`);

        if (this.kills === 25) this.onAchievementUnlock?.("blood_warrior", "Blood Warrior: 25 Kills");
        if (target.subType === "death_adder") this.onAchievementUnlock?.("adder_bane", "Tyrant's Fall: Slain Death Adder");
      }
    } else if (knockdown) {
      target.state = "knockdown";
      target.stateTimer = 0;
      target.vx = hitDirection * 4.5;
      target.vz = 3.5;
      target.isGrounded = false;
    } else {
      target.state = "hurt";
      target.stateTimer = 0;
      target.vx = hitDirection * 1.5;
    }
  }

  // --- MOUNT SYSTEM ---
  private checkMountRide(player: Entity) {
    if (player.mountedOnId) return;

    for (const mount of this.entities) {
      if (mount.type === "mount" && !mount.riderId && mount.health > 0) {
        const dist = Math.hypot(mount.x - player.x, mount.y - player.y);
        if (dist <= 30) {
          // Mount the beast!
          player.mountedOnId = mount.id;
          mount.riderId = player.id;
          soundEngine.playMeatCollect();
          this.onAchievementUnlock?.("beast_rider", "Bizarrian Rider");
          break;
        }
      }
    }
  }

  private dismount(entity: Entity) {
    if (!entity.mountedOnId) return;
    const mount = this.entities.find(e => e.id === entity.mountedOnId);
    if (mount) {
      mount.riderId = undefined;
    }
    entity.mountedOnId = undefined;
    entity.vz = 5;
    entity.isGrounded = false;
  }

  // --- MAGIC CASTING ---
  private triggerMagicCast(player: Entity) {
    const pots = player.magicPots || 0;
    if (pots <= 0) return;

    player.magicPots = 0;
    const heroId = player.heroId || "ax";
    const heroConfig = HEROES[heroId];

    this.magicCast = {
      active: true,
      heroId: heroId,
      level: pots,
      timer: 0,
      maxTimer: 1.8 + pots * 0.2,
      damageDealt: false,
    };

    player.state = "casting_magic";
    player.stateTimer = 0;
    soundEngine.playMagicCast(heroConfig.magicElement, pots);
    this.triggerScreenShake(1.5, 9);
    this.onAchievementUnlock?.("elemental_wrath", "Wrath of the Gods: Cast Magic");
  }

  private updateMagicCast(dt: number) {
    this.magicCast.timer += dt;

    // Halfway through spell, inflict screen-wide cataclysmic damage!
    if (!this.magicCast.damageDealt && this.magicCast.timer >= this.magicCast.maxTimer * 0.45) {
      this.magicCast.damageDealt = true;
      const baseDmg = 45 + this.magicCast.level * 25;

      for (const e of this.entities) {
        if (e.type === "enemy" || e.type === "boss") {
          this.damageEntity(e, baseDmg, 1, true);
        }
      }
    }

    if (this.magicCast.timer >= this.magicCast.maxTimer) {
      this.magicCast.active = false;
      const players = this.getPlayers();
      players.forEach(p => {
        if (p.state === "casting_magic") p.state = "idle";
      });
    }
  }

  // --- GNOME DROPS & PICKUPS ---
  private spawnGnomeDrop(gnome: Entity) {
    const isMagic = gnome.subType !== "meat";
    const item: Entity = {
      id: "pickup_" + Date.now() + "_" + Math.random(),
      type: isMagic ? "potion" : "meat",
      x: gnome.x + (Math.random() * 40 - 20),
      y: gnome.y + (Math.random() * 20 - 10),
      z: 15,
      vx: 0,
      vy: 0,
      vz: 4,
      facing: 1,
      health: 1,
      maxHealth: 1,
      state: "idle",
      stateTimer: 0,
      animFrame: 0,
      animTimer: 0,
      isGrounded: false,
      invulnerableTimer: 0,
      comboStep: 0,
      comboResetTimer: 0,
      width: 24,
      height: 24,
    };
    this.entities.push(item);

    // Check player pickup collisions
    this.checkPickups();
  }

  private checkPickups() {
    const players = this.getLivingPlayers();

    for (let i = this.entities.length - 1; i >= 0; i--) {
      const ent = this.entities[i];
      if (ent.type === "potion" || ent.type === "meat") {
        for (const p of players) {
          const dist = Math.hypot(ent.x - p.x, ent.y - p.y);
          if (dist <= 35) {
            if (ent.type === "potion") {
              const maxPots = HEROES[p.heroId || "ax"].maxMagicPots;
              p.magicPots = Math.min(maxPots, (p.magicPots || 0) + 1);
              soundEngine.playPotionCollect();
              this.spawnScoreText(p.x, p.y - 30, "+POTION", "#60a5fa");
            } else {
              p.health = Math.min(p.maxHealth, p.health + 35);
              soundEngine.playMeatCollect();
              this.spawnScoreText(p.x, p.y - 30, "+HEALTH", "#4ade80");
            }
            this.entities.splice(i, 1);
            break;
          }
        }
      }
    }
  }

  // --- WAVES & STAGES ---
  private checkWaves() {
    const stage = STAGES[this.currentStageIndex];
    if (!stage || this.currentWaveIndex >= stage.waves.length) return;

    const wave = stage.waves[this.currentWaveIndex];
    // Trigger wave if players reached trigger point
    const maxX = Math.max(...this.getLivingPlayers().map(p => p.x), 0);

    if (!this.waveInProgress && maxX >= wave.triggerX) {
      this.waveInProgress = true;
      this.spawnWave(wave);
    } else if (this.waveInProgress) {
      // Check if all enemies in current wave are dead
      const activeEnemies = this.entities.filter(e => (e.type === "enemy" || e.type === "boss") && e.health > 0);
      if (activeEnemies.length === 0) {
        this.waveInProgress = false;
        this.currentWaveIndex++;

        // If all waves in stage cleared!
        if (this.currentWaveIndex >= stage.waves.length) {
          this.triggerStageClear();
        }
      }
    }

    // Pickups collision check
    this.checkPickups();
  }

  private spawnWave(wave: StageConfig["waves"][0]) {
    for (const group of wave.enemies) {
      for (let i = 0; i < group.count; i++) {
        const startX = this.cameraX + 850 + i * 45;
        const startY = 250 + (i % 4) * 45;

        // If enemy rides mount
        let mountId: string | undefined = undefined;
        if (group.mount) {
          const mount: Entity = {
            id: "mount_" + Date.now() + "_" + Math.random(),
            type: "mount",
            subType: group.mount,
            x: startX,
            y: startY,
            z: 0,
            vx: 0,
            vy: 0,
            vz: 0,
            facing: -1,
            health: 80,
            maxHealth: 80,
            state: "idle",
            stateTimer: 0,
            animFrame: 0,
            animTimer: 0,
            isGrounded: true,
            invulnerableTimer: 0,
            comboStep: 0,
            comboResetTimer: 0,
            width: 44,
            height: 48,
          };
          this.entities.push(mount);
          mountId = mount.id;
        }

        const enemy: Entity = {
          id: "enemy_" + Date.now() + "_" + Math.random(),
          type: group.type === "death_adder" ? "boss" : "enemy",
          subType: group.type,
          x: startX,
          y: startY,
          z: 0,
          vx: 0,
          vy: 0,
          vz: 0,
          facing: -1,
          health: group.type === "death_adder" ? 350 : group.type === "bad_brother" ? 120 : group.type === "skeleton" ? 70 : 45,
          maxHealth: group.type === "death_adder" ? 350 : group.type === "bad_brother" ? 120 : group.type === "skeleton" ? 70 : 45,
          state: "idle",
          stateTimer: 0,
          animFrame: 0,
          animTimer: 0,
          isGrounded: true,
          invulnerableTimer: 0,
          comboStep: 0,
          comboResetTimer: 0,
          width: 36,
          height: 56,
          mountedOnId: mountId,
          scoreValue: group.type === "death_adder" ? 25000 : group.type === "bad_brother" ? 3000 : 800,
        };

        if (mountId) {
          const m = this.entities.find(e => e.id === mountId);
          if (m) m.riderId = enemy.id;
        }

        this.entities.push(enemy);
      }
    }

    // Spawn Gnomes
    if (wave.gnomes) {
      for (const g of wave.gnomes) {
        for (let i = 0; i < g.count; i++) {
          const gnome: Entity = {
            id: "gnome_" + Date.now() + "_" + Math.random(),
            type: "gnome",
            subType: g.type,
            x: this.cameraX + 800 + i * 60,
            y: 280 + i * 35,
            z: 0,
            vx: -3.5,
            vy: 0,
            vz: 0,
            facing: -1,
            health: 25,
            maxHealth: 25,
            state: "run",
            stateTimer: 0,
            animFrame: 0,
            animTimer: 0,
            isGrounded: true,
            invulnerableTimer: 0,
            comboStep: 0,
            comboResetTimer: 0,
            width: 24,
            height: 32,
          };
          this.entities.push(gnome);
        }
      }
    }
  }

  private triggerStageClear() {
    this.stageClear = true;
    soundEngine.playCoin();

    // Check if finished final stage!
    if (this.currentStageIndex >= STAGES.length - 1) {
      this.victory = true;
      this.onAchievementUnlock?.("golden_champion", "Golden Champion: Victory over Death Adder!");
      return;
    }

    // Launch Campfire bonus stage between stages!
    setTimeout(() => {
      this.inBonusCamp = true;
      this.bonusTimer = 12; // 12 seconds of campfire gnome bashing!
      soundEngine.playMusic("campfire");
      // Spawn sleeping camp gnomes
      for (let i = 0; i < 4; i++) {
        const gnome: Entity = {
          id: "camp_gnome_" + i,
          type: "gnome",
          subType: i % 2 === 0 ? "magic" : "meat",
          x: this.cameraX + 250 + i * 110,
          y: 260 + (i % 2) * 50,
          z: 0,
          vx: (Math.random() > 0.5 ? 1 : -1) * 3.5,
          vy: 0,
          vz: 0,
          facing: 1,
          health: 15,
          maxHealth: 15,
          state: "run",
          stateTimer: 0,
          animFrame: 0,
          animTimer: 0,
          isGrounded: true,
          invulnerableTimer: 0,
          comboStep: 0,
          comboResetTimer: 0,
          width: 24,
          height: 32,
        };
        this.entities.push(gnome);
      }
    }, 1800);
  }

  private updateCampfire(dt: number) {
    this.bonusTimer -= dt;
    // Keep entities active in camp
    for (const e of this.entities) {
      this.updateEntity(e, dt);
    }
    this.checkPickups();

    if (this.bonusTimer <= 0) {
      this.inBonusCamp = false;
      this.startStage(this.currentStageIndex + 1);
    }
  }

  // --- CAMERA & BOUNDS ---
  private updateCamera() {
    const players = this.getLivingPlayers();
    if (players.length === 0) return;

    // Average player position
    const avgX = players.reduce((sum, p) => sum + p.x, 0) / players.length;
    const targetCameraX = Math.max(0, avgX - 350);

    // Scroll forward only (arcade style prevents walking backwards once advanced)
    if (targetCameraX > this.cameraX) {
      this.cameraX += (targetCameraX - this.cameraX) * 0.08;
    }
  }

  // --- GAME OVER & VICTORY ---
  private checkGameState() {
    const players = this.getPlayers();
    const allDead = players.every(p => p.health <= 0 && (p.lives || 0) <= 0);

    if (allDead && !this.gameOver) {
      this.gameOver = true;
      this.onGameOver?.(this.score, this.currentStageIndex + 1, this.kills);
    }
  }

  // --- FX & PARTICLES ---
  private triggerScreenShake(duration: number, intensity: number) {
    this.screenShakeTimer = duration;
    this.screenShakeIntensity = intensity;
  }

  private spawnHitSparks(x: number, y: number, heavy: boolean) {
    const count = heavy ? 12 : 6;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        id: "p_" + Math.random(),
        x,
        y,
        z: 0,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        vz: 0,
        color: Math.random() > 0.5 ? "#fef08a" : "#f97316",
        size: Math.random() * 4 + 2,
        life: 0.25,
        maxLife: 0.25,
        shape: "spark",
      });
    }
  }

  private spawnImpactDust(x: number, y: number) {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        id: "dust_" + Math.random(),
        x: x + (Math.random() * 40 - 20),
        y: y + (Math.random() * 16 - 8),
        z: 0,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 2,
        vz: 0,
        color: "rgba(214, 211, 209, 0.7)",
        size: Math.random() * 8 + 4,
        life: 0.4,
        maxLife: 0.4,
        shape: "circle",
      });
    }
  }

  private spawnScoreText(x: number, y: number, text: string, color: string = "#facc15") {
    this.particles.push({
      id: "txt_" + Math.random(),
      x,
      y,
      z: 0,
      vx: 0,
      vy: -1.2,
      vz: 0,
      color,
      size: 14,
      life: 0.8,
      maxLife: 0.8,
      shape: "text",
      text,
    });
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx;
      p.y += p.vy;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  // --- HELPERS ---
  public getPlayers(): Entity[] {
    return this.entities.filter(e => e.type === "player");
  }

  public getLivingPlayers(): Entity[] {
    return this.entities.filter(e => e.type === "player" && e.health > 0);
  }
}
