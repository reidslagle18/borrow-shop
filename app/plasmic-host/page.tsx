"use client";

import * as React from "react";
import { PlasmicCanvasHost } from "@plasmicapp/loader-nextjs";
// Importing the loader registers all code components so they appear in Studio.
import "@/plasmic-init";

/* The page Plasmic Studio loads in its canvas iframe. Point the project's host
   URL at <this-deployment>/plasmic-host and the BORROW sections show up in the
   editor. This route renders nothing for normal visitors. */
export default function PlasmicHostPage() {
  return <PlasmicCanvasHost />;
}
