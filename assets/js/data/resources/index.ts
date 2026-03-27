import type { ResourcesMap } from "../../contracts";
import { naturalResources } from "./natural";
import { semiProcessedResources } from "./semi-processed";
import { craftedResources } from "./crafted";
import { foodMedicalResources } from "./food-medical";
import { petrochemicalResources } from "./petrochemical";
import { powerNuclearResources } from "./power-nuclear";
import { wastePollutionResources } from "./waste-pollution";

/** Full game resource graph (from wiki Cargo RecipesImport). */
export const resources: ResourcesMap = {
  ...naturalResources,
  ...semiProcessedResources,
  ...craftedResources,
  ...foodMedicalResources,
  ...petrochemicalResources,
  ...powerNuclearResources,
  ...wastePollutionResources,
};
