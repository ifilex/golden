import React, { useRef, useState, useEffect, useCallback } from "react";
import { inputManager } from "../game/controls";
import { Swords, ArrowUpRight, Zap, FastForward } from "lucide-react";

interface VirtualJoystickProps {
  forceVisible?: boolean;
  sizeSetting?: "small" | "medium" | "large";
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  forceVisible = false,
  sizeSetting = "medium",
}) => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const activeTouchId = useRef<number | null>(null);

  // Dynamic sizing based on viewport and setting
  const getJoystickMetrics = () => {
    const isMobileSmall = typeof window !== "undefined" && window.innerWidth < 640;
    let baseRadius = sizeSetting === "small" ? 55 : sizeSetting === "large" ? 85 : 70;
    if (isMobileSmall) baseRadius = Math.max(50, baseRadius * 0.85);
    const knobRadius = baseRadius * 0.42;
    return { baseRadius, knobRadius };
  };

  const [metrics, setMetrics] = useState(getJoystickMetrics);

  useEffect(() => {
    const handleResize = () => {
      setMetrics(getJoystickMetrics());
    };
    window.addEventListener("resize", handleResize);

    // Detect touch device or mobile/tablet screen
    const touchCheck =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(pointer: coarse)").matches ||
      window.innerWidth <= 1024;
    setIsTouchDevice(touchCheck);

    return () => window.removeEventListener("resize", handleResize);
  }, [sizeSetting]);

  const updateInputFromTouch = useCallback(
    (clientX: number, clientY: number) => {
      if (!joystickBaseRef.current) return;
      const rect = joystickBaseRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = clientX - centerX;
      const deltaY = clientY - centerY;
      const distance = Math.hypot(deltaX, deltaY);
      const maxDistance = metrics.baseRadius - metrics.knobRadius;

      const clampedDist = Math.min(distance, maxDistance);
      const angle = Math.atan2(deltaY, deltaX);

      const posX = Math.cos(angle) * clampedDist;
      const posY = Math.sin(angle) * clampedDist;

      setKnobPos({ x: posX, y: posY });

      // Normalized direction vector (-1 to 1) with deadzone
      const deadzone = 0.15;
      const normDist = clampedDist / maxDistance;
      if (normDist > deadzone) {
        inputManager.virtualTouch.dx = Math.cos(angle);
        inputManager.virtualTouch.dy = Math.sin(angle);
      } else {
        inputManager.virtualTouch.dx = 0;
        inputManager.virtualTouch.dy = 0;
      }
    },
    [metrics]
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    if (activeTouchId.current !== null) return;
    const touch = e.changedTouches[0];
    activeTouchId.current = touch.identifier;
    setIsDragging(true);
    updateInputFromTouch(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === activeTouchId.current) {
        updateInputFromTouch(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === activeTouchId.current) {
        activeTouchId.current = null;
        setIsDragging(false);
        setKnobPos({ x: 0, y: 0 });
        inputManager.virtualTouch.dx = 0;
        inputManager.virtualTouch.dy = 0;
        break;
      }
    }
  };

  // Button triggers
  const setButton = (btn: "attack" | "jump" | "magic" | "dash", val: boolean) => {
    inputManager.virtualTouch[btn] = val;
  };

  if (!isTouchDevice && !forceVisible) {
    return null;
  }

  const baseDiameter = metrics.baseRadius * 2;
  const knobDiameter = metrics.knobRadius * 2;

  return (
    <div
      id="virtual-controls-container"
      className="absolute inset-0 pointer-events-none z-30 select-none overflow-hidden touch-none"
    >
      {/* 1. Transparent Floating Virtual Joystick (Lower-Left Corner) */}
      <div
        id="virtual-joystick-wrapper"
        className="absolute bottom-5 left-5 pointer-events-auto"
        style={{
          width: baseDiameter,
          height: baseDiameter,
        }}
      >
        <div
          ref={joystickBaseRef}
          id="virtual-joystick-base"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className={`relative rounded-full border border-white/20 transition-colors ${
            isDragging ? "bg-black/35 border-amber-400/40" : "bg-black/20"
          } backdrop-blur-xs flex items-center justify-center shadow-lg`}
          style={{
            width: baseDiameter,
            height: baseDiameter,
          }}
        >
          {/* Inner D-pad cross guide */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
            <div className="w-1 h-3/4 bg-white/40 rounded-full" />
            <div className="h-1 w-3/4 bg-white/40 rounded-full absolute" />
          </div>

          {/* Dynamic Knob */}
          <div
            id="virtual-joystick-knob"
            className="absolute rounded-full border border-amber-400/60 bg-gradient-to-br from-amber-400/40 to-amber-600/30 backdrop-blur-sm shadow-md pointer-events-none transition-transform duration-75 flex items-center justify-center"
            style={{
              width: knobDiameter,
              height: knobDiameter,
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            }}
          >
            <div className="w-3 h-3 rounded-full bg-amber-300/80 shadow-xs" />
          </div>
        </div>
      </div>

      {/* 2. Transparent Action Buttons (Lower-Right Corner) */}
      <div
        id="virtual-action-buttons"
        className="absolute bottom-5 right-5 pointer-events-auto flex items-end gap-3 select-none"
      >
        {/* Dash Button */}
        <button
          id="btn-dash"
          onTouchStart={() => setButton("dash", true)}
          onTouchEnd={() => setButton("dash", false)}
          onMouseDown={() => setButton("dash", true)}
          onMouseUp={() => setButton("dash", false)}
          className="w-14 h-14 rounded-full bg-black/30 border border-amber-500/40 backdrop-blur-xs flex flex-col items-center justify-center text-amber-300 active:scale-90 active:bg-amber-500/40 transition-all shadow-md"
        >
          <FastForward className="w-5 h-5" />
          <span className="text-[9px] font-arcade mt-0.5">DASH</span>
        </button>

        {/* Magic Button (Blue) */}
        <button
          id="btn-magic"
          onTouchStart={() => setButton("magic", true)}
          onTouchEnd={() => setButton("magic", false)}
          onMouseDown={() => setButton("magic", true)}
          onMouseUp={() => setButton("magic", false)}
          className="w-15 h-15 rounded-full bg-blue-950/40 border border-blue-400/50 backdrop-blur-xs flex flex-col items-center justify-center text-blue-300 active:scale-90 active:bg-blue-600/50 transition-all shadow-md"
        >
          <Zap className="w-6 h-6" />
          <span className="text-[9px] font-arcade mt-0.5">MAGIC</span>
        </button>

        {/* Jump Button (Green) */}
        <button
          id="btn-jump"
          onTouchStart={() => setButton("jump", true)}
          onTouchEnd={() => setButton("jump", false)}
          onMouseDown={() => setButton("jump", true)}
          onMouseUp={() => setButton("jump", false)}
          className="w-16 h-16 rounded-full bg-emerald-950/40 border border-emerald-400/50 backdrop-blur-xs flex flex-col items-center justify-center text-emerald-300 active:scale-90 active:bg-emerald-600/50 transition-all shadow-md"
        >
          <ArrowUpRight className="w-7 h-7" />
          <span className="text-[10px] font-arcade mt-0.5">JUMP</span>
        </button>

        {/* Attack Button (Red / Main) */}
        <button
          id="btn-attack"
          onTouchStart={() => setButton("attack", true)}
          onTouchEnd={() => setButton("attack", false)}
          onMouseDown={() => setButton("attack", true)}
          onMouseUp={() => setButton("attack", false)}
          className="w-18 h-18 rounded-full bg-rose-950/50 border-2 border-rose-500/70 backdrop-blur-xs flex flex-col items-center justify-center text-rose-200 active:scale-90 active:bg-rose-600/60 transition-all shadow-lg"
        >
          <Swords className="w-8 h-8" />
          <span className="text-[11px] font-arcade font-bold mt-0.5">ATTACK</span>
        </button>
      </div>
    </div>
  );
};
