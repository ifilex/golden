import React from "react";
import { GameSettings } from "../types/game";
import { soundEngine } from "../audio/soundEngine";
import { Settings, X, Volume2, Sliders, Monitor, Gamepad, Keyboard, ShieldAlert, Box } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="settings-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-stone-900 border-2 border-amber-500/60 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <h2 className="font-epic text-lg font-bold tracking-wider text-amber-200">
              GAME CONFIGURATION & CONTROLS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Difficulty Selection */}
          <div className="space-y-2">
            <label className="font-arcade text-xs text-amber-400 flex items-center gap-2">
              <Sliders className="w-4 h-4" /> DIFFICULTY SETTING
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["novice", "arcade", "hardcore"] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => {
                    soundEngine.playHit(false);
                    onUpdateSettings({ difficulty: diff });
                  }}
                  className={`py-2 rounded font-arcade text-[10px] uppercase transition-all cursor-pointer ${
                    settings.difficulty === diff
                      ? "bg-amber-500 text-stone-950 font-bold shadow-md"
                      : "bg-stone-800 text-stone-400 hover:text-stone-200"
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-stone-400 font-fantasy">
              {settings.difficulty === "novice"
                ? "Gentler enemy aggression and higher potion drops for beginners."
                : settings.difficulty === "hardcore"
                ? "Maximum arcade brutality: faster enemies, heavy damage, relentless bosses!"
                : "Authentic 1989 arcade balance and challenge."}
            </p>
          </div>

          {/* Audio Volume Sliders */}
          <div className="space-y-3 bg-stone-950/60 p-3.5 rounded-lg border border-stone-800">
            <label className="font-arcade text-xs text-amber-400 flex items-center gap-2">
              <Volume2 className="w-4 h-4" /> 16-BIT FM SYNTH AUDIO
            </label>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-arcade text-stone-300">
                <span>MUSIC VOLUME:</span>
                <span>{Math.round(settings.musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.musicVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateSettings({ musicVolume: val });
                  soundEngine.setVolumes(val, settings.sfxVolume);
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-arcade text-stone-300">
                <span>SFX VOLUME:</span>
                <span>{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateSettings({ sfxVolume: val });
                  soundEngine.setVolumes(settings.musicVolume, val);
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Video & Display Options */}
          <div className="space-y-3">
            <label className="font-arcade text-xs text-amber-400 flex items-center gap-2">
              <Monitor className="w-4 h-4" /> DISPLAY & GRAPHICS
            </label>
            {/* 3D Minecraft Voxel Mode Toggle */}
            <div className="flex items-center justify-between bg-stone-950/60 p-3 rounded-lg border border-amber-500/30">
              <div>
                <div className="flex items-center gap-2">
                  <Box className="w-4 h-4 text-amber-400" />
                  <span className="font-epic font-bold text-sm text-amber-200">3D Minecraft Voxel Mode</span>
                </div>
                <p className="text-xs text-stone-400 font-fantasy mt-0.5">
                  Renders enemies, bosses, mounts, gnomes, and items as 3D Minecraft-style voxels with authentic 2D arcade combat.
                </p>
              </div>
              <button
                onClick={() => onUpdateSettings({ voxelStyle: settings.voxelStyle === false })}
                className={`px-3 py-1.5 rounded font-arcade text-[10px] cursor-pointer transition-all ${
                  settings.voxelStyle !== false ? "bg-amber-500 text-stone-950 font-bold shadow-lg" : "bg-stone-800 text-stone-400"
                }`}
              >
                {settings.voxelStyle !== false ? "VOXEL 3D" : "2D SPRITE"}
              </button>
            </div>

            <div className="flex items-center justify-between bg-stone-950/60 p-3 rounded-lg border border-stone-800">
              <div>
                <span className="font-epic font-bold text-sm text-stone-200">CRT Scanline Filter</span>
                <p className="text-xs text-stone-400 font-fantasy">
                  Recreates classic arcade cathode ray tube scanlines and phosphor glow.
                </p>
              </div>
              <button
                onClick={() => onUpdateSettings({ crtFilter: !settings.crtFilter })}
                className={`px-3 py-1.5 rounded font-arcade text-[10px] cursor-pointer ${
                  settings.crtFilter ? "bg-emerald-600 text-white font-bold" : "bg-stone-800 text-stone-400"
                }`}
              >
                {settings.crtFilter ? "ACTIVE" : "OFF"}
              </button>
            </div>

            <div className="flex items-center justify-between bg-stone-950/60 p-3 rounded-lg border border-stone-800">
              <div>
                <span className="font-epic font-bold text-sm text-stone-200">Co-Op Friendly Fire</span>
                <p className="text-xs text-stone-400 font-fantasy">
                  When enabled, attacks can damage your partner (classic arcade mode).
                </p>
              </div>
              <button
                onClick={() => onUpdateSettings({ friendlyFire: !settings.friendlyFire })}
                className={`px-3 py-1.5 rounded font-arcade text-[10px] cursor-pointer ${
                  settings.friendlyFire ? "bg-amber-600 text-stone-950 font-bold" : "bg-stone-800 text-stone-400"
                }`}
              >
                {settings.friendlyFire ? "ENABLED" : "DISABLED"}
              </button>
            </div>

            {/* Virtual Joystick Size Option */}
            <div className="flex items-center justify-between bg-stone-950/60 p-3 rounded-lg border border-stone-800">
              <div>
                <span className="font-epic font-bold text-sm text-stone-200">Touch Joystick Size</span>
                <p className="text-xs text-stone-400 font-fantasy">
                  Adjust scale of lower-left transparent virtual joystick on mobile/tablet.
                </p>
              </div>
              <div className="flex gap-1">
                {(["small", "medium", "large"] as const).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => onUpdateSettings({ touchJoystickSize: sz })}
                    className={`px-2.5 py-1 rounded font-arcade text-[9px] uppercase cursor-pointer ${
                      settings.touchJoystickSize === sz
                        ? "bg-amber-500 text-stone-950 font-bold"
                        : "bg-stone-800 text-stone-400"
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Control Guide Table */}
          <div className="space-y-3">
            <label className="font-arcade text-xs text-amber-400 flex items-center gap-2">
              <Keyboard className="w-4 h-4" /> CONTROLLER & KEYBOARD BINDINGS
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Player 1 */}
              <div className="bg-stone-950/80 p-3 rounded-lg border border-stone-800 space-y-1 font-arcade text-[10px]">
                <div className="text-amber-400 font-bold pb-1 border-b border-stone-800">
                  PLAYER 1 CONTROLS
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-stone-400">MOVE / DEPTH:</span>
                  <span className="text-stone-200">W, A, S, D</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-stone-400">ATTACK / COMBO:</span>
                  <span className="text-rose-400 font-bold">J (Button A)</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-stone-400">JUMP:</span>
                  <span className="text-emerald-400 font-bold">K / Space (Btn B)</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-stone-400">MAGIC SPELL:</span>
                  <span className="text-blue-400 font-bold">L (Button Y)</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-stone-400">DASH / RUN:</span>
                  <span className="text-yellow-400">Shift / Double-tap</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-stone-400">DOWN PLUNGE:</span>
                  <span className="text-amber-300">Jump + Down + Attack</span>
                </div>
              </div>

              {/* Player 2 */}
              <div className="bg-stone-950/80 p-3 rounded-lg border border-stone-800 space-y-1 font-arcade text-[10px]">
                <div className="text-emerald-400 font-bold pb-1 border-b border-stone-800">
                  PLAYER 2 CO-OP CONTROLS
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-stone-400">MOVE / DEPTH:</span>
                  <span className="text-stone-200">Arrow Keys</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-stone-400">ATTACK / COMBO:</span>
                  <span className="text-rose-400 font-bold">U / Num 1 (Pad 2)</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-stone-400">JUMP:</span>
                  <span className="text-emerald-400 font-bold">I / Num 2</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-stone-400">MAGIC SPELL:</span>
                  <span className="text-blue-400 font-bold">O / Num 3</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-stone-400">DASH / RUN:</span>
                  <span className="text-yellow-400">R-Shift / Num 0</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-stone-400">GAMEPAD 2:</span>
                  <span className="text-emerald-300">Auto-detected</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-950 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-arcade text-xs font-bold rounded cursor-pointer transition-colors shadow"
          >
            CONFIRM & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
