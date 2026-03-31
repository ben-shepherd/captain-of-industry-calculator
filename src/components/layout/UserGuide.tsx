import { useEffect, useRef } from 'react';
import { useCoiStore } from '../../../assets/js/app/coiExternalStore';
import { setUserGuideVisible } from '../../../assets/js/app/state';

export type UserGuideActiveView = 'calculator' | 'canvas';

type Props = {
  activeView: UserGuideActiveView;
};

export function UserGuide({ activeView }: Props) {
  const state = useCoiStore();
  const visible = state.userGuideVisible;
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (visible) {
      if (!el.open) el.showModal();
    } else if (el.open) {
      el.close();
    }
  }, [visible]);

  const titleId =
    activeView === 'canvas' ? 'user-guide-dialog-title-canvas' : 'user-guide-dialog-title-calc';

  return (
    <dialog
      ref={dialogRef}
      id="user-guide-dialog"
      className={[
        'user-guide-dialog',
        activeView === 'canvas' ? 'user-guide-dialog--canvas' : 'user-guide-dialog--calculator',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-labelledby={titleId}
      onClose={() => setUserGuideVisible(false)}
    >
      <div className="user-guide-dialog-inner">
        <div className="user-guide-dialog-header">
          <h2 id={titleId} className="user-guide-dialog-title">
            {activeView === 'calculator' ? 'How to use the calculator' : 'How to use the canvas'}
          </h2>
          <button
            type="button"
            className="btn btn-secondary user-guide-dialog-close"
            aria-label="Close help"
            onClick={() => setUserGuideVisible(false)}
          >
            Close
          </button>
        </div>
        <div className="user-guide-dialog-body">
          {activeView === 'calculator' ? <CalculatorHelp /> : <CanvasHelp />}
        </div>
      </div>
    </dialog>
  );
}

function CalculatorHelp() {
  return (
    <ul className="user-guide-list">
      <li>
        <strong>Target</strong> — Use search or browse by category, then set your desired{' '}
        <strong>output rate per minute</strong> for the resource you want to produce. Recent picks
        appear in a strip for quick access.
      </li>
      <li>
        <strong>Configuration</strong> — Under <strong>Your production</strong>, each row is a
        chain toward your target. Adjust rates, add extra resources as inputs, or remove rows you do
        not need. <strong>Presets</strong> let you save the whole setup, load it later, merge with
        what you have, or replace everything.
      </li>
      <li>
        <strong>Results</strong> — <strong>Base resources required</strong> lists raw inputs;
        <strong> Net flow</strong> shows surplus and deficit per material;{' '}
        <strong>Dependency tree</strong> is the full graph. Each section can be collapsed.
      </li>
      <li>
        <strong>Net flow chart</strong> — At the bottom of the page. Choose a chart style from the
        dropdown above the chart to change how flows are visualized.
      </li>
      <li>
        <strong>Export / Import / Reset</strong> — In the header: download your saved app data as
        JSON, restore from a backup file, or wipe stored data for this browser (includes calculator
        and canvas when you use both).
      </li>
    </ul>
  );
}

function CanvasHelp() {
  return (
    <ul className="user-guide-list">
      <li>
        <strong>Sidebar — search and pick a resource</strong> — Use <strong>Search resources</strong>{' '}
        to filter by name. Resources are grouped by level; use category headers to expand or
        collapse, or <strong>Expand all</strong> / <strong>Collapse all</strong>. Click an icon to
        select that resource for placement (hover for a short summary). Click the same icon again to
        cancel selection.
      </li>
      <li>
        <strong>Placement layout</strong> — <strong>Auto</strong>, <strong>Horizontal</strong>, or{' '}
        <strong>Vertical</strong> controls how a new dependency tree is laid out when you place it on
        the workspace. Your choice is remembered for this browser.
      </li>
      <li>
        <strong>Placing on the workspace</strong> — With a resource selected, move the pointer over
        the canvas; a ghost shows where it will go. <strong>Click</strong> to confirm placement. The app
        builds the production chain for that resource and draws cards and links. If placement fails,
        an error message appears above the canvas.
      </li>
      <li>
        <strong>Panning and scrolling</strong> — The canvas is a large scrollable area.{' '}
        <strong>Drag</strong> with the left button on empty space, or use the{' '}
        <strong>middle mouse button</strong> anywhere on the canvas, to pan. The cursor shows grab /
        grabbing while panning.
      </li>
      <li>
        <strong>Toolbar — Fit and Blocks</strong> — <strong>Fit</strong> scrolls and zooms the view
        so every block is visible (disabled when the canvas is empty). <strong>Blocks</strong> opens
        a list of all placed blocks; choose one to jump the view to that block if it is off-screen.
      </li>
      <li>
        <strong>Blocks and labels</strong> — Each block has a title bar you can <strong>drag</strong>{' '}
        to move the entire block. <strong>Double-click</strong> the label to rename it. Use the
        remove control on a label to delete that block from the canvas.
      </li>
      <li>
        <strong>Results panel</strong> — On the right, open <strong>Results</strong> to see
        production details for the canvas. You can hide the panel, show it again, and drag the left
        edge to resize. Content updates with your layout.
      </li>
      <li>
        <strong>Data and header</strong> — Canvas layout and UI preferences are saved in this
        browser like the calculator. Use header <strong>Export</strong>, <strong>Import</strong>, and{' '}
        <strong>Reset</strong> the same way; imports can restore both views’ stored data.
      </li>
    </ul>
  );
}
