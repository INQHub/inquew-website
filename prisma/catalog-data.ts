// V2 prices (+10%, rounded up to the next $10) and five founder deliverables.
// Keep in sync with prisma/migrations/20261025000000_v2_diagnostic_terms_pricing.
// Originally ported from the Claude Design prototype (`project/Inquew Website.dc.html`,
// the `TIER` / `ITEMS` / `CATS` constants near the bottom of the script block).

export const TIER_META: Record<number, { label: string; range: string; edits: number }> = {
  1: { label: "Tier 1", range: "$60–$170", edits: 0 },
  2: { label: "Tier 2", range: "$170–$550", edits: 1 },
  3: { label: "Tier 3", range: "$550–$1,650", edits: 4 }
};

export type AddonMode = "NONE" | "ADD" | "INCLUDED";

export type CatalogItem = {
  slug: string;
  tier: number;
  title: string;
  priceCents: number;
  teaser: string;
  category: string;
  keyword: string;
  video: AddonMode;
  zoom: AddonMode;
  description: string;
};

const ADDON = { video: 35_00, zoom: 45_00 };

export const CATEGORIES = [
  "Diagnosis & Mapping",
  "Measurement & Optimization",
  "AI Enablement",
  "Advisory",
  "Change Management",
  "Strategy & Roadmapping",
  "Process Redesign",
  "Build",
  "Founder Toolkit"
];

export const CATALOG: CatalogItem[] = [
  { slug: "workflow-map", tier: 1, title: "Workflow Map", priceCents: 11000, teaser: "See your business process mapped on a single page.", category: "Diagnosis & Mapping", keyword: "flowchart diagram whiteboard", video: "ADD", zoom: "ADD", description: "1-6 page visual diagram of a single current business process, showing steps, handoffs, and bottlenecks." },
  { slug: "value-stream", tier: 1, title: "Value-Stream Map", priceCents: 11000, teaser: "Spot the waste hiding in your current process.", category: "Diagnosis & Mapping", keyword: "process flow diagram", video: "ADD", zoom: "ADD", description: "Visual analysis of your business's material flow of product from order to delivery--helping you eliminate waste in your process, and saving your business money." },
  { slug: "raci", tier: 1, title: "RACI / Ownership Map", priceCents: 9000, teaser: "Know exactly who owns each step in your business process.", category: "Diagnosis & Mapping", keyword: "team roles org chart", video: "ADD", zoom: "ADD", description: "Single-page chart assigning who is Responsible, Accountable, Consulted, and Informed for each step in a process." },
  { slug: "kpi", tier: 1, title: "KPI Dashboard Template", priceCents: 10000, teaser: "A ready-made template for tracking what matters.", category: "Measurement & Optimization", keyword: "dashboard analytics screen", video: "ADD", zoom: "ADD", description: "A ready-to-use template defining the key metrics to track for a specific workflow or goal." },
  { slug: "prompt-library", tier: 1, title: "AI Prompt Library (Single Use Case)", priceCents: 7000, teaser: "Ready-to-use AI prompts for one recurring task.", category: "AI Enablement", keyword: "chat prompt interface", video: "ADD", zoom: "ADD", description: "A curated, ready-to-use set of prompts for one specific recurring task (e.g., drafting client emails)." },
  { slug: "ishikawa", tier: 1, title: "Ishikawa Diagram + Video Presentation", priceCents: 7000, teaser: "Root causes mapped, results explained in a short video.", category: "Diagnosis & Mapping", keyword: "fishbone diagram presentation", video: "INCLUDED", zoom: "ADD", description: "A fishbone root-cause diagram of a business problem, delivered with a short recorded video walking through the findings." },
  { slug: "ai-gap", tier: 2, title: "AI Opportunity Gap Report", priceCents: 28000, teaser: "Find where AI can save you the most time in your business.", category: "Diagnosis & Mapping", keyword: "report document analysis", video: "ADD", zoom: "ADD", description: "Short report identifying where AI or automation could reduce friction in a mapped process, ranked by impact. Includes a recorded presentation on findings." },
  { slug: "tool-rec", tier: 2, title: "Tool & Integration Recommendation Report", priceCents: 25000, teaser: "The right software stack, recommended for you.", category: "Advisory", keyword: "software comparison screens", video: "ADD", zoom: "ADD", description: "Comparison of 2-4 software/AI tools suited to the client's existing tech stack, with a recommendation. Includes a recorded presentation on findings." },
  { slug: "efficiency", tier: 2, title: "Efficiency Opportunity Assessment", priceCents: 31000, teaser: "Find the repetitive tasks worth automating first.", category: "Diagnosis & Mapping", keyword: "task checklist review", video: "ADD", zoom: "ADD", description: "Review of a business process identifying repetitive or error-prone tasks that are strong automation candidates. Includes a recorded presentation on findings." },
  { slug: "quality-audit", tier: 2, title: "Error & Quality Risk Audit", priceCents: 25000, teaser: "Catch the mistakes before they cost you.", category: "Diagnosis & Mapping", keyword: "quality checklist audit", video: "ADD", zoom: "ADD", description: "Assessment of a workflow's manual-error risk points, with recommendations to reduce them. Includes a recorded presentation on findings." },
  { slug: "adoption", tier: 2, title: "Adoption & Enablement Playbook", priceCents: 33000, teaser: "Get your team onboard with the new way of working.", category: "Change Management", keyword: "team training session", video: "ADD", zoom: "ADD", description: "Short guide for training a small team on a new workflow or tool, including a rollout checklist. Includes a recorded presentation on findings." },
  { slug: "discovery", tier: 2, title: "Process Discovery Session + Summary", priceCents: 39000, teaser: "A working session to document how you really work.", category: "Diagnosis & Mapping", keyword: "meeting whiteboard discussion", video: "ADD", zoom: "ADD", description: "A structured working session to document a business's current process, delivered as a written summary. Includes a recorded presentation on findings." },
  { slug: "perf-framework", tier: 2, title: "Performance Measurement Framework", priceCents: 33000, teaser: "Know what to track, how often, and why.", category: "Measurement & Optimization", keyword: "metrics tracking dashboard", video: "ADD", zoom: "ADD", description: "Defines what to measure, how, and how often for a specific workflow, beyond a single dashboard template. Includes a recorded presentation on findings." },
  { slug: "brainstorm", tier: 2, title: "30-Minute Brainstorming Session (Zoom)", priceCents: 17000, teaser: "Talk through your idea live with an advisor.", category: "Advisory", keyword: "video call laptop", video: "NONE", zoom: "NONE", description: "Live 30-minute video call to brainstorm a product idea, business concept, or launch plan with a platform advisor." },
  { slug: "pm-plan", tier: 2, title: "Project Management Plan + Video Presentation", priceCents: 28000, teaser: "A clear plan and timeline, walked through on video.", category: "Strategy & Roadmapping", keyword: "project timeline gantt chart", video: "INCLUDED", zoom: "ADD", description: "A scoped project plan (milestones, timeline, owners) for executing on a chosen deliverable or initiative, with a recorded walkthrough." },
  { slug: "training-plan", tier: 2, title: "Training / Implementation Plan + Video Presentation", priceCents: 33000, teaser: "Roll out your new workflow with a step-by-step plan.", category: "Change Management", keyword: "training handbook onboarding", video: "INCLUDED", zoom: "ADD", description: "A step-by-step plan for rolling out and training a team on a new workflow or tool, delivered with a recorded video walkthrough." },
  { slug: "transformation", tier: 3, title: "Digital Transformation Roadmap", priceCents: 83000, teaser: "Your business's next 3 months of digital adoption, mapped out.", category: "Strategy & Roadmapping", keyword: "roadmap timeline milestones", video: "ADD", zoom: "ADD", description: "A phased plan (with milestones) for how a business should sequence its digital/AI adoption over the next 3 months. Includes a recorded presentation." },
  { slug: "zero-based", tier: 3, title: "Zero-Based Process Redesign", priceCents: 99000, teaser: "Rebuild one workflow from the ground up.", category: "Process Redesign", keyword: "blueprint redesign process", video: "ADD", zoom: "ADD", description: "A from-scratch redesign of one workflow, rebuilt around automation or optimization of an existing process. Includes a recorded presentation." },
  { slug: "ai-redesign", tier: 3, title: "AI-Enabled Workflow Redesign", priceCents: 105000, teaser: "One process, reimagined with AI built in.", category: "Process Redesign", keyword: "AI workflow automation", video: "ADD", zoom: "ADD", description: "Co-designed workflow that embeds AI-driven routing, decision support, or content generation into one process. Includes a recorded presentation." },
  { slug: "pilot", tier: 3, title: "Pilot Workflow Prototype", priceCents: 132000, teaser: "Test your new workflow before you commit fully.", category: "Build", keyword: "prototype testing pilot", video: "ADD", zoom: "ADD", description: "A working, contained pilot of a redesigned workflow deployed in one business unit or use case for testing. (Dashboard solution, App, Website, etc.). Includes a recorded presentation." },
  { slug: "ai-agent", tier: 3, title: "Custom AI Agent Prototype (Single Task)", priceCents: 165000, teaser: "Working AI agent architecture docs built for one specific task.", category: "Build", keyword: "AI agent robot interface", video: "ADD", zoom: "ADD", description: "A working dashboard prototype of a custom AI agent scoped to one specific, well-defined task or workflow step. Includes full architecture documents, a recorded presentation, and workflow implementation documents." },
  { slug: "founder-interview", tier: 1, title: "Founder Interview & Product Brainstorm", priceCents: 6000, teaser: "Turn your idea into a clear brief to build from.", category: "Founder Toolkit", keyword: "founder idea notebook", video: "ADD", zoom: "ADD", description: "Answer up to 5 interview questions about your idea, competitors and progress so far. You receive a brief that fleshes out the idea and lays out the research to start with." },
  { slug: "marketing-brief", tier: 1, title: "Marketing & Rebranding Design Brief", priceCents: 6500, teaser: "Where your brand stands today, and what to change.", category: "Founder Toolkit", keyword: "brand moodboard design", video: "ADD", zoom: "ADD", description: "Share your website and social links and answer questions about where you want to go and who you compete with. You receive a 5-page brief assessing your current messaging and tone, with next steps." },
  { slug: "customer-discovery", tier: 1, title: "Customer Discovery", priceCents: 6500, teaser: "Hear from real customers before you build more.", category: "Founder Toolkit", keyword: "customer interview conversation", video: "ADD", zoom: "ADD", description: "Describe your product and answer up to 3 clarifying questions. You receive a custom interview link for up to 5 customer interviews, a summary of what they said, and a discovery report." },
  { slug: "gtm-strategy", tier: 1, title: "Go-to-Market Strategy", priceCents: 7500, teaser: "Who to sell to first, and how to reach them.", category: "Founder Toolkit", keyword: "launch plan rocket", video: "ADD", zoom: "ADD", description: "Ideal customer profile and personas, competitive positioning, channel priorities with rationale, a messaging framework, launch milestones and success metrics." },
  { slug: "funding-roadmap", tier: 1, title: "Funding Roadmap Report + Spreadsheet", priceCents: 8500, teaser: "Know your runway and when to raise.", category: "Founder Toolkit", keyword: "spreadsheet finance chart", video: "ADD", zoom: "ADD", description: "Enter funding received, planned raises, payment dates and revenue. You receive a prefilled spreadsheet plus a 1-2 page write-up of your burn rate and what to watch." }
];

export const ADDON_CENTS = ADDON;

export const HERO_SLUGS = ["workflow-map", "ai-gap", "ai-agent"];
export const TEASER_SLUGS = ["workflow-map", "raci", "ishikawa", "ai-gap", "transformation", "ai-agent"];
export const RECOMMENDED_FALLBACK_SLUGS = ["workflow-map", "efficiency", "ai-gap", "ai-redesign"];
