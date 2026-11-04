import LookbookClient from "./LookbookClient";
import { tryPlasmicPage } from "@/components/plasmic/PlasmicEditable";

export const revalidate = 300;

/* Server wrapper: render a published Plasmic /lookbook page if one exists,
   otherwise the current coded lookbook (identical until it's edited). */
export default async function LookbookPage() {
  const plasmic = await tryPlasmicPage("/lookbook");
  if (plasmic) return plasmic;
  return <LookbookClient />;
}
