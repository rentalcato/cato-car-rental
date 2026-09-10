"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleFavorite } from "@/lib/favorites/actions";

/**
 * Heart toggle used on both the Browse Fleet cards/detail page and the
 * Favorites screen. `stopPropagation` matters here — the fleet grid cards
 * are themselves <Link>s (src/app/account/fleet/page.tsx), and this
 * button sits inside them.
 */
export function FavoriteButton({
  vehicleId,
  initialFavorited,
  variant = "icon",
  onRemoved,
}: {
  vehicleId: string;
  initialFavorited: boolean;
  /** "icon" = round overlay button (fleet cards/detail hero); "labeled" = full button with text (Favorites page). */
  variant?: "icon" | "labeled";
  /** Fired after a successful un-favorite — the Favorites page uses this to drop the card immediately. */
  onRemoved?: () => void;
}) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setError(null);
    const optimistic = !isFavorited;
    setIsFavorited(optimistic);
    startTransition(async () => {
      const result = await toggleFavorite(vehicleId);
      if (result.error) {
        setIsFavorited(!optimistic);
        setError(result.error);
        return;
      }
      if (result.isFavorited === false) onRemoved?.();
    });
  }

  if (variant === "labeled") {
    return (
      <div className="flex flex-col items-start gap-1">
        <Button variant="outline" size="sm" disabled={isPending} onClick={handleClick}>
          <Heart className={cn("size-3.5", isFavorited && "fill-destructive text-destructive")} />
          {isFavorited ? "Saved" : "Save"}
        </Button>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleClick}
      aria-pressed={isFavorited}
      title={isFavorited ? "Remove from favorites" : "Save to favorites"}
      className="flex size-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition-transform hover:scale-105 disabled:opacity-60"
    >
      <Heart className={cn("size-4", isFavorited ? "fill-destructive text-destructive" : "text-foreground")} />
      <span className="sr-only">{isFavorited ? "Remove from favorites" : "Save to favorites"}</span>
    </button>
  );
}
