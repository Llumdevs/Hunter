import { z } from "zod";

// Next solo inyecta en el cliente las variables NEXT_PUBLIC_* referenciadas literalmente.
const publicEnvSchema = z.object({
  supabaseUrl: z.url(),
  supabaseKey: z.string().min(1),
  appOrigin: z.url().transform((value) => new URL(value).origin),
});

export const publicEnv = publicEnvSchema.parse({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  appOrigin: process.env.NEXT_PUBLIC_APP_ORIGIN,
});
