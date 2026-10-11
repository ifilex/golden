import React, { useState, useEffect } from "react";
import { LeaderboardEntry, HeroId } from "../types/game";
import { Trophy, X, Filter, Smartphone, Monitor, Gamepad2, Award } from "lucide-react";

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userScoreToSubmit?: { score: number; stage: number; kills: number; hero: HeroId; coop: boolean } | null;
  onScoreSubmitted?: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  userScoreToSubmit,
  onScoreSubmitted,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [filterHero, setFilterHero] = useState<"all" | HeroId>("all");
  const [playerName, setPlayerName] = useState<string>("WARRIOR");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen]);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("/api/leaderboard");
      if (res.ok) {
        const data = await res.json();
        setEntries(data.leaderboard || []);
      }
    } catch (err) {
      console.warn("Failed to fetch leaderboard from API, fallback to local");
    }
  };

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userScoreToSubmit || hasSubmitted) return;

    setIsSubmitting(true);
    const platform =
      window.innerWidth <= 768 ? "Mobile" : "Desktop";

    try {
      const res = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName,
          hero: userScoreToSubmit.hero,
          score: userScoreToSubmit.score,
          stage: userScoreToSubmit.stage,
          kills: userScoreToSubmit.kills,
          coop: userScoreToSubmit.coop,
          platform,
        }),
      });

      if (res.ok) {
        setHasSubmitted(true);
        fetchLeaderboard();
        onScoreSubmitted?.();
      }
    } catch (err) {
      console.error("Score submission error", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filteredEntries = entries.filter((e) => {
    if (filterHero !== "all" && e.hero !== filterHero) return false;
    return true;
  });

  return (
    <div
      id="leaderboard-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-stone-900 border-2 border-amber-500/60 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h2 className="font-epic text-lg font-bold tracking-wider text-amber-200">
              ARCADE HALL OF FAME
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score Submission Banner if Game Just Ended */}
        {userScoreToSubmit && !hasSubmitted && (
          <form
            onSubmit={handleSubmitScore}
            className="p-3 bg-amber-950/40 border-b border-amber-600/40 flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-yellow-400" />
              <div>
                <p className="font-arcade text-[10px] text-amber-300">
                  NEW SCORE: {userScoreToSubmit.score.toLocaleString()} PTS
                </p>
                <p className="text-xs text-stone-400 font-fantasy">
                  Stage {userScoreToSubmit.stage} • {userScoreToSubmit.kills} Kills
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={10}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                placeholder="YOUR NAME"
                className="w-28 px-2 py-1 bg-stone-950 border border-amber-500/60 rounded font-arcade text-xs text-amber-300 uppercase tracking-widest text-center"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-arcade text-[10px] rounded font-bold transition-all cursor-pointer shadow"
              >
                {isSubmitting ? "SAVING..." : "REGISTER"}
              </button>
            </div>
          </form>
        )}

        {/* Hero Filter Bar */}
        <div className="px-4 py-2 bg-stone-950/60 border-b border-stone-800 flex items-center justify-between text-xs">
          <span className="font-arcade text-[9px] text-stone-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> FILTER HERO:
          </span>
          <div className="flex gap-1">
            {(["all", "ax", "tyris", "gilius"] as const).map((h) => (
              <button
                key={h}
                onClick={() => setFilterHero(h)}
                className={`px-2.5 py-1 rounded font-arcade text-[9px] transition-all cursor-pointer ${
                  filterHero === h
                    ? "bg-amber-500 text-stone-950 font-bold"
                    : "bg-stone-800 text-stone-400 hover:text-stone-200"
                }`}
              >
                {h.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* High Scores List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-stone-800">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12 text-stone-500 font-arcade text-xs">
              NO RECORDS LOGGED YET
            </div>
          ) : (
            filteredEntries.map((entry, index) => {
              const isTop3 = index < 3;
              return (
                <div
                  key={entry.id || index}
                  className="py-2.5 flex items-center justify-between gap-2 hover:bg-stone-800/40 px-2 rounded transition-colors"
                >
                  {/* Rank & Name */}
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-arcade text-xs w-6 text-center ${
                        index === 0
                          ? "text-yellow-400 font-bold text-sm"
                          : index === 1
                          ? "text-stone-300 font-bold"
                          : index === 2
                          ? "text-amber-600 font-bold"
                          : "text-stone-500"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-arcade text-xs text-stone-200 tracking-wider">
                          {entry.playerName}
                        </span>
                        {entry.coop && (
                          <span className="px-1 py-0.2 bg-emerald-950 text-emerald-400 border border-emerald-800 text-[8px] font-arcade rounded">
                            2P
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-500 font-fantasy">
                        {entry.stageName || `Stage ${entry.stage}`} • {entry.kills} kills
                      </span>
                    </div>
                  </div>

                  {/* Hero & Platform Badge */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-stone-400 text-xs">
                      {entry.platform === "Mobile" ? (
                        <Smartphone className="w-3.5 h-3.5" />
                      ) : entry.platform === "Gamepad" ? (
                        <Gamepad2 className="w-3.5 h-3.5" />
                      ) : (
                        <Monitor className="w-3.5 h-3.5" />
                      )}
                      <span className="font-arcade text-[9px] uppercase text-stone-400">
                        {entry.hero}
                      </span>
                    </div>

                    {/* Score */}
                    <span
                      className={`font-arcade text-xs ${
                        isTop3 ? "text-amber-400 font-bold" : "text-stone-300"
                      }`}
                    >
                      {entry.score.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-950 border-t border-stone-800 flex justify-between items-center text-stone-500 text-[10px] font-arcade">
          <span>WORLDWIDE ONLINE SERVERS</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded transition-colors cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
