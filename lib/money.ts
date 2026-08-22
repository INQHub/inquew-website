export function formatCents(cents: number): string {
  return "$" + (cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}
