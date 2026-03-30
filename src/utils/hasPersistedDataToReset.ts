import { hasPersistedStorage } from '../../assets/js/app/persistence';
import { hasPersistedCanvasAppViewPreference } from './appViewStorage';
import { hasCanvasPlacementStylePersisted } from './canvasPlacementStyleStorage';
import { hasCanvasResultsSidebarVisibilityPersisted } from './canvasResultsSidebarStorage';
import { hasCanvasResultsSidebarWidthPersisted } from './canvasResultsSidebarWidthStorage';
import { hasCanvasSidebarExpandedPersisted } from './canvasSidebarStorage';
import { hasCanvasWorkspacePersisted } from './canvasWorkspaceStorage';

/** True when Reset would remove at least one persisted key (main app state, canvas workspace, or canvas UI). */
export function hasPersistedDataToReset(): boolean {
  return (
    hasPersistedStorage() ||
    hasPersistedCanvasAppViewPreference() ||
    hasCanvasWorkspacePersisted() ||
    hasCanvasResultsSidebarWidthPersisted() ||
    hasCanvasResultsSidebarVisibilityPersisted() ||
    hasCanvasPlacementStylePersisted() ||
    hasCanvasSidebarExpandedPersisted()
  );
}
