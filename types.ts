
export interface UserTwinProfile {
  name: string;
  major: string;
  coreValues: string[];
  topSkills: string[];
}

export interface Scenario {
  title: string;
  description: string;
}

export interface SimulationRecord {
  id: string;
  timestamp: number;
  profile: UserTwinProfile;
  scenarioA: Scenario;
  scenarioB: Scenario;
  results: SimulationResult;
}

export interface SimulationResult {
  scenarioA: ScenarioOutcome;
  scenarioB: ScenarioOutcome;
  scenarioC: ScenarioOutcome; 
  comparativeAnalysis: string;
  tradeOffs: {
    label: string;
    pathAValue: number; // Relative Index 0-100
    pathBValue: number; // Relative Index 0-100
    pathCValue: number; // Relative Index 0-100
  }[];
}

export interface ScenarioOutcome {
  title: string;
  skillGrowth: number; // Potential growth index
  valueAlignment: number; // Alignment index
  futureOptionality: number; // Door-opening index
  frictionIndicator: number; // Friction probability index
  narrativeSnapshot: string; 
}

export enum AppStep {
  ONBOARDING = 'ONBOARDING',
  SCENARIO_INPUT = 'SCENARIO_INPUT',
  SIMULATING = 'SIMULATING',
  DASHBOARD = 'DASHBOARD',
  HISTORY = 'HISTORY'
}
