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

export interface AppState {
  resourceId: string;
  targetRate: number;
  production: Record<string, number>;
  /** Resources the user explicitly added for production (not in current chain). */
  productionExtraIds: string[];
  /** Chain resources hidden from the production panel until target changes or re-added. */
  productionDismissedIds: string[];
  /** Saved production + extra-id sets. */
  productionPresets: ProductionPreset[];
}

export interface PersistedEnvelope {
  version: number;
  savedAt: number;
  data: AppState;
}
