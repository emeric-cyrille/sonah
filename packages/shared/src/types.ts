// Types partagés
export interface UserIntent {
  action: string;
  type?: string;
  location?: string;
  metadata?: Record<string, any>;
}

export interface AgentResult {
  agent: string;
  ministry?: string;
  procedure: string;
  documents: string[];
  cost: number;
  duration: number;
  location: string;
  tips: string[];
  outputDocument?: string;
  status?: string;
}

export interface ProcedurePlan {
  summary: {
    totalDuration: number;
    totalCost: number;
    successProbability: number;
    timeSavedVsTraditional: number;
  };
  steps: Array<{
    step: number;
    agents: string[];
    execution: 'parallel' | 'sequential';
    message: string;
    details: AgentResult | AgentResult[];
  }>;
  tips: string[];
  timeline: Array<{
    day: number;
    action: string;
  }>;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}
