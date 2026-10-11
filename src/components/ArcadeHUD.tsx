import React from "react";
import { Entity, HeroId } from "../types/game";
import { HEROES } from "../game/engine";
import { Shield, Sparkles, Heart } from "lucide-react";

interface ArcadeHUDProps {
  player1: Entity | null;
  player2: Entity | null;
  isCoop: boolean;
  score: number;
  stageName: string;
  bossEntity: Entity | null;
  onJoinP2?: () => void;
}

export const ArcadeHUD: React.FC<ArcadeHUDProps> = ({
  player1,
  player2,
  isCoop,
  score,
  stageName,
  bossEntity,
  onJoinP2,
}) => {
  const renderPlayerStatus = (player: Entity | null, pNum: 1 | 2) => {
    if (!player) {
      return (
        <div className="flex flex-col items-start opacity-70">
          <button
            onClick={onJoinP2}
            className="px-3 py-1 bg-amber-900/60 hover:bg-amber-800 border border-amber-500/50 rounded text-amber-300 font-arcade text-[10px] animate-pulse transition-all cursor-pointer shadow-md"
          >
            INSERT COIN / 2P JOIN
          </button>
        </div>
      );
    }

    const hero = HEROES[player.heroId || "ax"];
    const hpPercent = Math.max(0, Math.min(100, (player.health / player.maxHealth) * 100));
    const maxPots = hero.maxMagicPots;
    const currentPots = player.magicPots || 0;

    return (
      <div className={`flex flex-col gap-1 ${pNum === 2 ? "items-end text-right" : "items-start"}`}>
        {/* Name & Player Indicator */}
        <div className="flex items-center gap-2">
          <span className={`font-arcade text-[11px] ${pNum === 1 ? "text-amber-400 arcade-glow" : "text-emerald-400"}`}>
            {pNum}P {hero.name.toUpperCase()}
          </span>
          {/* Lives */}
          <div className="flex items-center gap-0.5 text-rose-400">
            {Array.from({ length: Math.max(0, player.lives || 1) }).map((_, i) => (
              <Heart key={i} className="w-3 h-3 fill-rose-500 text-rose-500" />
            ))}
          </div>
        </div>

        {/* Health Bar (Segmented arcade gauge) */}
        <div className="w-36 sm:w-44 h-4 bg-stone-950 border-2 border-stone-600 rounded-xs overflow-hidden relative shadow-inner">
          <div
            className={`h-full transition-all duration-150 ${
              hpPercent > 50 ? "bg-gradient-to-r from-emerald-500 to-lime-400" : hpPercent > 25 ? "bg-gradient-to-r from-amber-500 to-yellow-400" : "bg-gradient-to-r from-rose-600 to-red-500 animate-pulse"
            }`}
            style={{ width: `${hpPercent}%` }}
          />
          {/* Subtle Segment lines */}
          <div className="absolute inset-0 flex justify-between px-2 pointer-events-none opacity-40">
            <div className="w-0.5 h-full bg-stone-900" />
            <div className="w-0.5 h-full bg-stone-900" />
            <div className="w-0.5 h-full bg-stone-900" />
          </div>
        </div>

        {/* Magic Potion Vessels */}
        <div className="flex items-center gap-1 mt-0.5">
          <span className="font-arcade text-[9px] text-blue-400 mr-1">MAGIC:</span>
          {Array.from({ length: maxPots }).map((_, idx) => (
            <div
              key={idx}
              className={`w-3.5 h-5 rounded-xs border transition-all ${
                idx < currentPots
                  ? "bg-blue-500 border-blue-300 shadow-[0_0_6px_rgba(59,130,246,0.9)] animate-pulse"
                  : "bg-blue-950/40 border-stone-700 opacity-40"
              } flex items-center justify-center`}
            >
              {idx < currentPots && <div className="w-1.5 h-1.5 rounded-full bg-white/90" />}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <header className="absolute top-0 left-0 right-0 p-3 sm:p-4 z-20 pointer-events-none select-none flex flex-col gap-2">
      {/* Top Row: P1 HUD, Center Stage & Score, P2 HUD */}
      <div className="flex justify-between items-start w-full">
        {/* P1 Left */}
        {renderPlayerStatus(player1, 1)}

        {/* Center: Stage Title & High Score */}
        <div className="flex flex-col items-center">
          <div className="font-arcade text-xs sm:text-sm text-yellow-300 arcade-glow tracking-wider">
            SCORE: {score.toString().padStart(6, "0")}
          </div>
          <div className="font-arcade text-[9px] sm:text-[10px] text-stone-300 mt-1 bg-black/60 px-2 py-0.5 rounded border border-stone-800">
            {stageName}
          </div>
        </div>

        {/* P2 Right */}
        {isCoop ? renderPlayerStatus(player2, 2) : renderPlayerStatus(null, 2)}
      </div>

      {/* Boss Health Bar (Centered if boss active) */}
      {bossEntity && bossEntity.health > 0 && (
        <div className="self-center mt-2 flex flex-col items-center animate-fade-in">
          <div className="font-arcade text-[10px] text-red-500 blood-glow tracking-widest uppercase mb-1">
            {bossEntity.subType === "death_adder" ? "☠ DEATH ADDER ☠" : "BAD BROTHER"}
          </div>
          <div className="w-64 sm:w-80 h-4 bg-stone-950 border-2 border-red-800 rounded overflow-hidden shadow-lg relative">
            <div
              className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 transition-all duration-100"
              style={{ width: `${(bossEntity.health / bossEntity.maxHealth) * 100}%` }}
            />
          </div>
        </div>
      )}
    </header>
  );
};
