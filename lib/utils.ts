import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/** tailwind-merge precisa conhecer os tokens customizados para não descartá-los como conflito. */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "hero-title",
            "section-title",
            "card-title",
            "subtitle",
            "body-large",
            "body",
            "body-small",
            "label",
            "code",
          ],
        },
      ],
      shadow: [{ shadow: ["elevation-1", "elevation-2", "elevation-3"] }],
      rounded: [{ rounded: ["pill"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
