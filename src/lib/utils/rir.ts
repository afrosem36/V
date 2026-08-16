export const RIR_OPTIONS = [
  { value: 0, label: "0" },
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4+" },
];

export function rirLabel(rir: number | null): string {
  if (rir == null) return "—";
  return rir >= 4 ? "4+" : String(rir);
}
