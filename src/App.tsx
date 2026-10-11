import React, { useRef, useState, useEffect, useCallback } from "react";
import { HeroId, GameSettings, ShopItem } from "./types/game";
import { GameEngine, HEROES, STAGES } from "./game/engine";
import { SpriteRenderer } from "./game/sprites";
import { BackgroundRenderer } from "./game/backgrounds";
import { inputManager } from "./game/controls";
import { soundEngine } from "./audio/soundEngine";
import { CharacterSelect } from "./components/CharacterSelect";
import { ArcadeHUD } from "./components/ArcadeHUD";
import { VirtualJoystick } from "./components/VirtualJoystick";
import { LeaderboardModal } from "./components/LeaderboardModal";
import { ShopModal } from "./components/ShopModal";
import { AchievementsModal } from "./components/AchievementsModal";
import { SettingsModal } from "./components/SettingsModal";
import { Volume2, VolumeX, RefreshCw, Trophy, Settings as SettingsIcon, Award, Shield } from "lucide-react";

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Engine instance
  const engineRef = useRef<GameEngine | null>(null);

  // App & UI State
  const [gameState, setGameState] = useState<"menu" | "playing" | "game_over" | "victory">("menu");
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Modals
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Game configuration
  const [settings, setSettings] = useState<GameSettings>({
    difficulty: "arcade",
    musicVolume: 0.5,
    sfxVolume: 0.7,
    crtFilter: true,
    friendlyFire: false,
    showTouchControls: true,
    touchJoystickSize: "medium",
    voxelStyle: true,
  });

  // Persistent Player Progression
  const [gold, setGold] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("golden_axe_gold");
      return saved ? parseInt(saved, 10) : 120; // Starting gold
    } catch {
      return 120;
    }
  });

  const [equippedCosmetics, setEquippedCosmetics] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("golden_axe_equipped");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [unlockedAchievements, setUnlockedAchievements] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("golden_axe_achievements");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Achievement unlock banner notification
  const [recentAchievement, setRecentAchievement] = useState<string | null>(null);

  // Score to submit when game ends
  const [pendingScore, setPendingScore] = useState<{
    score: number;
    stage: number;
    kills: number;
    hero: HeroId;
    coop: boolean;
  } | null>(null);

  // Active P1 / P2 selections
  const [p1Hero, setP1Hero] = useState<HeroId>("ax");
  const [p2Hero, setP2Hero] = useState<HeroId | undefined>(undefined);

  // HUD mirror state for React render
  const [hudState, setHudState] = useState({
    score: 0,
    stageName: "Stage 1",
    isCoop: false,
  });

  // Initialize Game Engine
  useEffect(() => {
    const engine = new GameEngine(settings);

    engine.onAchievementUnlock = (id: string, title: string) => {
      setUnlockedAchievements((prev) => {
        if (prev[id]) return prev;
        const updated = { ...prev, [id]: true };
        localStorage.setItem("golden_axe_achievements", JSON.stringify(updated));
        setRecentAchievement(title);
        setTimeout(() => setRecentAchievement(null), 3500);
        return updated;
      });
    };

    engine.onGameOver = (finalScore, stage, kills) => {
      setGameState("game_over");
      setPendingScore({
        score: finalScore,
        stage,
        kills,
        hero: p1Hero,
        coop: Boolean(p2Hero),
      });
      setIsLeaderboardOpen(true);
    };

    engineRef.current = engine;
  }, []);

  // Sync settings changes to engine
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.settings = settings;
    }
  }, [settings]);

  // Start a new game session
  const handleStartGame = (selectedP1: HeroId, selectedP2?: HeroId) => {
    setP1Hero(selectedP1);
    setP2Hero(selectedP2);
    setGameState("playing");
    setPendingScore(null);

    if (engineRef.current) {
      engineRef.current.initGame(selectedP1, selectedP2, {
        p1: equippedCosmetics,
        p2: equippedCosmetics,
      });
    }

    if (selectedP2) {
      engineRef.current?.onAchievementUnlock?.("coop_brothers", "Brotherhood in Arms: 2P Co-Op");
    }
  };

  // Join 2P on the fly if single player
  const handleJoin2P = () => {
    if (!engineRef.current || gameState !== "playing") return;
    const heroP2: HeroId = p1Hero === "tyris" ? "ax" : "tyris";
    setP2Hero(heroP2);
    engineRef.current.isCoop = true;

    // Add Player 2 to engine entities
    const heroConfig = HEROES[heroP2];
    engineRef.current.entities.push({
      id: "player_2",
      type: "player",
      playerIndex: 2,
      heroId: heroP2,
      x: engineRef.current.cameraX + 120,
      y: 320,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      facing: 1,
      health: heroConfig.maxHealth,
      maxHealth: heroConfig.maxHealth,
      magicPots: 1,
      lives: 3,
      state: "idle",
      stateTimer: 0,
      animFrame: 0,
      animTimer: 0,
      isGrounded: true,
      invulnerableTimer: 0.5,
      comboStep: 0,
      comboResetTimer: 0,
      width: 36,
      height: 60,
    });

    soundEngine.playCoin();
    engineRef.current.onAchievementUnlock?.("coop_brothers", "Brotherhood in Arms: 2P Co-Op");
  };

  // Restart after game over or victory
  const handleRestart = () => {
    handleStartGame(p1Hero, p2Hero);
  };

  // Main 60 FPS Canvas Game Loop
  useEffect(() => {
    if (gameState !== "playing" || isPaused) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min(0.05, (currentTime - lastTime) / 1000); // Clamp dt to prevent tunneling
      lastTime = currentTime;

      const engine = engineRef.current;
      const canvas = canvasRef.current;

      if (engine && canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          // 1. Process Inputs for P1 & P2
          const p1Input = inputManager.getPlayerInputs(1);
          engine.handlePlayerInput(1, p1Input);

          if (engine.isCoop) {
            const p2Input = inputManager.getPlayerInputs(2);
            engine.handlePlayerInput(2, p2Input);
          }

          // 2. Step Engine Physics & Logic
          engine.update(dt);

          // Check Victory
          if (engine.victory && gameState === "playing") {
            setGameState("victory");
            setPendingScore({
              score: engine.score,
              stage: 4,
              kills: engine.kills,
              hero: p1Hero,
              coop: Boolean(p2Hero),
            });
            setIsLeaderboardOpen(true);
          }

          // Update HUD values periodically
          setHudState({
            score: engine.score,
            stageName: STAGES[engine.currentStageIndex]?.name || "Stage 1",
            isCoop: engine.isCoop,
          });

          // Sync gold earned
          if (engine.goldEarned > 0) {
            setGold((prev) => {
              const updated = prev + engine.goldEarned;
              localStorage.setItem("golden_axe_gold", updated.toString());
              engine.goldEarned = 0;
              return updated;
            });
          }

          // 3. Render Canvas
          ctx.save();
          // Apply Screen Shake
          if (engine.screenShakeIntensity > 0) {
            const shakeX = (Math.random() - 0.5) * engine.screenShakeIntensity * 2;
            const shakeY = (Math.random() - 0.5) * engine.screenShakeIntensity * 2;
            ctx.translate(shakeX, shakeY);
          }

          // Clear Canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Render Stage Background
          const currStage = STAGES[engine.currentStageIndex] || STAGES[0];
          BackgroundRenderer.render(
            ctx,
            canvas.width,
            canvas.height,
            engine.cameraX,
            currStage,
            engine.inBonusCamp,
            engine.tick
          );

          // Render Ground Drop Shadows for all entities
          for (const ent of engine.entities) {
            if (ent.state !== "dead") {
              SpriteRenderer.drawShadow(ctx, ent, engine.cameraX);
            }
          }

          // Depth Sorting: Sort living entities by Y ground coordinate (2.5D perspective)
          const sortedEntities = [...engine.entities].sort((a, b) => a.y - b.y);

          // Render Entities
          for (const ent of sortedEntities) {
            SpriteRenderer.drawEntity(ctx, ent, engine.cameraX, engine.tick, settings.voxelStyle !== false);
          }

          // Render Particles & Floaters
          SpriteRenderer.drawParticles(ctx, engine.particles, engine.cameraX);

          // Render Full-Screen Magic Visual Spectacle
          BackgroundRenderer.renderMagicOverlay(
            ctx,
            canvas.width,
            canvas.height,
            engine.magicCast,
            engine.tick
          );

          ctx.restore();
        }
      }

      inputManager.update();
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, isPaused, p1Hero, p2Hero]);

  // Adjust canvas size to internal arcade resolution (800x450 for crisp 16:9 pixel art)
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = 800;
      canvasRef.current.height = 450;
    }
  }, []);

  const handleSpendGold = (amount: number) => {
    setGold((prev) => {
      const updated = Math.max(0, prev - amount);
      localStorage.setItem("golden_axe_gold", updated.toString());
      return updated;
    });
  };

  const handleEquipCosmetic = (item: ShopItem) => {
    setEquippedCosmetics((prev) => {
      const updated = { ...prev, [item.category]: item.id };
      localStorage.setItem("golden_axe_equipped", JSON.stringify(updated));
      return updated;
    });
  };

  const currentPlayers = engineRef.current?.getPlayers() || [];
  const p1Entity = currentPlayers.find((p) => p.playerIndex === 1) || null;
  const p2Entity = currentPlayers.find((p) => p.playerIndex === 2) || null;
  const currentBoss = engineRef.current?.entities.find((e) => e.type === "boss") || null;

  return (
    <div
      ref={containerRef}
      id="arcade-cabinet-container"
      className="relative w-screen h-screen bg-stone-950 flex items-center justify-center overflow-hidden select-none font-arcade"
    >
      {/* 1. In-Game Achievement Toast Notification */}
      {recentAchievement && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-stone-950 px-4 py-2 rounded-lg font-arcade text-xs shadow-2xl flex items-center gap-2 border-2 border-yellow-200 animate-bounce">
          <Award className="w-5 h-5 text-stone-950" />
          <span>MEDAL UNLOCKED: {recentAchievement}</span>
        </div>
      )}

      {/* 2. Main Game Stage Canvas */}
      <div className="relative w-full h-full max-w-[1280px] max-h-[720px] aspect-video flex items-center justify-center bg-black overflow-hidden shadow-2xl">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain pixelated"
          style={{ width: "100%", height: "100%" }}
        />

        {/* 3. Authentic CRT Scanline & Phosphor Overlay */}
        {settings.crtFilter && (
          <div className="absolute inset-0 scanlines crt-vignette pointer-events-none z-20" />
        )}

        {/* 4. Arcade Top HUD Status Header */}
        {gameState === "playing" && (
          <ArcadeHUD
            player1={p1Entity}
            player2={p2Entity}
            isCoop={hudState.isCoop}
            score={hudState.score}
            stageName={hudState.stageName}
            bossEntity={currentBoss}
            onJoinP2={handleJoin2P}
          />
        )}

        {/* 5. In-Game Pause / Utility Button Bar */}
        {gameState === "playing" && (
          <div className="absolute top-4 right-4 z-30 flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => {
                const newMute = !isMuted;
                setIsMuted(newMute);
                soundEngine.setVolumes(newMute ? 0 : settings.musicVolume, newMute ? 0 : settings.sfxVolume);
              }}
              className="p-2 bg-stone-900/80 hover:bg-stone-800 text-stone-300 rounded border border-stone-700 cursor-pointer shadow"
              title="Toggle Audio"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 bg-stone-900/80 hover:bg-stone-800 text-stone-300 rounded border border-stone-700 cursor-pointer shadow"
              title="Settings"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>

            <button
              onClick={() => setGameState("menu")}
              className="px-2.5 py-1.5 bg-stone-900/80 hover:bg-stone-800 text-amber-300 rounded border border-stone-700 text-[10px] font-arcade cursor-pointer shadow"
            >
              EXIT
            </button>
          </div>
        )}

        {/* 6. Transparent Virtual Joystick & Action Buttons for Mobile/Tablet */}
        {gameState === "playing" && settings.showTouchControls && (
          <VirtualJoystick
            forceVisible={settings.showTouchControls}
            sizeSetting={settings.touchJoystickSize}
          />
        )}

        {/* 7. Character Selection & Mode Screen */}
        {gameState === "menu" && (
          <CharacterSelect
            onStartGame={handleStartGame}
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
            onOpenShop={() => setIsShopOpen(true)}
            onOpenAchievements={() => setIsAchievementsOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {/* 8. Game Over Screen */}
        {gameState === "game_over" && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-40 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <h2 className="font-epic text-4xl sm:text-6xl font-black text-rose-600 blood-glow tracking-widest mb-2">
              GAME OVER
            </h2>
            <p className="font-arcade text-xs sm:text-sm text-stone-300 mb-6">
              YOUR SOUL BELONGS TO DEATH ADDER...
            </p>
            <div className="bg-stone-900/90 border border-stone-800 p-4 rounded-xl max-w-sm w-full mb-6 font-arcade text-xs space-y-2 text-stone-300">
              <div className="flex justify-between">
                <span>FINAL SCORE:</span>
                <span className="text-amber-400 font-bold">{hudState.score.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>STAGE REACHED:</span>
                <span className="text-stone-100">{hudState.stageName}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={handleRestart}
                className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-arcade text-xs font-bold rounded-lg cursor-pointer shadow-lg active:scale-95 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                CONTINUE (INSERT COIN)
              </button>
              <button
                onClick={() => setGameState("menu")}
                className="px-6 py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 font-arcade text-xs rounded-lg cursor-pointer shadow transition-all"
              >
                TITLE SCREEN
              </button>
            </div>
          </div>
        )}

        {/* 9. Victory Screen */}
        {gameState === "victory" && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-40 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <h2 className="font-epic text-3xl sm:text-5xl font-black text-yellow-400 arcade-glow tracking-widest mb-3">
              VICTORY!
            </h2>
            <p className="font-fantasy text-base sm:text-lg text-amber-200 max-w-lg mb-6 leading-relaxed">
              Death Adder has fallen! Peace has returned to the realm of Yuria, and the legendary Axe of Warriors is restored to its rightful shrine!
            </p>
            <div className="bg-stone-900/90 border-2 border-amber-500/50 p-4 rounded-xl max-w-sm w-full mb-6 font-arcade text-xs space-y-2 text-stone-300">
              <div className="flex justify-between">
                <span>CHAMPION SCORE:</span>
                <span className="text-amber-400 font-bold">{hudState.score.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setGameState("menu")}
                className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 font-arcade text-xs font-black rounded-lg cursor-pointer shadow-lg active:scale-95 transition-all"
              >
                RETURN TO LORE
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 10. Modals */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        userScoreToSubmit={pendingScore}
        onScoreSubmitted={() => setPendingScore(null)}
      />

      <ShopModal
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
        gold={gold}
        onSpendGold={handleSpendGold}
        onEquipCosmetic={handleEquipCosmetic}
        equippedItems={equippedCosmetics}
      />

      <AchievementsModal
        isOpen={isAchievementsOpen}
        onClose={() => setIsAchievementsOpen(false)}
        unlockedMap={unlockedAchievements}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
      />
    </div>
  );
}
