export interface PainPoint {
  icon: string;
  title: string;
  desc: string;
}


export interface GenZStats {
  customerShare: number;
  revenueShare: number;
  socialFollowers: string;
  topPlatform: string;
  campusPresence: string;
  coldCallStat: string;
  coldCallHook: string;
}

export interface Company {
  id: string;
  name: string;
  domain: string;
  industry: string;
  hq: string;
  founded: string;
  size: string;
  revenue: string;
  ceo: string;
  why: string[];
  pains: PainPoint[];
  tags: string[];

  genZStats: GenZStats;
}

export interface SequenceStep {
  num: number;
  icon: string;
  type: string;
  timing: string;
  subject: string | null;
  body: string;
}

export type TabId = 'contacts' | 'sequence' | 'callintel';



export interface EnrichedPersona {
  name: string;
  role: string;
  priority: 'p1' | 'p2';
  email: string;
  linkedin: string;
  focus: string;
  coldCallAngle: string;
  confidence: number;
}

export type CallSentiment = 'interested' | 'neutral' | 'cold';
export type DealStage =
  | 'discovery'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost';

export interface PitchMetrics {
  pitchScore: number;
  talkRatio: number;
  questionsAsked: number;
  fillerWords: string[];
  strengths: string[];
  improvements: string[];
  openingStrength: number;
  closingStrength: number;
}

export interface CallAnalysis {
  summary: string;
  sentiment: CallSentiment;
  sentimentScore: number;
  objections: string[];
  nextStep: string;
  dealStage: DealStage;
  keyInsights: string[];
  followUpEmail: {
    subject: string;
    body: string;
  };
  talkTrack: string;
  pitchMetrics?: PitchMetrics;
  reasoning?: string;
}
