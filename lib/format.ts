export function rupiah(value: number | null | undefined) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function compactRupiah(value: number | null | undefined) {
  const v = Number(value || 0);
  if (v >= 1e9) return `Rp ${(v / 1e9).toFixed(1).replace(".", ",")} M`;
  if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(1).replace(".", ",")} jt`;
  if (v >= 1e3) return `Rp ${Math.round(v / 1e3).toLocaleString("id-ID")} rb`;
  return rupiah(v);
}

export const quadrantColor: Record<number, string> = {
  0: "#16a34a",
  1: "#7c3aed",
  2: "#f59e0b",
  3: "#dc2626",
  4: "#64748b",
};
