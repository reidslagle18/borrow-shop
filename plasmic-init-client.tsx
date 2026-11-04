"use client";

import * as React from "react";
import { PlasmicRootProvider } from "@plasmicapp/loader-nextjs";
import { PLASMIC } from "./plasmic-init";

/* The loader object can't cross the server→client boundary, so pages render the
   Plasmic tree through this client wrapper, passing the data they prefetched on
   the server. */
export function PlasmicClientRootProvider(
  props: Omit<React.ComponentProps<typeof PlasmicRootProvider>, "loader">
) {
  return <PlasmicRootProvider loader={PLASMIC} {...props} />;
}
