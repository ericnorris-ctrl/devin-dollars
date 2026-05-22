import { getDb } from "./db";

export type BU = { id: string; name: string; lead_name: string; lead_email: string };
export type Initiative = {
  id: string; name: string; bu_id: string; bu_name: string;
  sponsor_name: string; sponsor_email: string; description: string;
  jira_project_key: string; approved_budget_usd: number; requested_acus: number;
  estimated_cost_with_devin_usd: number; strategic_priority: string;
  status: string; funding_score: number; planned_end_date: string | null;
  approved_at: string | null; created_at: string;
};
export type UseCaseFit = { id: string; initiative_id: string; category: string; ranking: string };
export type Session = {
  id: string; initiative_id: string | null; ticket_key: string | null;
  user_email: string; bu_id: string; acus_consumed: number;
  started_at: string; ended_at: string | null; outcome: string;
};
export type Ticket = { key: string; initiative_id: string; title: string; status: string; source: string };

export function getAllBUs(): BU[] {
  return getDb().prepare("SELECT * FROM business_units ORDER BY name").all() as BU[];
}

export function getAllInitiatives(): Initiative[] {
  return getDb().prepare(`
    SELECT i.*, b.name as bu_name FROM initiatives i
    JOIN business_units b ON b.id = i.bu_id ORDER BY i.created_at DESC
  `).all() as Initiative[];
}

export function getInitiative(id: string): Initiative | undefined {
  return getDb().prepare(`
    SELECT i.*, b.name as bu_name FROM initiatives i
    JOIN business_units b ON b.id = i.bu_id WHERE i.id = ?
  `).get(id) as Initiative | undefined;
}

export function getUseCaseFits(initiativeId: string): UseCaseFit[] {
  return getDb().prepare("SELECT * FROM use_case_fits WHERE initiative_id = ?").all(initiativeId) as UseCaseFit[];
}

export function getSessionsForInitiative(initiativeId: string): Session[] {
  return getDb().prepare(
    "SELECT * FROM devin_sessions WHERE initiative_id = ? ORDER BY started_at DESC"
  ).all(initiativeId) as Session[];
}

export function getTicketsForInitiative(initiativeId: string): Ticket[] {
  return getDb().prepare("SELECT * FROM tickets WHERE initiative_id = ?").all(initiativeId) as Ticket[];
}

export function getAllSessions(): Session[] {
  return getDb().prepare("SELECT * FROM devin_sessions ORDER BY started_at DESC").all() as Session[];
}

export function getKPIs() {
  const db = getDb();
  const totalAllocated = db.prepare(
    "SELECT COALESCE(SUM(requested_acus), 0) as v FROM initiatives WHERE status IN ('Approved','Completed')"
  ).get() as { v: number };

  const totalConsumed = db.prepare(
    "SELECT COALESCE(SUM(acus_consumed), 0) as v FROM devin_sessions"
  ).get() as { v: number };

  const totalSavings = db.prepare(`
    SELECT COALESCE(SUM(approved_budget_usd - estimated_cost_with_devin_usd), 0) as v
    FROM initiatives WHERE status IN ('Approved','Completed')
  `).get() as { v: number };

  const totalSessions = db.prepare("SELECT COUNT(*) as v FROM devin_sessions").get() as { v: number };
  const taggedSessions = db.prepare(
    "SELECT COUNT(*) as v FROM devin_sessions WHERE ticket_key IS NOT NULL"
  ).get() as { v: number };

  const taggedPercent = totalSessions.v > 0 ? taggedSessions.v / totalSessions.v : 0;

  return {
    totalAllocatedAcus: totalAllocated.v,
    totalConsumedAcus: totalConsumed.v,
    totalProjectedSavings: totalSavings.v,
    taggedPercent,
  };
}

export function createInitiative(data: {
  id: string; name: string; bu_id: string; sponsor_name: string; sponsor_email: string;
  description: string; jira_project_key: string; approved_budget_usd: number;
  requested_acus: number; estimated_cost_with_devin_usd: number;
  strategic_priority: string; funding_score: number;
  use_case_fits: { category: string; ranking: string }[];
}) {
  const db = getDb();
  db.prepare(`
    INSERT INTO initiatives (id, name, bu_id, sponsor_name, sponsor_email, description,
      jira_project_key, approved_budget_usd, requested_acus, estimated_cost_with_devin_usd,
      strategic_priority, status, funding_score, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending Review', ?, datetime('now'))
  `).run(
    data.id, data.name, data.bu_id, data.sponsor_name, data.sponsor_email,
    data.description, data.jira_project_key, data.approved_budget_usd,
    data.requested_acus, data.estimated_cost_with_devin_usd,
    data.strategic_priority, data.funding_score
  );

  const insertFit = db.prepare(
    "INSERT INTO use_case_fits (id, initiative_id, category, ranking) VALUES (?, ?, ?, ?)"
  );
  for (const fit of data.use_case_fits) {
    insertFit.run(crypto.randomUUID(), data.id, fit.category, fit.ranking);
  }
}

export function updateInitiativeStatus(id: string, status: string) {
  const db = getDb();
  if (status === "Approved") {
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 6);
    db.prepare(
      "UPDATE initiatives SET status = ?, approved_at = datetime('now'), planned_end_date = ? WHERE id = ?"
    ).run(status, endDate.toISOString(), id);
  } else {
    db.prepare("UPDATE initiatives SET status = ? WHERE id = ?").run(status, id);
  }
}

export function getLeaderboardData(periodDays: number) {
  const db = getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - periodDays);
  const cutoffStr = cutoff.toISOString();

  const priorCutoff = new Date();
  priorCutoff.setDate(priorCutoff.getDate() - periodDays * 2);
  const priorCutoffStr = priorCutoff.toISOString();

  const rows = db.prepare(`
    SELECT
      b.id as bu_id, b.name as bu_name, b.lead_name, b.lead_email,
      COALESCE(SUM(CASE WHEN s.ticket_key IS NULL THEN s.acus_consumed ELSE 0 END), 0) as untagged_acus,
      COALESCE(SUM(s.acus_consumed), 0) as total_acus
    FROM business_units b
    LEFT JOIN devin_sessions s ON s.bu_id = b.id AND s.started_at >= ?
    GROUP BY b.id ORDER BY untagged_acus DESC
  `).all(cutoffStr) as {
    bu_id: string; bu_name: string; lead_name: string; lead_email: string;
    untagged_acus: number; total_acus: number;
  }[];

  const priorRows = db.prepare(`
    SELECT
      b.id as bu_id,
      COALESCE(SUM(CASE WHEN s.ticket_key IS NULL THEN s.acus_consumed ELSE 0 END), 0) as untagged_acus
    FROM business_units b
    LEFT JOIN devin_sessions s ON s.bu_id = b.id AND s.started_at >= ? AND s.started_at < ?
    GROUP BY b.id
  `).all(priorCutoffStr, cutoffStr) as { bu_id: string; untagged_acus: number }[];

  const priorMap = Object.fromEntries(priorRows.map((r) => [r.bu_id, r.untagged_acus]));

  const topUntaggedUsers = db.prepare(`
    SELECT bu_id, user_email, SUM(acus_consumed) as acus
    FROM devin_sessions WHERE ticket_key IS NULL AND started_at >= ?
    GROUP BY bu_id, user_email ORDER BY acus DESC
  `).all(cutoffStr) as { bu_id: string; user_email: string; acus: number }[];

  const usersByBU: Record<string, { email: string; acus: number }[]> = {};
  for (const u of topUntaggedUsers) {
    if (!usersByBU[u.bu_id]) usersByBU[u.bu_id] = [];
    if (usersByBU[u.bu_id].length < 3) {
      usersByBU[u.bu_id].push({ email: u.user_email, acus: u.acus });
    }
  }

  return rows.map((r, i) => ({
    rank: i + 1,
    buId: r.bu_id,
    buName: r.bu_name,
    leadName: r.lead_name,
    untaggedAcus: r.untagged_acus,
    totalAcus: r.total_acus,
    untaggedPercent: r.total_acus > 0 ? r.untagged_acus / r.total_acus : 0,
    priorUntaggedAcus: priorMap[r.bu_id] ?? 0,
    topUsers: usersByBU[r.bu_id] ?? [],
  }));
}
