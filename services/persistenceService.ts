
import { SimulationRecord } from "../types.ts";

const STORAGE_KEY = 'humanos_simulation_history';

export const saveSimulation = (record: SimulationRecord): void => {
  const history = getHistory();
  const newHistory = [record, ...history].slice(0, 10); // Keep last 10 for demo
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
};

export const getHistory = (): SimulationRecord[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const clearHistory = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
