import { z } from "zod";
import { isDemoPlace } from "./catalog";

export const DEMO_STORAGE_KEY = "hunter-demo-v1";
const planSchema = z.object({ placeId: z.string().refine(isDemoPlace), checkedIn: z.boolean(), purchaseValidated: z.boolean().default(false), rating: z.number().int().min(1).max(5).nullable() });
const stateSchema = z.object({ plans: z.array(planSchema).max(20) });
export type DemoState = z.infer<typeof stateSchema>;
export const initialDemoState = (): DemoState => ({ plans: [] });
export function readDemoState(value: string | null): DemoState {
  try { const result = stateSchema.safeParse(JSON.parse(value ?? "null")); return result.success ? result.data : initialDemoState(); }
  catch { return initialDemoState(); }
}
export function demoPoints(state: DemoState): number {
  return state.plans.reduce((total, plan) => total + (plan.purchaseValidated ? 10 : 0), 0);
}
