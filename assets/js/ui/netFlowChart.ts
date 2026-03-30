import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  type ChartConfiguration,
  type TooltipItem,
} from "chart.js";
import type { FormattedNetTotal, NetFlowChartStyle } from "../contracts";

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
  LineController,
  LineElement,
  PointElement,
);

const chartByContainer = new WeakMap<HTMLElement, Chart<"line"> | Chart<"bar">>();

function readCssVar(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function destroyChartIfAny(container: HTMLElement): void {
  const prev = chartByContainer.get(container);
  if (prev) {
    prev.destroy();
    chartByContainer.delete(container);
  }
}

/** Destroy any Chart.js instance attached to this container (e.g. React unmount). */
export function destroyNetFlowChart(container: HTMLElement | null): void {
  if (!container) return;
  destroyChartIfAny(container);
}

function legendText(style: NetFlowChartStyle): string {
  switch (style) {
    case "vertical-grouped":
      return "Vertical grouped bars per resource. Hover for net and status.";
    case "line":
      return "Line series for required vs production across resources. Hover for net and status.";
    default:
      return "Horizontal grouped bars per resource. Hover for net and status.";
  }
}

function tooltipAfterBody(
  rows: FormattedNetTotal[],
  unit: string,
  items: TooltipItem<"bar" | "line">[],
): string[] {
  const i = items[0]?.dataIndex;
  if (i === undefined || !rows[i]) return [];
  const r = rows[i];
  const netStr = `${r.net > 0 ? "+" : ""}${r.net.toFixed(2)}`;
  return [
    "",
    `Net: ${netStr}${unit ? ` ${unit}` : ""}`,
    `Status: ${r.status}`,
  ];
}

/**
 * Chart.js net flow view: required vs your production (same data as the Net Flow table).
 */
export function renderNetFlowChart(
  container: HTMLElement | null,
  rows: FormattedNetTotal[],
  emptyMessage: string,
  style: NetFlowChartStyle,
): void {
  if (!container) return;

  destroyChartIfAny(container);
  container.replaceChildren();

  if (rows.length === 0) {
    const p = document.createElement("p");
    p.className = "net-flow-chart-empty";
    p.textContent = emptyMessage;
    container.appendChild(p);
    return;
  }

  const textColor = readCssVar("--color-text", "#d4d4d4");
  const borderMuted = readCssVar("--color-recipe-border", "#444444");
  const requiredColor = readCssVar("--color-deficit", "#e53935");
  const productionColor = readCssVar("--color-rate", "#5dade2");

  const legend = document.createElement("p");
  legend.className = "net-flow-chart-legend";
  legend.textContent = legendText(style);

  const wrap = document.createElement("div");
  wrap.className = "net-flow-chart-canvas-wrap";
  const rowCount = rows.length;

  const unit = rows.find((r) => r.unit)?.unit ?? "";
  const xTitle = unit ? `Rate (${unit})` : "Rate";
  const labels = rows.map((r) => r.label);

  const baseTooltip = {
    backgroundColor: readCssVar("--color-surface", "#252525"),
    titleColor: textColor,
    bodyColor: textColor,
    borderColor: readCssVar("--color-border", "#ff9d00"),
    borderWidth: 1,
    padding: 10,
  };

  const legendOpts = {
    labels: { color: textColor, font: { size: 12 } },
  };

  function tooltipLabelColor(item: { datasetIndex?: number }) {
    const ds = item.datasetIndex ?? 0;
    const c = ds === 0 ? requiredColor : productionColor;
    return { borderColor: c, backgroundColor: c };
  }

  const canvas = document.createElement("canvas");
  wrap.appendChild(canvas);
  container.appendChild(legend);
  container.appendChild(wrap);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let chart: Chart<"line"> | Chart<"bar">;

  if (style === "line") {
    wrap.style.height = `${Math.min(720, Math.max(260, 200 + Math.min(rowCount, 24) * 10))}px`;
    wrap.style.minWidth = `${Math.max(360, Math.min(2200, 160 + rowCount * 36))}px`;

    const config: ChartConfiguration<"line"> = {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Required (chain)",
            data: rows.map((r) => r.required),
            borderColor: requiredColor,
            backgroundColor: requiredColor,
            borderWidth: 2,
            tension: 0.2,
            pointRadius: 3,
            pointHoverRadius: 5,
            fill: false,
          },
          {
            label: "Your production",
            data: rows.map((r) => r.production),
            borderColor: productionColor,
            backgroundColor: productionColor,
            borderWidth: 2,
            tension: 0.2,
            pointRadius: 3,
            pointHoverRadius: 5,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        scales: {
          x: {
            grid: { color: borderMuted },
            ticks: {
              color: textColor,
              maxRotation: 45,
              minRotation: 0,
              autoSkip: true,
            },
            border: { color: borderMuted },
          },
          y: {
            beginAtZero: true,
            grid: { color: borderMuted },
            ticks: { color: textColor },
            border: { color: borderMuted },
            title: {
              display: true,
              text: xTitle,
              color: textColor,
              font: { size: 12 },
            },
          },
        },
        plugins: {
          legend: legendOpts,
          tooltip: {
            ...baseTooltip,
            callbacks: {
              afterBody: (items) =>
                tooltipAfterBody(rows, unit, items as TooltipItem<"bar" | "line">[]),
              labelColor: tooltipLabelColor,
            },
          },
        },
      },
    };
    chart = new Chart(ctx, config);
  } else if (style === "vertical-grouped") {
    wrap.style.height = `${Math.min(900, Math.max(320, 280 + Math.min(rowCount, 20) * 14))}px`;
    wrap.style.minWidth = `${Math.max(360, Math.min(2400, 120 + rowCount * 44))}px`;

    const config: ChartConfiguration<"bar"> = {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Required (chain)",
            data: rows.map((r) => r.required),
            backgroundColor: requiredColor,
            borderColor: requiredColor,
            borderWidth: 0,
            borderRadius: 4,
            maxBarThickness: 28,
          },
          {
            label: "Your production",
            data: rows.map((r) => r.production),
            backgroundColor: productionColor,
            borderColor: productionColor,
            borderWidth: 0,
            borderRadius: 4,
            maxBarThickness: 28,
          },
        ],
      },
      options: {
        indexAxis: "x",
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: textColor,
              maxRotation: 45,
              minRotation: 0,
              autoSkip: false,
              font: { size: 10 },
            },
            border: { color: borderMuted },
          },
          y: {
            beginAtZero: true,
            grid: { color: borderMuted },
            ticks: { color: textColor },
            border: { color: borderMuted },
            title: {
              display: true,
              text: xTitle,
              color: textColor,
              font: { size: 12 },
            },
          },
        },
        plugins: {
          legend: legendOpts,
          tooltip: {
            ...baseTooltip,
            callbacks: {
              afterBody: (items) =>
                tooltipAfterBody(rows, unit, items as TooltipItem<"bar" | "line">[]),
              labelColor: tooltipLabelColor,
            },
          },
        },
      },
    };
    chart = new Chart(ctx, config);
  } else {
    wrap.style.height = `${Math.min(1600, Math.max(200, rowCount * 36 + 96))}px`;

    const config: ChartConfiguration<"bar"> = {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Required (chain)",
            data: rows.map((r) => r.required),
            backgroundColor: requiredColor,
            borderColor: requiredColor,
            borderWidth: 0,
            borderRadius: 4,
          },
          {
            label: "Your production",
            data: rows.map((r) => r.production),
            backgroundColor: productionColor,
            borderColor: productionColor,
            borderWidth: 0,
            borderRadius: 4,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: borderMuted },
            ticks: { color: textColor },
            border: { color: borderMuted },
            title: {
              display: true,
              text: xTitle,
              color: textColor,
              font: { size: 12 },
            },
          },
          y: {
            grid: { display: false },
            ticks: {
              color: textColor,
              autoSkip: false,
              font: { size: 11 },
            },
            border: { color: borderMuted },
          },
        },
        plugins: {
          legend: legendOpts,
          tooltip: {
            ...baseTooltip,
            callbacks: {
              afterBody: (items) =>
                tooltipAfterBody(rows, unit, items as TooltipItem<"bar" | "line">[]),
              labelColor: tooltipLabelColor,
            },
          },
        },
      },
    };
    chart = new Chart(ctx, config);
  }

  chartByContainer.set(container, chart);
}
