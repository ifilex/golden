import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

interface LeaderboardEntry {
  id: string;
  playerName: string;
  hero: "ax" | "tyris" | "gilius";
  score: number;
  stage: number;
  stageName: string;
  kills: number;
  coop: boolean;
  platform: "Mobile" | "Desktop" | "Gamepad";
  date: string;
}

// Initial legendary arcade scores
let leaderboardData: LeaderboardEntry[] = [
  { id: "1", playerName: "GOLDEN_WARRIOR", hero: "ax", score: 98450, stage: 5, stageName: "Death Adder's Throne", kills: 142, coop: true, platform: "Desktop", date: "2026-09-08" },
  { id: "2", playerName: "TYRIS_QUEEN", hero: "tyris", score: 87320, stage: 5, stageName: "Death Adder's Throne", kills: 128, coop: false, platform: "Mobile", date: "2026-09-07" },
  { id: "3", playerName: "THUNDER_AXE", hero: "gilius", score: 79100, stage: 4, stageName: "Castle Gates", kills: 110, coop: true, platform: "Gamepad", date: "2026-09-06" },
  { id: "4", playerName: "BARBARIAN_X", hero: "ax", score: 65400, stage: 3, stageName: "Across the Sea", kills: 89, coop: false, platform: "Desktop", date: "2026-09-05" },
  { id: "5", playerName: "DRAGON_RIDER", hero: "tyris", score: 54200, stage: 2, stageName: "Turtle Village", kills: 74, coop: false, platform: "Mobile", date: "2026-09-04" },
  { id: "6", playerName: "DWARF_LORD", hero: "gilius", score: 48900, stage: 2, stageName: "Turtle Village", kills: 63, coop: true, platform: "Gamepad", date: "2026-09-03" },
  { id: "7", playerName: "ARCADE_HERO", hero: "ax", score: 39500, stage: 1, stageName: "Woodland Outskirts", kills: 48, coop: false, platform: "Desktop", date: "2026-09-02" },
];

const SHOP_ITEMS = [
  {
    id: "skin_ax_golden",
    name: "Golden Barbarian Armor",
    category: "skin",
    hero: "ax",
    cost: 400,
    icon: "axe",
    desc: "Forged in the legendary fiery furnaces of Firewood. Radiates champion prestige.",
    color: "#eab308",
    aura: "rgba(234, 179, 8, 0.6)",
  },
  {
    id: "skin_tyris_crimson",
    name: "Crimson Flame Valkyrie",
    category: "skin",
    hero: "tyris",
    cost: 350,
    icon: "flame",
    desc: "Infused with the eternal flame of the sacred Fire Dragon.",
    color: "#f43f5e",
    aura: "rgba(244, 63, 94, 0.6)",
  },
  {
    id: "skin_gilius_storm",
    name: "Thunder King Regalia",
    category: "skin",
    hero: "gilius",
    cost: 350,
    icon: "zap",
    desc: "Blessed by the ancient mountain clouds. Crackles with pure voltage.",
    color: "#06b6d4",
    aura: "rgba(6, 182, 212, 0.6)",
  },
  {
    id: "weapon_sun_blade",
    name: "Solar Sun Broadsword",
    category: "weapon",
    hero: "ax",
    cost: 250,
    icon: "sword",
    desc: "Blazing blade that leaves glowing trail slashes during combos.",
    color: "#fb923c",
    aura: "rgba(251, 146, 60, 0.5)",
  },
  {
    id: "weapon_frost_axe",
    name: "Glacial Heavy Waraxe",
    category: "weapon",
    hero: "gilius",
    cost: 250,
    icon: "shield",
    desc: "Carved from glacial peaks. Chilling impact particle FX.",
    color: "#38bdf8",
    aura: "rgba(56, 189, 248, 0.5)",
  },
  {
    id: "aura_dragon_blaze",
    name: "Dragon Fire Aura",
    category: "aura",
    hero: "all",
    cost: 500,
    icon: "sparkles",
    desc: "Cosmetic flame halo surrounding your warrior in battle.",
    color: "#ef4444",
    aura: "rgba(239, 68, 68, 0.7)",
  },
  {
    id: "title_death_bane",
    name: "Title: Death Adder's Bane",
    category: "title",
    hero: "all",
    cost: 200,
    icon: "crown",
    desc: "Displayed proudly alongside your name in Online Leaderboards.",
    color: "#a855f7",
    aura: "rgba(168, 85, 247, 0.5)",
  }
];

const WEEKLY_CHALLENGES = [
  {
    id: "ch_gnome_rush",
    title: "Gnome Potions Frenzy",
    description: "Hit thieves and gather 25 magic potions across battles.",
    rewardGold: 150,
    target: 25,
    type: "potions",
  },
  {
    id: "ch_beast_master",
    title: "Beast Cavalier",
    description: "Ride the Bizarrian Chicken-Leg and Dragon to defeat 30 enemies.",
    rewardGold: 200,
    target: 30,
    type: "mount_kills",
  },
  {
    id: "ch_magic_cataclysm",
    title: "Wrath of the Gods",
    description: "Cast full-level magic 5 times to incinerate enemy legions.",
    rewardGold: 250,
    target: 5,
    type: "magic_full",
  },
  {
    id: "ch_skeleton_slayer",
    title: "Bone Breaker",
    description: "Smash 20 resurrected skeleton soldiers into dust.",
    rewardGold: 180,
    target: 20,
    type: "skeletons",
  }
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime(), serverTime: new Date().toISOString() });
  });

  // Leaderboard
  app.get("/api/leaderboard", (_req, res) => {
    const sorted = [...leaderboardData].sort((a, b) => b.score - a.score).slice(0, 30);
    res.json({ leaderboard: sorted, totalEntries: leaderboardData.length });
  });

  app.post("/api/leaderboard", (req, res) => {
    const { playerName, hero, score, stage, stageName, kills, coop, platform } = req.body;
    if (!playerName || typeof score !== "number") {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const newEntry: LeaderboardEntry = {
      id: "lb_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      playerName: String(playerName).trim().toUpperCase().substring(0, 15) || "WARRIOR",
      hero: (hero === "tyris" || hero === "gilius" ? hero : "ax"),
      score: Math.max(0, Math.floor(score)),
      stage: Number(stage) || 1,
      stageName: stageName || "Stage " + (stage || 1),
      kills: Number(kills) || 0,
      coop: Boolean(coop),
      platform: platform === "Mobile" || platform === "Gamepad" ? platform : "Desktop",
      date: new Date().toISOString().split("T")[0],
    };

    leaderboardData.push(newEntry);
    leaderboardData.sort((a, b) => b.score - a.score);
    if (leaderboardData.length > 100) {
      leaderboardData = leaderboardData.slice(0, 100);
    }

    const rank = leaderboardData.findIndex(e => e.id === newEntry.id) + 1;
    res.json({ success: true, entry: newEntry, rank });
  });

  // Shop
  app.get("/api/shop", (_req, res) => {
    res.json({ items: SHOP_ITEMS });
  });

  // Challenges / Live Events
  app.get("/api/challenges", (_req, res) => {
    res.json({
      challenges: WEEKLY_CHALLENGES,
      season: "Season 1: Return of Death Adder",
      seasonEndsInDays: 14,
    });
  });

  // Vite middleware or Static files
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Golden Axe Arcade Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
