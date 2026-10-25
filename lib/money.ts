/** Whole-dollar amounts print without cents ($110); anything else keeps them ($202.50). */
export function formatCents(cents: number): string {
  if (cents < 0) return "−" + formatCents(-cents);
  const whole = cents % 100 === 0;
  return (
    "$" +
    (cents / 100).toLocaleString("en-US", {
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2
    })
  );
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}
