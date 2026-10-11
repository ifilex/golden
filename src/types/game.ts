export type HeroId = "ax" | "tyris" | "gilius";

export interface HeroConfig {
  id: HeroId;
  name: string;
  title: string;
  maxHealth: number;
  maxMagicPots: number;
  speed: number;
  attackPower: number;
  reach: number;
  magicElement: "Earth" | "Fire" | "Lightning";
  magicName: string;
  color: string;
  accentColor: string;
  description: string;
}

export type EntityType = 
  | "player"
  | "enemy"
  | "boss"
  | "gnome"
  | "mount"
  | "potion"
  | "meat"
  | "projectile";

export type EnemyType = 
  | "henning"
  | "longmoan"
  | "amazon"
  | "skeleton"
  | "bad_brother"
  | "death_adder";

export type MountType = "chicken_leg" | "fire_dragon";

export type ActionState = 
  | "idle"
  | "walk"
  | "run"
  | "attack1"
  | "attack2"
  | "finisher"
  | "jump"
  | "jump_attack"
  | "down_plunge"
  | "dash_attack"
  | "hurt"
  | "knockdown"
  | "get_up"
  | "casting_magic"
  | "riding"
  | "dead";

export interface Hitbox {
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number; // z-tolerance
}

export interface Entity {
  id: string;
  type: EntityType;
  subType?: EnemyType | MountType | "magic" | "meat";
  x: number;
  y: number; // ground depth (vertical on screen)
  z: number; // height above ground (jump/air)
  vx: number;
  vy: number;
  vz: number;
  facing: 1 | -1;
  health: number;
  maxHealth: number;
  state: ActionState;
  stateTimer: number;
  animFrame: number;
  animTimer: number;
  isGrounded: boolean;
  mountedOnId?: string;
  riderId?: string;
  invulnerableTimer: number;
  comboStep: number;
  comboResetTimer: number;
  width: number;
  height: number;
  targetX?: number;
  targetY?: number;
  aiTimer?: number;
  scoreValue?: number;
  attackCooldown?: number;
  hasHitInCurrentAttack?: boolean;
  attackVariant?: "normal" | "heavy" | "dash" | "special";
  // Hero specific
  playerIndex?: 1 | 2;
  heroId?: HeroId;
  magicPots?: number;
  lives?: number;
  equippedCosmetics?: {
    skin?: string;
    weapon?: string;
    aura?: string;
    title?: string;
  };
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  shape: "circle" | "spark" | "fire" | "lightning" | "rock" | "ring" | "text";
  text?: string;
}

export interface MagicCastEffect {
  active: boolean;
  heroId: HeroId;
  level: number;
  timer: number;
  maxTimer: number;
  damageDealt: boolean;
}

export interface StageConfig {
  id: number;
  name: string;
  subtitle: string;
  backgroundTheme: "forest" | "turtle" | "eagle" | "castle" | "throne";
  length: number;
  waves: WaveConfig[];
  isBonusStage?: boolean;
}

export interface WaveConfig {
  triggerX: number;
  enemies: {
    type: EnemyType;
    count: number;
    mount?: MountType;
    startX?: number;
    startY?: number;
  }[];
  gnomes?: {
    type: "magic" | "meat";
    count: number;
  }[];
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  hero: HeroId;
  score: number;
  stage: number;
  stageName: string;
  kills: number;
  coop: boolean;
  platform: "Mobile" | "Desktop" | "Gamepad";
  date: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

export interface ShopItem {
  id: string;
  name: string;
  category: "skin" | "weapon" | "aura" | "title";
  hero: HeroId | "all";
  cost: number;
  icon: string;
  desc: string;
  color: string;
  aura?: string;
  purchased?: boolean;
  equipped?: boolean;
}

export interface GameSettings {
  difficulty: "novice" | "arcade" | "hardcore";
  musicVolume: number;
  sfxVolume: number;
  crtFilter: boolean;
  friendlyFire: boolean;
  showTouchControls: boolean;
  touchJoystickSize: "small" | "medium" | "large";
  voxelStyle?: boolean;
}
