export interface Claim {
  text: string;
  evidence: string;
  confidence: number;
  source: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  perspective: string;
  system_prompt: string;
  stage: number;
  temperature: number;
  model: string;
  conflict_partners: string[];
  enabled: boolean;
  project_id: string | null;
}

export interface AgentOutput {
  id: string;
  agent_id: string;
  agent_name: string;
  stage: number;
  project_id: string;
  content: string;
  claims: Claim[];
  status: "pending" | "running" | "complete" | "error";
  error: string | null;
  created_at: string;
}

export interface AgentPosition {
  agent_name: string;
  position: string;
  evidence: string;
  confidence: number;
}

export interface AgreementPoint {
  topic: string;
  summary: string;
  supporting_agents: string[];
  evidence: string[];
}

export interface DisagreementPoint {
  topic: string;
  summary: string;
  positions: AgentPosition[];
}

export interface ConflictReport {
  stage: number;
  agreements: AgreementPoint[];
  disagreements: DisagreementPoint[];
  unresolved_tensions: string[];
  synthesis: string;
}

export type StageStatus = "pending" | "running" | "complete" | "approved" | "skipped";

export interface StageResult {
  id: string;
  project_id: string;
  stage_number: number;
  status: StageStatus;
  agent_outputs: AgentOutput[];
  conflict_report: ConflictReport | null;
  human_override: string | null;
  human_notes: string;
  approved_at: string | null;
  created_at: string;
}

export type ProjectState = "draft" | "in_progress" | "complete";

export interface Project {
  id: string;
  name: string;
  research_question: string;
  context: string;
  state: ProjectState;
  current_stage: number;
  stage_results: StageResult[];
  created_at: string;
  updated_at: string;
}

export const STAGE_NAMES: Record<number, string> = {
  1: "Problem Framing",
  2: "Evidence Gathering",
  3: "Analysis & Interpretation",
  4: "Insight Synthesis",
  5: "Communication",
  6: "Prototype & Intervention",
};

export const STAGE_DESCRIPTIONS: Record<number, string> = {
  1: "Define the research question, scope, and stakeholder landscape.",
  2: "Identify and gather evidence from multiple sources.",
  3: "Analyze evidence through multiple lenses, surface patterns and conflicts.",
  4: "Synthesize findings into actionable insights with confidence levels.",
  5: "Generate tailored deliverables for different audiences.",
  6: "Design interventions and prototypes grounded in research findings.",
};
