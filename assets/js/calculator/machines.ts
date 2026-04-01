import { perMinute } from "../ui/recipeDiagram";

export function machinesNeededExact(
  targetRatePerMin: number,
  outputQtyPerCycle: number,
  durationSec: number,
): number | null {
  if (
    typeof targetRatePerMin !== "number"
    || !isFinite(targetRatePerMin)
    || targetRatePerMin <= 0
  ) {
    return null;
  }

  if (
    typeof outputQtyPerCycle !== "number"
    || !isFinite(outputQtyPerCycle)
    || outputQtyPerCycle <= 0
  ) {
    return null;
  }

  const outPerMachinePerMin = perMinute(outputQtyPerCycle, durationSec);
  if (!isFinite(outPerMachinePerMin) || outPerMachinePerMin <= 0) {
    return null;
  }

  const machines = targetRatePerMin / outPerMachinePerMin;
  return isFinite(machines) && machines > 0 ? machines : null;
}
