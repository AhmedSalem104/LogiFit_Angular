/** One actionable step with its expected result. */
export interface HelpStep {
  /** What the user does (e.g. "اكتب اسم العميل في حقل الاسم"). */
  text: string;
  /** What they should see after (optional). */
  result?: string;
}

/** A jump to another screen when a task spans screens. */
export interface HelpJump {
  label: string;
  route: string;
}

/** A single answerable topic within a screen — used for the local "ask" search. */
export interface HelpTopic {
  id: string;
  /** The topic phrased as a question / title. */
  question: string;
  /** Extra terms to match the user's free-text query against. */
  keywords: string[];
  steps: HelpStep[];
  note?: string;
  /** Screens the user must move to for this task. */
  jumps?: HelpJump[];
}

/** A common mistake on a screen and how to resolve it. */
export interface HelpPitfall {
  problem: string;
  fix: string;
}

/** Curated help for one screen, keyed by a route pattern. */
export interface ScreenHelp {
  key: string;
  /** Matched against Router.url (prefix match on the pathname). */
  route: string;
  title: string;
  /** One line: what this screen is for. */
  summary: string;
  /** Which workspace it belongs to (drives the guided flow grouping). */
  role: 'owner' | 'coach' | 'client' | 'any';
  /** The primary "how to complete the main task here" steps. */
  steps: HelpStep[];
  /** Additional Q&A topics for the local assistant. */
  topics?: HelpTopic[];
  /** Common mistakes + fixes shown on the local assistant. */
  pitfalls?: HelpPitfall[];
  /** Id of an interactive tour that covers this screen's main flow. */
  tourId?: string;
  note?: string;
  jumps?: HelpJump[];
}

/** An ordered, role-specific journey shown by the global assistant. */
export interface GuidedFlow {
  id: string;
  role: 'owner' | 'coach' | 'client';
  title: string;
  description: string;
  icon: string;
  /** Ordered steps, each optionally deep-linking to the screen it happens on. */
  steps: { text: string; route?: string; result?: string }[];
}
