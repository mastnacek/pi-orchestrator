export interface RouteVerdict {
  specialist: string | null;
  runner_up: string | null;
  confidence: number;
  judged_by: "offline" | "jev";
  scores: Array<[string, number]>;
  context_slice: Array<{
    id: string;
    title: string;
    fact_type: string;
    score: number;
    tags: string[];
  }>;
  note: string | null;
}

export interface HerdrAgent {
  agent: string;
  agent_status: "idle" | "working" | "blocked" | "done" | "unknown";
  cwd?: string;
  focused: boolean;
  pane_id: string;
  tab_id: string;
  workspace_id?: string;
  terminal_title?: string;
}

export interface HerdrPane {
  pane_id: string;
  tab_id: string;
  workspace_id?: string;
  cwd?: string;
  agent?: string;
  agent_status?: string;
  focused: boolean;
  label?: string;
  terminal_title?: string;
}

export interface HerdrTab {
  tab_id: string;
  workspace_id: string;
  number: number;
  label?: string;
  focused: boolean;
  pane_count: number;
  agent_status?: string;
}
