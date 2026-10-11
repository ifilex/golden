import React, { useState, useEffect } from "react";
import { ShopItem, HeroId } from "../types/game";
import { soundEngine } from "../audio/soundEngine";
import { Shield, Sparkles, Coins, X, Check, Lock, Sword, Flame, Crown } from "lucide-react";

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  gold: number;
  onEquipCosmetic: (item: ShopItem) => void;
  onSpendGold: (amount: number) => void;
  equippedItems: Record<string, string>; // category -> itemId
}

export const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  onClose,
  gold,
  onEquipCosmetic,
  onSpendGold,
  equippedItems,
}) => {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("golden_axe_unlocked_cosmetics");
      return saved ? new Set(JSON.parse(saved)) : new Set(["default"]);
    } catch {
      return new Set(["default"]);
    }
  });
  const [activeCategory, setActiveCategory] = useState<"all" | "skin" | "weapon" | "aura" | "title">("all");

  useEffect(() => {
    if (isOpen) {
      fetchShopItems();
    }
  }, [isOpen]);

  const fetchShopItems = async () => {
    try {
      const res = await fetch("/api/shop");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch {
      console.warn("Failed to load shop items from API");
    }
  };

  const handleBuy = (item: ShopItem) => {
    if (gold < item.cost) {
      soundEngine.playHit(false);
      return;
    }

    soundEngine.playCoin();
    onSpendGold(item.cost);
    const newUnlocked = new Set(unlockedIds);
    newUnlocked.add(item.id);
    setUnlockedIds(newUnlocked);
    localStorage.setItem("golden_axe_unlocked_cosmetics", JSON.stringify([...newUnlocked]));

    // Auto-equip upon purchase
    onEquipCosmetic(item);
  };

  const handleEquip = (item: ShopItem) => {
    soundEngine.playMeatCollect();
    onEquipCosmetic(item);
  };

  if (!isOpen) return null;

  const filteredItems = items.filter((item) => {
    if (activeCategory !== "all" && item.category !== activeCategory) return false;
    return true;
  });

  return (
    <div
      id="shop-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-stone-900 border-2 border-amber-500/60 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sword className="w-5 h-5 text-amber-400" />
            <h2 className="font-epic text-lg font-bold tracking-wider text-amber-200">
              YURIA ARMORY & CUSTOMIZATION
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Player Gold Balance */}
            <div className="flex items-center gap-1.5 bg-amber-950/60 border border-amber-500/50 px-3 py-1 rounded-full text-amber-300 font-arcade text-xs">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span>{gold.toLocaleString()} GOLD</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="px-4 py-2.5 bg-stone-950/50 border-b border-stone-800 flex items-center gap-2 overflow-x-auto">
          {(["all", "skin", "weapon", "aura", "title"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded font-arcade text-[10px] uppercase transition-all cursor-pointer ${
                activeCategory === cat
                  ? "bg-amber-500 text-stone-950 font-bold"
                  : "bg-stone-800 text-stone-400 hover:text-stone-200"
              }`}
            >
              {cat === "all" ? "ALL ITEMS" : cat + "S"}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isUnlocked = unlockedIds.has(item.id);
            const isEquipped = equippedItems[item.category] === item.id;
            const canAfford = gold >= item.cost;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl bg-stone-950/80 border transition-all flex flex-col justify-between shadow-lg relative ${
                  isEquipped
                    ? "border-amber-400 bg-amber-950/20 shadow-[0_0_12px_rgba(234,179,8,0.2)]"
                    : isUnlocked
                    ? "border-emerald-600/40 hover:border-emerald-500"
                    : "border-stone-800 hover:border-stone-700"
                }`}
              >
                <div>
                  {/* Category & Hero Tag */}
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-arcade text-[8px] uppercase tracking-wider px-2 py-0.5 rounded bg-stone-800 text-stone-400">
                      {item.category} • {item.hero}
                    </span>
                    {isEquipped && (
                      <span className="flex items-center gap-1 font-arcade text-[8px] text-amber-400 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded">
                        <Check className="w-3 h-3" /> EQUIPPED
                      </span>
                    )}
                  </div>

                  {/* Icon Visual */}
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center my-2 border border-stone-800 shadow-inner"
                    style={{ backgroundColor: `${item.color}25` }}
                  >
                    {item.category === "weapon" ? (
                      <Sword className="w-6 h-6" style={{ color: item.color }} />
                    ) : item.category === "aura" ? (
                      <Flame className="w-6 h-6" style={{ color: item.color }} />
                    ) : item.category === "title" ? (
                      <Crown className="w-6 h-6" style={{ color: item.color }} />
                    ) : (
                      <Shield className="w-6 h-6" style={{ color: item.color }} />
                    )}
                  </div>

                  {/* Name & Desc */}
                  <h4 className="font-epic text-sm font-bold text-stone-100">{item.name}</h4>
                  <p className="text-xs text-stone-400 font-fantasy mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                {/* Bottom Action Button */}
                <div className="mt-4 pt-3 border-t border-stone-900 flex items-center justify-between">
                  {isUnlocked ? (
                    <button
                      onClick={() => handleEquip(item)}
                      disabled={isEquipped}
                      className={`w-full py-1.5 rounded font-arcade text-[10px] transition-all cursor-pointer ${
                        isEquipped
                          ? "bg-stone-800 text-stone-500 cursor-default"
                          : "bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold"
                      }`}
                    >
                      {isEquipped ? "IN USE" : "EQUIP ITEM"}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuy(item)}
                      disabled={!canAfford}
                      className={`w-full py-2 rounded font-arcade text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        canAfford
                          ? "bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold shadow-md"
                          : "bg-stone-800 text-stone-500 cursor-not-allowed"
                      }`}
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>UNLOCK ({item.cost} G)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-950 border-t border-stone-800 flex justify-between items-center text-[10px] font-arcade text-stone-500">
          <span>COSMETIC VISUAL ENHANCEMENTS ONLY</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded transition-colors cursor-pointer"
          >
            RETURN
          </button>
        </div>
      </div>
    </div>
  );
};
