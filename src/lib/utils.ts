import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return crypto.randomUUID();
}

export const ACU_RATE_USD = parseFloat(process.env.ACU_RATE_USD || "2.25");

export const USE_CASE_BUCKETS = [
  {
    category: "Code migrations & refactors",
    examples: [
      "Language migrations",
      "Large refactors",
      "Version upgrades",
      "Codebase restructuring",
    ],
  },
  {
    category: "Bug & issue triage",
    examples: [
      "Automated on-call response",
      "Ticket resolution",
      "CI/CD autotriage",
    ],
  },
  {
    category: "Testing",
    examples: [
      "Generate code coverage reports",
      "Improve test coverage",
      "Browser-based QA testing",
    ],
  },
  {
    category: "Code modernization",
    examples: [
      "Technical debt",
      "On-prem-to-cloud modernization",
      "Large-scale lint or warning fixes",
    ],
  },
  {
    category: "Data engineering",
    examples: [
      "Data warehouse migrations",
      "ETL development",
      "Data cleaning and preprocessing",
    ],
  },
  {
    category: "And much more…",
    examples: [
      "Maintain documentation",
      "Build SaaS integrations",
      "Implement frontend features",
      "Self-host and test applications",
    ],
  },
] as const;

export type UseCaseCategory = (typeof USE_CASE_BUCKETS)[number]["category"];
export type FitRanking = "Strong Fit" | "Good Fit" | "Moderate Fit";
export type StrategicPriority = "Critical" | "High" | "Medium";
export type InitiativeStatus = "Pending Review" | "Approved" | "Completed" | "Rejected";
export type Persona = "IT Leader" | "Finance Approver" | "BU Admin";
