import * as React from "react";
import { PlasmicComponent } from "@plasmicapp/loader-nextjs";
import { PLASMIC } from "@/plasmic-init";
import { PlasmicClientRootProvider } from "@/plasmic-init-client";

/* Try to render a PUBLISHED Plasmic page for `path`.

   Returns null when there is no published Plasmic page at that path, or when
   Plasmic can't be reached — so every caller can fall back to its coded version.
   That's what keeps the site working if the editor is down: the last build still
   serves real pages, and an API hiccup just means the code fallback renders. */
export async function tryPlasmicPage(path: string): Promise<React.ReactElement | null> {
  let data;
  try {
    data = await PLASMIC.maybeFetchComponentData(path);
  } catch {
    return null; // Plasmic unreachable → caller renders the coded fallback
  }
  if (!data || !data.entryCompMetas || data.entryCompMetas.length === 0) {
    return null; // nothing published at this path yet
  }
  return (
    <PlasmicClientRootProvider prefetchedData={data}>
      <PlasmicComponent component={path} />
    </PlasmicClientRootProvider>
  );
}
