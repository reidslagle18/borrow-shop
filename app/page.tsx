import HomeClient from "./HomeClient";
import type { HeroSlide } from "@/components/HeroMedia";
import { tryPlasmicPage } from "@/components/plasmic/PlasmicEditable";

// Refresh published Plasmic edits within 5 min without a redeploy; also keeps the
// last good build cached so the page survives a Plasmic outage.
export const revalidate = 300;

/**
 * Server wrapper: fetch the hero slides (with their saved crops) on the server so
 * the cropped hero is present in the first server-rendered HTML — the browser
 * never paints the uncropped fallback and then jumps to the crop. Everything else
 * stays in the client component.
 */
async function getHeroSlides(): Promise<HeroSlide[] | null> {
  const base = process.env.ADMIN_API_BASE;
  if (!base) return null;
  try {
    const res = await fetch(`${base}/api/public/config`, { cache: "no-store" });
    if (!res.ok) return null;
    const c = await res.json();
    return Array.isArray(c?.hero) && c.hero.length > 0 ? (c.hero as HeroSlide[]) : null;
  } catch {
    return null;
  }
}

export default async function Page() {
  // If a homepage has been published in Plasmic, render that; otherwise fall back
  // to the hand-coded homepage (so it looks identical until it's edited).
  const plasmic = await tryPlasmicPage("/");
  if (plasmic) return plasmic;

  const initialHero = await getHeroSlides();
  return <HomeClient initialHero={initialHero} />;
}
