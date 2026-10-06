import { formatPlate } from "@/lib/plateDisplay";

// Shared license-plate chip — every place a plate is shown (calendar row
// labels, Vozni park, Vozači, Rezervacije) renders it through this so it
// always looks identical.
export function PlateChip({ plate, className }: { plate: string; className?: string }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-[5px] px-[6px] py-[1px] font-mono text-[11.5px] ${className ?? ""}`}
      style={{ background: "#F4F4F1", color: "#4A4A46" }}
    >
      {formatPlate(plate)}
    </span>
  );
}
