import React, { useState } from "react";
import { HeroId } from "../types/game";
import { HEROES } from "../game/engine";
import { soundEngine } from "../audio/soundEngine";
import { Users, User, Shield, Zap, Sparkles, Sword, Play } from "lucide-react";

interface CharacterSelectProps {
  onStartGame: (p1Hero: HeroId, p2Hero?: HeroId) => void;
  onOpenLeaderboard: () => void;
  onOpenShop: () => void;
  onOpenAchievements: () => void;
  onOpenSettings: () => void;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  onStartGame,
  onOpenLeaderboard,
  onOpenShop,
  onOpenAchievements,
  onOpenSettings,
}) => {
  const [p1Selection, setP1Selection] = useState<HeroId>("ax");
  const [p2Selection, setP2Selection] = useState<HeroId>("tyris");
  const [isCoop, setIsCoop] = useState<boolean>(false);

  const heroKeys: HeroId[] = ["ax", "tyris", "gilius"];

  const handleHeroSelect = (hero: HeroId, isP2: boolean) => {
    soundEngine.playHit(false);
    if (isP2) {
      setP2Selection(hero);
    } else {
      setP1Selection(hero);
    }
  };

  const handleStart = () => {
    soundEngine.playCoin();
    setTimeout(() => {
      onStartGame(p1Selection, isCoop ? p2Selection : undefined);
    }, 250);
  };

  const p1Hero = HEROES[p1Selection];
  const p2Hero = HEROES[p2Selection];

  return (
    <div
      id="char-select-screen"
      className="absolute inset-0 z-40 bg-stone-950 flex flex-col items-center justify-between p-4 sm:p-6 overflow-y-auto"
    >
      {/* Top Banner / Arcade Logo */}
      <div className="flex flex-col items-center text-center mt-2">
        <h1 className="font-epic text-3xl sm:text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-yellow-400 to-amber-700 drop-shadow-[0_4px_10px_rgba(202,138,4,0.6)]">
          AXE WARRIORS
        </h1>
        <p className="font-arcade text-[10px] sm:text-xs text-amber-500 tracking-widest mt-1">
          ARCADE CHRONICLES • YURIA 1989-2026
        </p>

        {/* 1P / 2P Co-Op Selector Mode */}
        <div className="flex items-center gap-3 mt-4 bg-stone-900/90 p-1.5 rounded-lg border border-amber-900/60 shadow-lg">
          <button
            onClick={() => {
              setIsCoop(false);
              soundEngine.playHit(false);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded font-arcade text-xs transition-all cursor-pointer ${
              !isCoop
                ? "bg-amber-600 text-stone-950 shadow-md font-bold scale-105"
                : "text-stone-400 hover:text-amber-300"
            }`}
          >
            <User className="w-4 h-4" />
            1P SOLO
          </button>
          <button
            onClick={() => {
              setIsCoop(true);
              soundEngine.playHit(false);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded font-arcade text-xs transition-all cursor-pointer ${
              isCoop
                ? "bg-emerald-600 text-stone-950 shadow-md font-bold scale-105"
                : "text-stone-400 hover:text-emerald-300"
            }`}
          >
            <Users className="w-4 h-4" />
            2P LOCAL CO-OP
          </button>
        </div>
      </div>

      {/* Main Hero Selection Roster */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 w-full max-w-5xl my-4">
        {heroKeys.map((heroId) => {
          const hero = HEROES[heroId];
          const isP1Selected = p1Selection === heroId;
          const isP2Selected = isCoop && p2Selection === heroId;

          return (
            <div
              key={heroId}
              onClick={() => handleHeroSelect(heroId, false)}
              className={`relative rounded-xl bg-stone-900/80 border-2 transition-all p-5 flex flex-col items-center text-center cursor-pointer shadow-xl ${
                isP1Selected
                  ? "border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)] scale-[1.02] bg-gradient-to-b from-stone-900 to-amber-950/40"
                  : isP2Selected
                  ? "border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)] scale-[1.02] bg-gradient-to-b from-stone-900 to-emerald-950/40"
                  : "border-stone-800 hover:border-stone-600 opacity-80 hover:opacity-100"
              }`}
            >
              {/* Badges for 1P / 2P */}
              <div className="absolute -top-3 left-4 flex gap-2">
                {isP1Selected && (
                  <span className="px-2 py-0.5 bg-amber-500 text-stone-950 font-arcade text-[9px] rounded font-bold shadow-md">
                    1P SELECTED
                  </span>
                )}
                {isP2Selected && (
                  <span className="px-2 py-0.5 bg-emerald-500 text-stone-950 font-arcade text-[9px] rounded font-bold shadow-md">
                    2P SELECTED
                  </span>
                )}
              </div>

              {/* Hero Portrait Visual */}
              <div className="w-24 h-24 rounded-full border-4 border-stone-700 bg-stone-950 flex items-center justify-center my-2 shadow-inner overflow-hidden relative">
                <div
                  className="w-16 h-16 rounded-full"
                  style={{ backgroundColor: hero.color }}
                />
                {/* Visual weapon glyph */}
                <div className="absolute inset-0 flex items-center justify-center text-white/90">
                  {heroId === "ax" ? (
                    <Sword className="w-10 h-10 drop-shadow" />
                  ) : heroId === "tyris" ? (
                    <Sparkles className="w-10 h-10 drop-shadow" />
                  ) : (
                    <Shield className="w-10 h-10 drop-shadow" />
                  )}
                </div>
              </div>

              {/* Hero Name & Title */}
              <h3 className="font-epic text-xl font-bold text-stone-100 mt-1">
                {hero.name}
              </h3>
              <p className="font-arcade text-[9px] text-amber-400 mb-3">
                {hero.title.toUpperCase()}
              </p>

              {/* Magic Element Gauge */}
              <div className="w-full bg-stone-950/80 p-2.5 rounded border border-stone-800 flex flex-col gap-2 text-left mb-3">
                <div className="flex justify-between text-[10px] font-arcade">
                  <span className="text-stone-400">MAGIC ELEMENT:</span>
                  <span className="text-amber-300 font-bold">{hero.magicElement}</span>
                </div>
                {/* Pots capacity */}
                <div className="flex items-center justify-between text-[10px] font-arcade">
                  <span className="text-stone-400">MAX POTIONS:</span>
                  <div className="flex gap-1">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-4 rounded-xs border ${
                          i < hero.maxMagicPots
                            ? "bg-blue-500 border-blue-300"
                            : "bg-stone-800 border-stone-900 opacity-25"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Hero Lore */}
              <p className="text-xs text-stone-300 font-fantasy leading-relaxed flex-1">
                "{hero.description}"
              </p>

              {/* Co-Op selection button for 2P */}
              {isCoop && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleHeroSelect(heroId, true);
                  }}
                  className={`w-full mt-3 py-1.5 rounded font-arcade text-[10px] transition-all cursor-pointer ${
                    p2Selection === heroId
                      ? "bg-emerald-600 text-stone-950 font-bold"
                      : "bg-stone-800 hover:bg-emerald-900 text-stone-300"
                  }`}
                >
                  ASSIGN TO 2P
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Action Controls & Auxiliary Modals */}
      <footer className="flex flex-col sm:flex-row items-center justify-between w-full max-w-5xl gap-4 pt-2 border-t border-stone-800">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={onOpenLeaderboard}
            className="px-3.5 py-2 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 font-arcade text-[10px] transition-all cursor-pointer shadow-md"
          >
            🏆 LEADERBOARDS
          </button>
          <button
            onClick={onOpenShop}
            className="px-3.5 py-2 rounded bg-stone-900 hover:bg-stone-800 border border-amber-500/40 text-amber-300 font-arcade text-[10px] transition-all cursor-pointer shadow-md"
          >
            ⚔️ ARMORY SHOP
          </button>
          <button
            onClick={onOpenAchievements}
            className="px-3.5 py-2 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 font-arcade text-[10px] transition-all cursor-pointer shadow-md"
          >
            🎖️ ACHIEVEMENTS
          </button>
          <button
            onClick={onOpenSettings}
            className="px-3.5 py-2 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 font-arcade text-[10px] transition-all cursor-pointer shadow-md"
          >
            ⚙️ OPTIONS
          </button>
        </div>

        {/* Start Game Button */}
        <button
          id="btn-start-arcade"
          onClick={handleStart}
          className="flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-lg bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-arcade text-xs sm:text-sm font-black shadow-[0_0_20px_rgba(234,179,8,0.5)] active:scale-95 transition-all cursor-pointer"
        >
          <Play className="w-5 h-5 fill-stone-950" />
          START BATTLE (INSERT COIN)
        </button>
      </footer>
    </div>
  );
};
