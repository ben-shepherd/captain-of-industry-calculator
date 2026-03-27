export interface Recipe {
  name: string;
  output: number;
  inputs: Record<string, number>;
}

export interface ResourceDef {
  label: string;
  unit: string;
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

export interface AppState {
  resourceId: string;
  targetRate: number;
  production: Record<string, number>;
}

export interface PersistedEnvelope {
  version: number;
  savedAt: number;
  data: AppState;
}
