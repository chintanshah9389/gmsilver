export function formatInr(value?: number | string | null, digits = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return `₹${n.toLocaleString('en-IN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}
