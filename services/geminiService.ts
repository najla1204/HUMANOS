
import { GoogleGenAI, Type } from "@google/genai";
import { UserTwinProfile, Scenario, SimulationResult } from "../types.ts";

export const runDecisionSimulation = async (
  profile: UserTwinProfile,
  scenarioA: Scenario,
  scenarioB: Scenario,
  modelTier: 'gemini-3-pro-preview' | 'gemini-3-flash-preview' = 'gemini-3-pro-preview'
): Promise<SimulationResult> => {
  // Guidelines: Create a new instance right before making an API call 
  // to ensure it always uses the most up-to-date API key from the dialog.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Role: HUMANOS Stochastic Decision Engine.
    Context: Persona ${profile.name} (Context: ${profile.major}), Values: [${profile.coreValues.join(", ")}].
    
    Input Scenarios to Stress-Test:
    Scenario Alpha: ${scenarioA.title} - ${scenarioA.description}
    Scenario Beta: ${scenarioB.title} - ${scenarioB.description}
    
    Analysis Protocol:
    1. Project the most likely outcomes for Alpha and Beta over a 3-year horizon.
    2. Synthesize a third "Optimal Convergence" (Scenario C) that merges benefits of A and B while mitigating risks.
    3. Generate stochastic metrics (0-100) for Skill Growth, Value Alignment, Optionality, and Friction.
    4. Produce a concise narrative snapshot for each path.
    
    Output strictly valid JSON according to the requested schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelTier, 
      contents: prompt,
      config: {
        // Higher thinking budget for Pro model to handle complex stochastic reasoning.
        ...(modelTier === 'gemini-3-pro-preview' ? { thinkingConfig: { thinkingBudget: 32768 } } : {}),
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scenarioA: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                skillGrowth: { type: Type.NUMBER },
                valueAlignment: { type: Type.NUMBER },
                futureOptionality: { type: Type.NUMBER },
                frictionIndicator: { type: Type.NUMBER },
                narrativeSnapshot: { type: Type.STRING },
              },
              required: ["title", "skillGrowth", "valueAlignment", "futureOptionality", "frictionIndicator", "narrativeSnapshot"],
            },
            scenarioB: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                skillGrowth: { type: Type.NUMBER },
                valueAlignment: { type: Type.NUMBER },
                futureOptionality: { type: Type.NUMBER },
                frictionIndicator: { type: Type.NUMBER },
                narrativeSnapshot: { type: Type.STRING },
              },
              required: ["title", "skillGrowth", "valueAlignment", "futureOptionality", "frictionIndicator", "narrativeSnapshot"],
            },
            scenarioC: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                skillGrowth: { type: Type.NUMBER },
                valueAlignment: { type: Type.NUMBER },
                futureOptionality: { type: Type.NUMBER },
                frictionIndicator: { type: Type.NUMBER },
                narrativeSnapshot: { type: Type.STRING },
              },
              required: ["title", "skillGrowth", "valueAlignment", "futureOptionality", "frictionIndicator", "narrativeSnapshot"],
            },
            tradeOffs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  pathAValue: { type: Type.NUMBER },
                  pathBValue: { type: Type.NUMBER },
                  pathCValue: { type: Type.NUMBER },
                },
                required: ["label", "pathAValue", "pathBValue", "pathCValue"],
              }
            },
            comparativeAnalysis: { type: Type.STRING },
          },
          required: ["scenarioA", "scenarioB", "scenarioC", "tradeOffs", "comparativeAnalysis"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("Null response from the simulation engine.");
    return JSON.parse(text.trim());
  } catch (err: any) {
    console.error("Simulation Error:", err);
    throw err;
  }
};
