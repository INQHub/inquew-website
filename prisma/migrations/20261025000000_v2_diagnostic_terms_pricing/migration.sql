-- V2 phase 1: diagnostic fields, purchase-terms acceptance, bundle discount, and the V2 price list.

-- AlterTable
ALTER TABLE "IntakeSession" ADD COLUMN     "businessContext" JSONB,
ADD COLUMN     "diagnosedAt" TIMESTAMP(3),
ADD COLUMN     "diagnosisSummary" TEXT,
ADD COLUMN     "diagnosticAnswers" JSONB,
ADD COLUMN     "diagnosticQuestions" JSONB,
ADD COLUMN     "recommendedSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "discountCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "termsAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "termsVersion" TEXT;

-- V2 prices: every existing deliverable up 10%, rounded up to the next $10.
-- Matches prisma/catalog-data.ts so `db:seed` and this migration agree.
UPDATE "Deliverable" SET "priceCents" = 11000, "updatedAt" = NOW() WHERE "slug" = 'workflow-map';
UPDATE "Deliverable" SET "priceCents" = 11000, "updatedAt" = NOW() WHERE "slug" = 'value-stream';
UPDATE "Deliverable" SET "priceCents" = 9000, "updatedAt" = NOW() WHERE "slug" = 'raci';
UPDATE "Deliverable" SET "priceCents" = 10000, "updatedAt" = NOW() WHERE "slug" = 'kpi';
UPDATE "Deliverable" SET "priceCents" = 7000, "updatedAt" = NOW() WHERE "slug" = 'prompt-library';
UPDATE "Deliverable" SET "priceCents" = 7000, "updatedAt" = NOW() WHERE "slug" = 'ishikawa';
UPDATE "Deliverable" SET "priceCents" = 28000, "updatedAt" = NOW() WHERE "slug" = 'ai-gap';
UPDATE "Deliverable" SET "priceCents" = 25000, "updatedAt" = NOW() WHERE "slug" = 'tool-rec';
UPDATE "Deliverable" SET "priceCents" = 31000, "updatedAt" = NOW() WHERE "slug" = 'efficiency';
UPDATE "Deliverable" SET "priceCents" = 25000, "updatedAt" = NOW() WHERE "slug" = 'quality-audit';
UPDATE "Deliverable" SET "priceCents" = 33000, "updatedAt" = NOW() WHERE "slug" = 'adoption';
UPDATE "Deliverable" SET "priceCents" = 39000, "updatedAt" = NOW() WHERE "slug" = 'discovery';
UPDATE "Deliverable" SET "priceCents" = 33000, "updatedAt" = NOW() WHERE "slug" = 'perf-framework';
UPDATE "Deliverable" SET "priceCents" = 17000, "updatedAt" = NOW() WHERE "slug" = 'brainstorm';
UPDATE "Deliverable" SET "priceCents" = 28000, "updatedAt" = NOW() WHERE "slug" = 'pm-plan';
UPDATE "Deliverable" SET "priceCents" = 33000, "updatedAt" = NOW() WHERE "slug" = 'training-plan';
UPDATE "Deliverable" SET "priceCents" = 83000, "updatedAt" = NOW() WHERE "slug" = 'transformation';
UPDATE "Deliverable" SET "priceCents" = 99000, "updatedAt" = NOW() WHERE "slug" = 'zero-based';
UPDATE "Deliverable" SET "priceCents" = 105000, "updatedAt" = NOW() WHERE "slug" = 'ai-redesign';
UPDATE "Deliverable" SET "priceCents" = 132000, "updatedAt" = NOW() WHERE "slug" = 'pilot';
UPDATE "Deliverable" SET "priceCents" = 165000, "updatedAt" = NOW() WHERE "slug" = 'ai-agent';

-- New founder deliverables (Tier 1). Skipped if a row with the slug already exists.
INSERT INTO "Deliverable" ("id", "slug", "tier", "title", "priceCents", "teaser", "description", "category", "keyword", "videoAddon", "zoomAddon", "active", "sortOrder", "createdAt", "updatedAt") VALUES
('v2_founder_interview', 'founder-interview', 1, 'Founder Interview & Product Brainstorm', 6000, 'Turn your idea into a clear brief to build from.', 'Answer up to 5 interview questions about your idea, competitors and progress so far. You receive a brief that fleshes out the idea and lays out the research to start with.', 'Founder Toolkit', 'founder idea notebook', 'ADD', 'ADD', true, 21, NOW(), NOW()),
('v2_marketing_brief', 'marketing-brief', 1, 'Marketing & Rebranding Design Brief', 6500, 'Where your brand stands today, and what to change.', 'Share your website and social links and answer questions about where you want to go and who you compete with. You receive a 5-page brief assessing your current messaging and tone, with next steps.', 'Founder Toolkit', 'brand moodboard design', 'ADD', 'ADD', true, 22, NOW(), NOW()),
('v2_customer_discovery', 'customer-discovery', 1, 'Customer Discovery', 6500, 'Hear from real customers before you build more.', 'Describe your product and answer up to 3 clarifying questions. You receive a custom interview link for up to 5 customer interviews, a summary of what they said, and a discovery report.', 'Founder Toolkit', 'customer interview conversation', 'ADD', 'ADD', true, 23, NOW(), NOW()),
('v2_gtm_strategy', 'gtm-strategy', 1, 'Go-to-Market Strategy', 7500, 'Who to sell to first, and how to reach them.', 'Ideal customer profile and personas, competitive positioning, channel priorities with rationale, a messaging framework, launch milestones and success metrics.', 'Founder Toolkit', 'launch plan rocket', 'ADD', 'ADD', true, 24, NOW(), NOW()),
('v2_funding_roadmap', 'funding-roadmap', 1, 'Funding Roadmap Report + Spreadsheet', 8500, 'Know your runway and when to raise.', 'Enter funding received, planned raises, payment dates and revenue. You receive a prefilled spreadsheet plus a 1-2 page write-up of your burn rate and what to watch.', 'Founder Toolkit', 'spreadsheet finance chart', 'ADD', 'ADD', true, 25, NOW(), NOW())
ON CONFLICT ("slug") DO NOTHING;
