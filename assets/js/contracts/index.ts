export interface Recipe {
  name: string;
  building: string;
  durationSec: number;
  /** Quantities consumed per recipe cycle */
  inputs: Record<string, number>;
  /** Quantities produced per recipe cycle (includes byproducts) */
  outputs: Record<string, number>;
}

export interface ResourceDef {
  label: string;
  unit: string;
  /** Link to the corresponding wiki article */
  wikiUrl: string;
  /** Direct URL to the wiki icon image (File:{label}.png), or empty if not found */
  imageUrl: string;
  recipes: Recipe[];
}

export type ResourcesMap = Record<string, ResourceDef>;

export interface DependencyNode {
  id: string;
  label: string;
  amount: number;
  children: DependencyNode[];
}

export interface ResolveResult {
  totals: Record<string, number>;
  tree: DependencyNode;
}

export interface CalculationResult extends ResolveResult {
  resourceId: string;
  targetRate: number;
}

export type NetStatus = 'surplus' | 'deficit' | 'balanced';

export interface NetEntry {
  required: number;
  production: number;
  net: number;
  status: NetStatus;
}

export interface FormattedTotal {
  id: string;
  label: string;
  amount: number;
  unit: string;
}

export interface FormattedNetTotal extends FormattedTotal {
  required: number;
  production: number;
  net: number;
  status: NetStatus;
}

export interface FormattedNode {
  id: string;
  label: string;
  amount: number;
  unit: string;
  depth: number;
  children: FormattedNode[];
}

export interface FlattenedNode extends FormattedTotal {
  depth: number;
}

export interface ProductionPreset {
  id: string;
  name: string;
  production: Record<string, number>;
  productionExtraIds: string[];
  /** UI grouping (built-ins); user presets default to "Saved" in the dropdown. */
  category?: string;
  /** Shipped presets; never persisted and cannot be deleted. */
  isBuiltin?: boolean;
}

/** Which results panel sections are expanded (`<details open>`). */
export interface ResultsSectionsState {
  base: boolean;
  net: boolean;
  tree: boolean;
}

/** Which configuration panel sections are expanded (`<details open>`). */
export interface InputsSectionsState {
  production: boolean;
  presets: boolean;
}

/** Net flow chart visualization (bottom of page). */
export type NetFlowChartStyle =
  | "horizontal-grouped"
  | "vertical-grouped"
  | "line";

export const NET_FLOW_CHART_STYLE_DEFAULT: NetFlowChartStyle = "line";

export interface AppState {
  resourceId: string;
  targetRate: number;
  /**
   * Index into {@link ResourceDef.recipes} for the current target resource.
   * Must be a recipe that lists the target in `outputs`.
   */
  targetRecipeIdx: number;
  production: Record<string, number>;
  /** Resources the user explicitly added for production (not in current chain). */
  productionExtraIds: string[];
  /** Chain resources hidden from the production panel until target changes or re-added. */
  productionDismissedIds: string[];
  /** Saved production + extra-id sets. */
  productionPresets: ProductionPreset[];
  /** Collapsible results sections (Base / Net Flow / Dependency Tree). */
  resultsSections: ResultsSectionsState;
  /** Collapsible configuration sections (production / presets). */
  inputsSections: InputsSectionsState;
  /** Chart.js presentation for the net flow chart. */
  netFlowChartStyle: NetFlowChartStyle;
  /** Top-of-page user guide `<details>` expanded. */
  userGuideExpanded: boolean;
}

export interface PersistedEnvelope {
  version: number;
  savedAt: number;
  data: AppState;
}
