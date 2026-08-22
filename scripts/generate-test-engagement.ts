/**
 * Generates synthetic EngagementEvent rows for load-testing the admin funnel view
 * and for comparing against real traffic via CSV/JSON export.
 *
 * Usage:
 *   npm run test:engagement -- --days=14 --volume=1
 *   (volume is a multiplier on the base daily event counts below; default 1)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BASE_DAILY_COUNTS: Record<string, number> = {
  page_view: 220,
  intake_started: 45,
  intake_consented: 34,
  intake_declined: 6,
  recording_started: 30,
  recording_completed: 24,
  statement_selected: 20,
  add_to_cart: 55,
  remove_from_cart: 10,
  checkout_started: 22,
  order_placed: 14,
  deliverable_viewed: 90
};

function pathFor(type: string) {
  if (type.startsWith("intake") || type.startsWith("recording") || type === "statement_selected") return "/intake";
  if (type === "add_to_cart" || type === "remove_from_cart" || type === "deliverable_viewed") return "/deliverables";
  if (type === "checkout_started") return "/checkout";
  if (type === "order_placed") return "/order-confirmation";
  return "/";
}

function parseArgs() {
  const args = Object.fromEntries(
    process.argv.slice(2).map((a) => {
      const [k, v] = a.replace(/^--/, "").split("=");
      return [k, v ?? "true"];
    })
  );
  return {
    days: Number(args.days ?? 14),
    volume: Number(args.volume ?? 1)
  };
}

async function main() {
  const { days, volume } = parseArgs();
  const rows: { type: string; path: string; anonId: string; synthetic: boolean; createdAt: Date }[] = [];
  const now = Date.now();

  for (let day = days - 1; day >= 0; day--) {
    for (const [type, base] of Object.entries(BASE_DAILY_COUNTS)) {
      const count = Math.max(0, Math.round(base * volume * (0.7 + Math.random() * 0.6)));
      for (let i = 0; i < count; i++) {
        rows.push({
          type,
          path: pathFor(type),
          anonId: `synthetic-${Date.now()}-${day}-${type}-${i}`,
          synthetic: true,
          createdAt: new Date(now - day * 86_400_000 - Math.floor(Math.random() * 86_400_000))
        });
      }
    }
  }

  await prisma.engagementEvent.createMany({ data: rows });
  console.log(`Generated ${rows.length} synthetic events over ${days} days (volume x${volume}).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
