import React, { useState, useEffect } from "react";
import { Achievement } from "../types/game";
import { Award, X, CheckCircle, Lock, Trophy } from "lucide-react";

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  unlockedMap: Record<string, boolean>;
}

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: "blood_warrior",
    title: "Blood Warrior",
    description: "Slay 25 enemies in your quest across Yuria.",
    icon: "sword",
    unlocked: false,
  },
  {
    id: "beast_rider",
    title: "Bizarrian Cavalier",
    description: "Mount and ride either the Cockatrice or the Fire Dragon.",
    icon: "mount",
    unlocked: false,
  },
  {
    id: "elemental_wrath",
    title: "Wrath of the Gods",
    description: "Consume magic potions and unleash a full-screen elemental spell.",
    icon: "magic",
    unlocked: false,
  },
  {
    id: "adder_bane",
    title: "Tyrant's Bane",
    description: "Defeat Death Adder in his inner sanctum.",
    icon: "trophy",
    unlocked: false,
  },
  {
    id: "coop_brothers",
    title: "Brotherhood in Arms",
    description: "Embark on a battle with 2-Player Local Co-Op mode.",
    icon: "users",
    unlocked: false,
  },
  {
    id: "golden_champion",
    title: "Axe Warriors Champion",
    description: "Clear all 4 stages and reclaim the sacred Axe of Warriors.",
    icon: "axe",
    unlocked: false,
  },
  {
    id: "potion_hoarder",
    title: "Gnome Punisher",
    description: "Kick thieves and gather magic potions to fill your flasks.",
    icon: "potion",
    unlocked: false,
  },
  {
    id: "downward_plunge",
    title: "Meteor Plunge",
    description: "Execute a plunging aerial dive attack into the earth.",
    icon: "plunge",
    unlocked: false,
  },
];

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  isOpen,
  onClose,
  unlockedMap,
}) => {
  if (!isOpen) return null;

  const totalCount = DEFAULT_ACHIEVEMENTS.length;
  const unlockedCount = DEFAULT_ACHIEVEMENTS.filter((a) => unlockedMap[a.id]).length;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);

  return (
    <div
      id="achievements-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-stone-900 border-2 border-amber-500/60 rounded-xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="font-epic text-lg font-bold tracking-wider text-amber-200">
              MEDALS & ACHIEVEMENTS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Progress Bar */}
        <div className="p-4 bg-stone-950/60 border-b border-stone-800 flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs font-arcade">
            <span className="text-stone-400">UNLOCKED:</span>
            <span className="text-amber-300 font-bold">
              {unlockedCount} / {totalCount} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-3 bg-stone-950 border border-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {DEFAULT_ACHIEVEMENTS.map((ach) => {
            const isUnlocked = Boolean(unlockedMap[ach.id]);
            return (
              <div
                key={ach.id}
                className={`p-3 rounded-lg border transition-all flex items-start gap-3 ${
                  isUnlocked
                    ? "bg-amber-950/20 border-amber-500/50 shadow-md"
                    : "bg-stone-950/40 border-stone-800 opacity-60"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                    isUnlocked
                      ? "bg-amber-500/20 border-amber-400 text-amber-300"
                      : "bg-stone-900 border-stone-800 text-stone-600"
                  }`}
                >
                  {isUnlocked ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4
                      className={`font-epic text-sm font-bold ${
                        isUnlocked ? "text-amber-200" : "text-stone-400"
                      }`}
                    >
                      {ach.title}
                    </h4>
                    {isUnlocked && (
                      <span className="font-arcade text-[8px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                        COMPLETED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400 font-fantasy mt-1 leading-relaxed">
                    {ach.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-950 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-xs font-arcade transition-colors cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
