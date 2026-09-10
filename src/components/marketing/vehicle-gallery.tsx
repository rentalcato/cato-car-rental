"use client";

import { useState } from "react";
import Image from "next/image";
import { Expand } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Main image + thumbnail strip + fullscreen lightbox for the Vehicle
 * Details page. Degrades gracefully to a single non-interactive image
 * when there's only one photo (real upload count varies per vehicle —
 * see lib/marketing/queries.ts's `imageUrls`).
 */
export function VehicleGallery({ images, alt }: { images: string[]; alt: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const hasMultiple = images.length > 1;
  const active = images[activeIndex] ?? images[0]!;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="group relative block aspect-4/3 w-full overflow-hidden rounded-xl bg-muted"
      >
        <Image
          src={active}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
        <span className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur transition-opacity group-hover:opacity-100 sm:opacity-0">
          <Expand className="size-3.5" />
          View fullscreen
        </span>
      </button>

      {hasMultiple ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, index) => (
            <button
              key={src + index}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show image ${index + 1}`}
              aria-current={index === activeIndex}
              className={cn(
                "relative aspect-4/3 w-20 shrink-0 overflow-hidden rounded-lg ring-2 ring-transparent transition-all sm:w-24",
                index === activeIndex ? "ring-primary" : "opacity-70 hover:opacity-100"
              )}
            >
              <Image src={src} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl bg-black p-2 text-white ring-0 sm:max-w-4xl">
          <DialogTitle className="sr-only">{alt} — fullscreen photo</DialogTitle>
          <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg bg-black sm:aspect-16/10">
            <Image src={active} alt={alt} fill sizes="100vw" className="object-contain" />
          </div>
          {hasMultiple ? (
            <div className="flex justify-center gap-2 pt-3">
              {images.map((src, index) => (
                <button
                  key={src + index}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Show image ${index + 1}`}
                  className={cn(
                    "size-2 rounded-full transition-colors",
                    index === activeIndex ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                />
              ))}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
