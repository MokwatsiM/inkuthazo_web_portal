import {
  Package,
  Sofa,
  Car,
  MonitorSmartphone,
  Boxes,
  type LucideIcon,
} from "lucide-react";
import type { AssetCategory } from "../types/asset";

interface CategoryVisual {
  Icon: LucideIcon;
  /** Gradient for the list/detail icon tile. */
  tile: string;
  /** Soft badge classes for the category chip (light + dark). */
  chip: string;
}

/**
 * Per-category icon + color so the asset register is scannable by TYPE at a
 * glance, instead of every row wearing the same purple box. Each category owns
 * a distinct hue; the tile gradient and chip share it for cohesion.
 */
const VISUALS: Record<AssetCategory, CategoryVisual> = {
  equipment: {
    Icon: Package,
    tile: "from-purple-500 to-purple-600",
    chip: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  },
  furniture: {
    Icon: Sofa,
    tile: "from-amber-500 to-amber-600",
    chip: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  },
  vehicle: {
    Icon: Car,
    tile: "from-sky-500 to-sky-600",
    chip: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  },
  electronics: {
    Icon: MonitorSmartphone,
    tile: "from-teal-500 to-teal-600",
    chip: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  },
  other: {
    Icon: Boxes,
    tile: "from-slate-500 to-slate-600",
    chip: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
};

export const assetCategoryVisual = (category: AssetCategory): CategoryVisual =>
  VISUALS[category] ?? VISUALS.other;
