import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CATALOG } from "./catalog-data";

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL || "admin@inquew.com";
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD || "ChangeMe123!";
const CLIENT_PASSWORD = process.env.CLIENT_SEED_PASSWORD || "ChangeMe123!";

async function seedCatalog() {
  for (const [i, item] of CATALOG.entries()) {
    await prisma.deliverable.upsert({
      where: { slug: item.slug },
      update: {
        tier: item.tier,
        title: item.title,
        priceCents: item.priceCents,
        teaser: item.teaser,
        description: item.description,
        category: item.category,
        keyword: item.keyword,
        videoAddon: item.video,
        zoomAddon: item.zoom,
        sortOrder: i
      },
      create: {
        slug: item.slug,
        tier: item.tier,
        title: item.title,
        priceCents: item.priceCents,
        teaser: item.teaser,
        description: item.description,
        category: item.category,
        keyword: item.keyword,
        videoAddon: item.video,
        zoomAddon: item.zoom,
        sortOrder: i
      }
    });
  }
  console.log(`Seeded ${CATALOG.length} deliverables`);
}

async function seedUsers() {
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      name: "Kenny Isibor",
      role: "ADMIN",
      businessName: "Inquew",
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10)
    }
  });

  const jane = await prisma.user.upsert({
    where: { email: "jane@okaforfab.com" },
    update: {},
    create: {
      email: "jane@okaforfab.com",
      name: "Jane Okafor",
      role: "CLIENT",
      businessName: "Okafor Fabrication",
      passwordHash: await bcrypt.hash(CLIENT_PASSWORD, 10)
    }
  });

  const marcus = await prisma.user.upsert({
    where: { email: "marcus@bluecrestlogistics.com" },
    update: {},
    create: {
      email: "marcus@bluecrestlogistics.com",
      name: "Marcus Webb",
      role: "CLIENT",
      businessName: "Bluecrest Logistics",
      passwordHash: await bcrypt.hash(CLIENT_PASSWORD, 10)
    }
  });

  console.log(`Seeded users: admin=${admin.email}, clients=${jane.email},${marcus.email}`);
  return { admin, jane, marcus };
}

async function seedIntakeAndOrders(jane: { id: string; email: string }) {
  const workflowMap = await prisma.deliverable.findUniqueOrThrow({ where: { slug: "workflow-map" } });
  const aiGap = await prisma.deliverable.findUniqueOrThrow({ where: { slug: "ai-gap" } });
  const raci = await prisma.deliverable.findUniqueOrThrow({ where: { slug: "raci" } });
  const kpi = await prisma.deliverable.findUniqueOrThrow({ where: { slug: "kpi" } });
  const adoption = await prisma.deliverable.findUniqueOrThrow({ where: { slug: "adoption" } });

  const chosenText =
    "Our quoting process depends on one person, so every estimate waits on their availability and errors slip through unchecked.";

  const intake = await prisma.intakeSession.create({
    data: {
      userId: jane.id,
      status: "STATEMENT_SELECTED",
      consentAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
      transcript:
        "So our biggest problem right now is quoting. Every estimate has to go through me personally, and if I'm out sick or on a job site, the whole thing just stalls...",
      sets: {
        create: {
          source: "ai",
          statements: {
            create: [
              {
                text: chosenText,
                angle: "Frames it as a single-point-of-failure and ownership problem.",
                selected: true
              },
              {
                text: "We do not know which steps in our intake-to-invoice process actually add value, so we cannot tell where the delay comes from.",
                angle: "Frames it as a process visibility and measurement problem."
              },
              {
                text: "Repetitive administrative work is consuming time that should go to billable work, and no one has assessed what could be automated.",
                angle: "Frames it as an automation-opportunity problem."
              }
            ]
          }
        }
      }
    }
  });

  const orderSpecs = [
    { deliverable: workflowMap, status: "IN_REVIEW" as const, pct: 72, daysAgo: 8 },
    { deliverable: aiGap, status: "ASSIGNED" as const, pct: 38, daysAgo: 5 },
    { deliverable: raci, status: "AWAITING_CLIENT_REVIEW" as const, pct: 92, daysAgo: 11 },
    { deliverable: kpi, status: "DELIVERED" as const, pct: 100, daysAgo: 24 },
    { deliverable: adoption, status: "DELIVERED" as const, pct: 100, daysAgo: 41, editsUsed: 1 }
  ];

  for (const [i, spec] of orderSpecs.entries()) {
    const createdAt = new Date(Date.now() - 1000 * 60 * 60 * 24 * spec.daysAgo);
    const order = await prisma.order.create({
      data: {
        displayId: `INQ-${2600 + i}-${4471 + i}`,
        userId: jane.id,
        intakeSessionId: i === 0 ? intake.id : null,
        status: spec.status,
        progressPct: spec.pct,
        deliveryMethod: "DASHBOARD",
        subtotalCents: spec.deliverable.priceCents,
        contactName: "Jane Okafor",
        contactEmail: jane.email,
        businessName: "Okafor Fabrication",
        createdAt,
        updatedAt: createdAt,
        lines: {
          create: {
            deliverableId: spec.deliverable.id,
            priceCentsAtOrder: spec.deliverable.priceCents,
            editsIncluded: tierEdits(spec.deliverable.tier),
            editsUsed: spec.editsUsed ?? 0
          }
        }
      },
      include: { lines: true }
    });

    if (spec.status === "DELIVERED") {
      await prisma.deliverableFile.create({
        data: {
          orderLineId: order.lines[0].id,
          deliverableId: spec.deliverable.id,
          storageKey: `seed/${spec.deliverable.slug}-draft.pdf`,
          fileName: `${spec.deliverable.title} — final.pdf`,
          mimeType: "application/pdf",
          sizeBytes: 640_000,
          createdAt
        }
      });
    }
  }

  console.log("Seeded intake session + 5 sample orders for Jane Okafor");
}

function tierEdits(tier: number) {
  return tier === 1 ? 0 : tier === 2 ? 1 : 4;
}

async function seedEngagementEvents() {
  const types = [
    "page_view",
    "intake_started",
    "intake_consented",
    "intake_declined",
    "recording_started",
    "recording_completed",
    "statement_selected",
    "add_to_cart",
    "remove_from_cart",
    "checkout_started",
    "order_placed"
  ];
  const weight: Record<string, number> = {
    page_view: 40,
    intake_started: 12,
    intake_consented: 9,
    intake_declined: 2,
    recording_started: 8,
    recording_completed: 6,
    statement_selected: 5,
    add_to_cart: 14,
    remove_from_cart: 3,
    checkout_started: 6,
    order_placed: 4
  };
  const rows: { type: string; path: string; anonId: string; synthetic: boolean; createdAt: Date }[] = [];
  const now = Date.now();
  for (let day = 30; day >= 0; day--) {
    for (const type of types) {
      const count = Math.max(0, Math.round(weight[type] * (0.6 + Math.random() * 0.8)));
      for (let i = 0; i < count; i++) {
        rows.push({
          type,
          path: pathFor(type),
          anonId: `seed-${day}-${type}-${i}`,
          synthetic: true,
          createdAt: new Date(now - day * 86_400_000 - Math.floor(Math.random() * 86_400_000))
        });
      }
    }
  }
  await prisma.engagementEvent.createMany({ data: rows });
  console.log(`Seeded ${rows.length} synthetic engagement events`);
}

function pathFor(type: string) {
  if (type.startsWith("intake") || type.startsWith("recording") || type === "statement_selected") return "/intake";
  if (type === "add_to_cart" || type === "remove_from_cart") return "/deliverables";
  if (type === "checkout_started") return "/checkout";
  if (type === "order_placed") return "/order-confirmation";
  return "/";
}

async function main() {
  await seedCatalog();
  const { jane } = await seedUsers();
  await seedIntakeAndOrders(jane);
  await seedEngagementEvents();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
