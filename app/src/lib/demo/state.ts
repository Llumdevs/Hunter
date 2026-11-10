import { z } from "zod";
import { isDemoPlace } from "./catalog";

export const DEMO_STORAGE_KEY = "hunter-demo-v1";
const planSchema = z.object({ placeId: z.string().refine(isDemoPlace), checkedIn: z.boolean(), rating: z.number().int().min(1).max(5).nullable() });
const friendSchema = z.object({ id: z.string(), name: z.string(), status: z.enum(["accepted", "incoming", "outgoing"]) });
const stateSchema = z.object({ plans: z.array(planSchema).max(20), friends: z.array(friendSchema).max(20) });
export type DemoState = z.infer<typeof stateSchema>;
export const initialDemoState = (): DemoState => ({ plans: [], friends: [
  { id: "demo-clara", name: "Clara · Demo", status: "accepted" },
  { id: "demo-marc", name: "Marc · Demo", status: "incoming" },
  { id: "demo-alex", name: "Álex · Demo", status: "outgoing" },
] });
export function readDemoState(value: string | null): DemoState {
  try { const result = stateSchema.safeParse(JSON.parse(value ?? "null")); return result.success ? result.data : initialDemoState(); }
  catch { return initialDemoState(); }
}
export function demoPoints(state: DemoState): number {
  return state.plans.reduce((total, plan) => total + (plan.checkedIn ? 10 : 0) + (plan.checkedIn && plan.rating !== null ? 5 : 0), 0);
}
