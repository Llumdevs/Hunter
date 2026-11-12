import { requireUserWithProfile } from "@/lib/auth/session";
import { AppShell } from "@/components/app-shell";
import { Notice } from "@/components/ui";
import { customerHistorySchema, venuesSchema } from "@/lib/rewards/data";
import { CustomerPurchases } from "./customer-purchases";

export default async function PurchasesPage() {
  const { supabase } = await requireUserWithProfile("/compras");
  const [venues, history] = await Promise.all([supabase.rpc("purchase_venues"), supabase.rpc("my_purchase_history")]);
  const places = venuesSchema.safeParse(venues.data); const purchases = customerHistorySchema.safeParse(history.data);
  return <AppShell>{!venues.error && !history.error && places.success && purchases.success ? <CustomerPurchases venues={places.data} purchases={purchases.data} /> : <Notice title="No hemos podido cargar tus compras">Puede faltar aplicar la actualización de compras y puntos.</Notice>}</AppShell>;
}
