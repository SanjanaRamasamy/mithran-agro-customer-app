"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Produce emoji map — used for tasteful gradient fallbacks when an image
 * URL is unavailable (mock data must never show a broken image).
 */
const PRODUCE_EMOJI: Record<string, string> = {
  apple: "🍎", banana: "🍌", spinach: "🥬", tomato: "🍅", carrot: "🥕",
  broccoli: "🥦", avocado: "🥑", strawberry: "🍓", mango: "🥭", orange: "🍊",
  grapes: "🍇", bellpepper: "🫑", bell: "🫑", capsicum: "🫑", cucumber: "🥒",
  potato: "🥔", onion: "🧅", garlic: "🧄", lettuce: "🥬", kale: "🥬",
  blueberry: "🫐", watermelon: "🍉", pineapple: "🍍", papaya: "🍈",
  pomegranate: "🍒", mushroom: "🍄", coriander: "🌿", cilantro: "🌿",
  ginger: "🫚", lemon: "🍋", peas: "🫛", cauliflower: "🥬", beetroot: "🍆",
  herb: "🌿", fruit: "🍎", vegetable: "🥕", leafy: "🥬", exotic: "🥑",
  seasonal: "🧺", organic: "🌱", farm: "🚜", farmer: "🧑‍🌾", basket: "🧺",
  /* marketplace departments */
  rice: "🍚", millet: "🌾", grain: "🌾", wheat: "🌾", dal: "🫘", pulse: "🫘",
  lentil: "🫘", bean: "🫘", spice: "🌶️", turmeric: "🟡", chilli: "🌶️",
  pepper: "🌶️", honey: "🍯", jaggery: "🟤", ghee: "🧈", milk: "🥛",
  paneer: "🧈", curd: "🥛", egg: "🥚", tea: "🍵", coffee: "☕",
  beverage: "🧃", juice: "🧃", pickle: "🥒", papad: "🫓", chikki: "🍬",
  salt: "🧂", dryfruit: "🍇", date: "🌴", raisin: "🍇", nut: "🥜",
  almond: "🥜", walnut: "🌰", cashew: "🥜", chia: "🌱", oil: "🫗",
  fertilizer: "🌱", compost: "🪱", vermicompost: "🪱", manure: "🪱",
  cocopeat: "🥥", "potting mix": "🪴", soil: "🪴", neem: "🌿",
  panchagavya: "🐄", seaweed: "🌊", micronutrient: "💊", trichoderma: "🧫",
  pest: "🐛", bio: "🧫", seed: "🌱", seedling: "🌱", sapling: "🌱",
  plant: "🪴", monstera: "🪴", succulent: "🌵", cactus: "🌵", bonsai: "🪴",
  tulsi: "🌿", aloe: "🌿", hibiscus: "🌺", jasmine: "🌼", flower: "🌸",
  bougainvillea: "🌸", croton: "🌿", jade: "🪴", tree: "🌳",
  tool: "🧰", trowel: "🧰", pruner: "✂️", shears: "✂️", glove: "🧤",
  "grow bag": "👜", growbag: "👜", pot: "🪴", terracotta: "🪴",
  sprayer: "💦", watering: "🚿", drip: "💧", sprinkler: "💦",
  tractor: "🚜", weeder: "🚜", "shade net": "⛱️", shadenet: "⛱️",
  mulch: "🟫", tray: "📦", nursery: "🌱", irrigation: "💧",
  saree: "🥻", sari: "🥻", silk: "🥻", kurti: "👚", kurta: "👕",
  salwar: "🥻", legging: "🧦", dupatta: "🧣", shawl: "🧣", top: "👚",
  shirt: "👕", "t-shirt": "👕", tshirt: "👕", dress: "👗", frock: "👗",
  jacket: "🧥", denim: "👖", jean: "👖", pants: "👖", trouser: "👖",
  chino: "👖", nightwear: "🌙", nighty: "🌙", baby: "👶", infant: "👶",
  romper: "👶", onesie: "👶", kids: "🧒", boys: "🧒", girls: "👧",
};

export function produceEmoji(seed?: string): string {
  if (!seed) return "🧺";
  const key = seed.toLowerCase();
  for (const [k, emoji] of Object.entries(PRODUCE_EMOJI)) {
    if (key.includes(k)) return emoji;
  }
  return "🧺";
}

interface SmartImageProps {
  src?: string;
  alt: string;
  emojiSeed?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
  rounded?: string;
}

/**
 * Image that gracefully degrades to a sage gradient + produce emoji when
 * the src is empty or fails to load. Keeps mock data visually premium.
 */
export function SmartImage({
  src,
  alt,
  emojiSeed,
  className,
  sizes,
  priority,
  fill = true,
  width,
  height,
  rounded = "rounded-xl",
}: SmartImageProps) {
  const emoji = useMemo(() => produceEmoji(emojiSeed ?? alt), [emojiSeed, alt]);
  const [failed, setFailed] = useState(false);
  const showFallback = !src || failed;

  if (showFallback) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-forest-50 via-soft to-lime-soft",
          rounded,
          className
        )}
      >
        <span className="text-[2.5rem] leading-none drop-shadow-sm sm:text-[3rem]" aria-hidden>
          {emoji}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", rounded, className)}>
      {fill ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes ?? "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"}
          priority={priority}
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <Image
          src={src}
          alt={alt}
          width={width ?? 400}
          height={height ?? 300}
          sizes={sizes}
          priority={priority}
          className="object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
