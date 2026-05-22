import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "devin-dollars.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const isNew = !fs.existsSync(DB_PATH);
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  initSchema(_db);

  if (isNew) seedData(_db);
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS business_units (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      lead_name TEXT NOT NULL,
      lead_email TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS initiatives (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      bu_id TEXT NOT NULL REFERENCES business_units(id),
      sponsor_name TEXT NOT NULL,
      sponsor_email TEXT NOT NULL,
      description TEXT NOT NULL,
      jira_project_key TEXT NOT NULL,
      approved_budget_usd REAL NOT NULL,
      requested_acus INTEGER NOT NULL,
      estimated_cost_with_devin_usd REAL NOT NULL,
      strategic_priority TEXT NOT NULL CHECK(strategic_priority IN ('Critical','High','Medium')),
      status TEXT NOT NULL DEFAULT 'Pending Review' CHECK(status IN ('Pending Review','Approved','Completed','Rejected')),
      funding_score REAL NOT NULL DEFAULT 0,
      planned_end_date TEXT,
      approved_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS use_case_fits (
      id TEXT PRIMARY KEY,
      initiative_id TEXT NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      ranking TEXT NOT NULL CHECK(ranking IN ('Strong Fit','Good Fit','Moderate Fit'))
    );

    CREATE TABLE IF NOT EXISTS devin_sessions (
      id TEXT PRIMARY KEY,
      initiative_id TEXT REFERENCES initiatives(id),
      ticket_key TEXT,
      user_email TEXT NOT NULL,
      bu_id TEXT NOT NULL REFERENCES business_units(id),
      acus_consumed INTEGER NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      outcome TEXT CHECK(outcome IN ('Merged','In Review','Abandoned'))
    );

    CREATE TABLE IF NOT EXISTS tickets (
      key TEXT PRIMARY KEY,
      initiative_id TEXT NOT NULL REFERENCES initiatives(id),
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      source TEXT NOT NULL CHECK(source IN ('jira','rally'))
    );
  `);
}

function uid(): string { return crypto.randomUUID(); }
function dateStr(daysAgo: number): string {
  const d = new Date(); d.setDate(d.getDate() - daysAgo); return d.toISOString();
}
function rand(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function seedData(db: Database.Database) {
  const bus = [
    { id: "bu-plat", name: "Platform Engineering", lead_name: "Sarah Chen", lead_email: "sarah.chen@acme.com" },
    { id: "bu-data", name: "Data & Analytics", lead_name: "Marcus Johnson", lead_email: "marcus.j@acme.com" },
    { id: "bu-cust", name: "Customer Apps", lead_name: "Emily Rodriguez", lead_email: "emily.r@acme.com" },
    { id: "bu-intl", name: "Internal Tools", lead_name: "James Park", lead_email: "james.p@acme.com" },
    { id: "bu-sec", name: "Security", lead_name: "Aisha Patel", lead_email: "aisha.p@acme.com" },
    { id: "bu-infra", name: "Infrastructure", lead_name: "David Kim", lead_email: "david.k@acme.com" },
  ];
  const insertBU = db.prepare("INSERT INTO business_units (id, name, lead_name, lead_email) VALUES (?, ?, ?, ?)");
  for (const b of bus) insertBU.run(b.id, b.name, b.lead_name, b.lead_email);

  const initiatives = [
    { id: "init-01", name: "Java-to-Kotlin Migration", bu_id: "bu-plat", sponsor: "Sarah Chen", email: "sarah.chen@acme.com", desc: "Migrate 2.4M lines of legacy Java services to Kotlin, improving developer productivity and reducing boilerplate by 40%.", key: "PLAT-2026-Q1", budget: 2800000, acus: 450000, cost: 1200000, priority: "Critical", status: "Approved", score: 92, endDays: 150, approvedDays: 75, createdDays: 80 },
    { id: "init-02", name: "Data Warehouse Cloud Migration", bu_id: "bu-data", sponsor: "Marcus Johnson", email: "marcus.j@acme.com", desc: "Migrate on-prem Oracle data warehouse to Snowflake, including 850+ ETL pipelines and historical data transformation.", key: "DATA-2026-Q1", budget: 1900000, acus: 280000, cost: 950000, priority: "Critical", status: "Approved", score: 88, endDays: 120, approvedDays: 60, createdDays: 65 },
    { id: "init-03", name: "Customer Portal React Upgrade", bu_id: "bu-cust", sponsor: "Emily Rodriguez", email: "emily.r@acme.com", desc: "Upgrade customer-facing portal from React 16 to React 19 with Server Components.", key: "CUST-2026-Q2", budget: 850000, acus: 120000, cost: 420000, priority: "High", status: "Approved", score: 78, endDays: 90, approvedDays: 50, createdDays: 55 },
    { id: "init-04", name: "Automated QA Test Suite Expansion", bu_id: "bu-intl", sponsor: "James Park", email: "james.p@acme.com", desc: "Expand automated test coverage from 42% to 85% across all internal tools.", key: "INTL-2026-Q2", budget: 620000, acus: 95000, cost: 310000, priority: "High", status: "Approved", score: 74, endDays: 70, approvedDays: 45, createdDays: 50 },
    { id: "init-05", name: "Security Compliance Remediation", bu_id: "bu-sec", sponsor: "Aisha Patel", email: "aisha.p@acme.com", desc: "Automated remediation of 1,200+ SonarQube findings and dependency vulnerability patches.", key: "SEC-2026-Q2", budget: 480000, acus: 72000, cost: 195000, priority: "Critical", status: "Approved", score: 85, endDays: 60, approvedDays: 40, createdDays: 45 },
    { id: "init-06", name: "Infrastructure-as-Code Conversion", bu_id: "bu-infra", sponsor: "David Kim", email: "david.k@acme.com", desc: "Convert manual infrastructure provisioning to Terraform modules. 340 cloud resources across 12 AWS accounts.", key: "INFRA-2026-Q2", budget: 540000, acus: 80000, cost: 280000, priority: "Medium", status: "Approved", score: 65, endDays: 100, approvedDays: 35, createdDays: 40 },
    { id: "init-07", name: "API Gateway Consolidation", bu_id: "bu-plat", sponsor: "Sarah Chen", email: "sarah.chen@acme.com", desc: "Consolidate 14 separate API gateways into a unified platform with automated route migration.", key: "PLAT-2026-Q3", budget: 1100000, acus: 160000, cost: 520000, priority: "High", status: "Pending Review", score: 80, endDays: 0, approvedDays: 0, createdDays: 5 },
    { id: "init-08", name: "ML Pipeline Modernization", bu_id: "bu-data", sponsor: "Marcus Johnson", email: "marcus.j@acme.com", desc: "Refactor batch ML training pipelines to real-time streaming architecture.", key: "DATA-2026-Q3", budget: 750000, acus: 110000, cost: 380000, priority: "Medium", status: "Pending Review", score: 68, endDays: 0, approvedDays: 0, createdDays: 3 },
    { id: "init-09", name: "Mobile App CI/CD Overhaul", bu_id: "bu-cust", sponsor: "Emily Rodriguez", email: "emily.r@acme.com", desc: "Rebuild mobile app build and release pipeline with automated testing and staged rollouts.", key: "CUST-2026-Q3", budget: 420000, acus: 65000, cost: 240000, priority: "High", status: "Pending Review", score: 71, endDays: 0, approvedDays: 0, createdDays: 1 },
    { id: "init-10", name: "Legacy Auth System Replacement", bu_id: "bu-sec", sponsor: "Aisha Patel", email: "aisha.p@acme.com", desc: "Replaced legacy LDAP authentication with OAuth 2.0 / OIDC across 28 internal applications.", key: "SEC-2025-Q4", budget: 680000, acus: 100000, cost: 320000, priority: "Critical", status: "Completed", score: 87, endDays: -15, approvedDays: 120, createdDays: 130 },
    { id: "init-11", name: "Documentation Generator", bu_id: "bu-intl", sponsor: "James Park", email: "james.p@acme.com", desc: "Auto-generated API documentation and runbooks for 200+ microservices.", key: "INTL-2025-Q4", budget: 290000, acus: 42000, cost: 135000, priority: "Medium", status: "Completed", score: 72, endDays: -10, approvedDays: 100, createdDays: 110 },
    { id: "init-12", name: "Blockchain Ledger PoC", bu_id: "bu-infra", sponsor: "David Kim", email: "david.k@acme.com", desc: "Proof-of-concept for blockchain-based audit ledger. Low strategic alignment and unclear ROI.", key: "INFRA-2026-Q3", budget: 380000, acus: 55000, cost: 340000, priority: "Medium", status: "Rejected", score: 28, endDays: 0, approvedDays: 0, createdDays: 20 },
  ];

  const insertInit = db.prepare(`INSERT INTO initiatives (id,name,bu_id,sponsor_name,sponsor_email,description,jira_project_key,approved_budget_usd,requested_acus,estimated_cost_with_devin_usd,strategic_priority,status,funding_score,planned_end_date,approved_at,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  for (const i of initiatives) {
    const end = i.endDays ? dateStr(-i.endDays) : null;
    const approved = i.approvedDays ? dateStr(i.approvedDays) : null;
    insertInit.run(i.id, i.name, i.bu_id, i.sponsor, i.email, i.desc, i.key, i.budget, i.acus, i.cost, i.priority, i.status, i.score, end, approved, dateStr(i.createdDays));
  }

  // Use Case Fits
  const fits = [
    ["init-01", "Code migrations & refactors", "Strong Fit"], ["init-01", "Code modernization", "Good Fit"],
    ["init-02", "Data engineering", "Strong Fit"], ["init-02", "Code modernization", "Good Fit"],
    ["init-03", "Code migrations & refactors", "Strong Fit"], ["init-03", "Testing", "Good Fit"],
    ["init-04", "Testing", "Strong Fit"], ["init-04", "Bug & issue triage", "Moderate Fit"],
    ["init-05", "Bug & issue triage", "Strong Fit"], ["init-05", "Code modernization", "Strong Fit"],
    ["init-06", "Code modernization", "Good Fit"], ["init-06", "And much more…", "Good Fit"],
    ["init-07", "Code migrations & refactors", "Strong Fit"], ["init-07", "Testing", "Good Fit"],
    ["init-08", "Data engineering", "Good Fit"], ["init-08", "Code modernization", "Moderate Fit"],
    ["init-09", "Bug & issue triage", "Good Fit"], ["init-09", "Testing", "Strong Fit"],
    ["init-10", "Code migrations & refactors", "Strong Fit"], ["init-10", "Bug & issue triage", "Good Fit"],
    ["init-11", "And much more…", "Strong Fit"], ["init-12", "And much more…", "Moderate Fit"],
  ];
  const insertFit = db.prepare("INSERT INTO use_case_fits (id, initiative_id, category, ranking) VALUES (?, ?, ?, ?)");
  for (const [initId, cat, rank] of fits) insertFit.run(uid(), initId, cat, rank);

  // Tickets
  const ticketData: Record<string, string[]> = {
    "init-01": ["Migrate UserService to Kotlin", "Convert PaymentModule to Kotlin coroutines", "Kotlin migration: OrderProcessor", "Refactor AuthService with Kotlin DSL", "Convert NotificationEngine to Kotlin", "Migrate DataLayer repositories", "Kotlin: ReportGenerator conversion", "Convert CacheManager to Kotlin", "Migrate SearchIndex module", "Convert ConfigService to Kotlin", "Kotlin: EventBus handlers", "Refactor BatchProcessor with Kotlin flows"],
    "init-02": ["Migrate customer_dims to Snowflake", "ETL: order_facts pipeline conversion", "Snowflake: product_catalog migration", "Convert revenue_reporting ETL", "Migrate user_analytics pipeline", "Snowflake: inventory_tracking tables", "ETL: marketing_attribution conversion", "Migrate session_events to Snowflake", "Convert financial_reporting ETL", "Snowflake: support_metrics migration"],
    "init-03": ["Upgrade Dashboard to React 19", "Convert UserProfile to Server Component", "Migrate SettingsPage to RSC", "React 19: OrderHistory component", "Upgrade SearchResults with Suspense", "Convert NotificationCenter to RSC", "React 19: AccountSettings migration", "Upgrade ProductCatalog component"],
    "init-04": ["E2E tests: Employee Portal login flow", "API contract tests: HR endpoints", "Browser tests: Timesheet submission", "Unit tests: Expense calculator", "E2E tests: Asset management CRUD", "API tests: Directory service", "Browser tests: Onboarding wizard", "Integration tests: SSO flow"],
    "init-05": ["Patch CVE-2024-3421 across repos", "Fix SonarQube: SQL injection findings", "Remediate XSS vulnerabilities", "Update deprecated crypto libraries", "Fix insecure deserialization", "Patch log4j remaining instances", "Remediate CSRF findings", "Update TLS configurations"],
    "init-06": ["Terraform: VPC and subnet modules", "IaC: RDS instance provisioning", "Terraform: S3 bucket policies", "IaC: CloudFront distributions", "Terraform: ECS cluster configs", "IaC: IAM roles and policies", "Terraform: Route53 DNS records", "IaC: Lambda function deployment"],
    "init-10": ["OAuth integration: AppOne", "OIDC setup: Internal Dashboard", "Auth migration: ReportingTool", "OAuth: InventorySystem conversion", "OIDC: HRPortal migration", "Auth: DevTools SSO integration"],
    "init-11": ["Generate docs: PaymentService API", "Runbook: OrderProcessor", "API docs: UserManagement endpoints", "Generate docs: SearchService", "Runbook: DeploymentPipeline", "API docs: NotificationService"],
  };

  const insertTicket = db.prepare("INSERT INTO tickets (key, initiative_id, title, status, source) VALUES (?, ?, ?, ?, ?)");
  const ticketKeys: Record<string, string[]> = {};
  const statuses = ["Done", "In Progress", "In Review", "To Do"];

  for (const [initId, titles] of Object.entries(ticketData)) {
    const init = initiatives.find((i) => i.id === initId)!;
    const prefix = init.key;
    ticketKeys[initId] = [];
    titles.forEach((title, idx) => {
      const k = `${prefix}-${1000 + idx}`;
      const st = init.status === "Completed" ? "Done" : pick(statuses);
      insertTicket.run(k, initId, title, st, Math.random() > 0.3 ? "jira" : "rally");
      ticketKeys[initId].push(k);
    });
  }

  // Sessions
  const insertSession = db.prepare("INSERT INTO devin_sessions (id, initiative_id, ticket_key, user_email, bu_id, acus_consumed, started_at, ended_at, outcome) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  const usersByBU: Record<string, string[]> = {
    "bu-plat": ["alice.w@acme.com", "bob.m@acme.com", "carol.s@acme.com", "dan.t@acme.com"],
    "bu-data": ["eve.n@acme.com", "frank.l@acme.com", "grace.h@acme.com"],
    "bu-cust": ["henry.z@acme.com", "iris.c@acme.com", "jack.b@acme.com"],
    "bu-intl": ["kate.r@acme.com", "leo.p@acme.com", "mia.g@acme.com"],
    "bu-sec": ["noah.d@acme.com", "olivia.f@acme.com"],
    "bu-infra": ["peter.k@acme.com", "quinn.a@acme.com", "ryan.v@acme.com"],
  };
  const outcomes: ("Merged" | "In Review" | "Abandoned")[] = ["Merged", "Merged", "Merged", "In Review", "Abandoned"];

  // Tagged sessions
  const activeInits = initiatives.filter((i) => i.status === "Approved" || i.status === "Completed");
  for (const init of activeInits) {
    const keys = ticketKeys[init.id] || [];
    const users = usersByBU[init.bu_id];
    const numSessions = Math.max(15, Math.min(50, Math.floor(init.acus / 5000)));
    const approvedDaysAgo = init.approvedDays || 60;

    for (let s = 0; s < numSessions; s++) {
      const daysAgo = rand(1, Math.min(90, approvedDaysAgo));
      let acus = rand(200, Math.min(8000, Math.floor(init.acus / numSessions * 2)));
      // Pacing control: init-06 red, init-03 amber, init-01 green
      if (init.id === "init-06") acus = Math.floor(acus * 1.8);
      if (init.id === "init-03") acus = Math.floor(acus * 1.3);
      if (init.id === "init-01") acus = Math.floor(acus * 0.6);

      insertSession.run(uid(), init.id, keys.length > 0 ? pick(keys) : null, pick(users), init.bu_id, acus, dateStr(daysAgo), dateStr(Math.max(0, daysAgo - 1)), pick(outcomes));
    }
  }

  // Untagged sessions (Internal Tools worst, Security best)
  const untagged: Record<string, number> = { "bu-plat": 18, "bu-data": 15, "bu-cust": 22, "bu-intl": 55, "bu-sec": 4, "bu-infra": 12 };
  for (const [buId, count] of Object.entries(untagged)) {
    const users = usersByBU[buId];
    for (let s = 0; s < count; s++) {
      const daysAgo = rand(1, 90);
      insertSession.run(uid(), null, null, pick(users), buId, rand(100, 3000), dateStr(daysAgo), dateStr(Math.max(0, daysAgo - 1)), pick(outcomes));
    }
  }

  console.log("Database seeded successfully");
}
