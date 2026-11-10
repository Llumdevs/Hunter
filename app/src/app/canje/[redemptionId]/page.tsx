import { RedemptionScreen } from "./redemption-screen";
import { Notice } from "@/components/ui";
import { requireUserWithProfile } from "@/lib/auth/session";
import { redemptionDisplayCode } from "@/lib/checkin/display-code";

export default async function RedemptionPage({ params }: { params: Promise<{ redemptionId: string }> }) {
  const { redemptionId } = await params;
  const { supabase } = await requireUserWithProfile(`/canje/${redemptionId}`);
  const { data } = await supabase
    .from("redemptions")
    .select("id, offer_snapshot, expires_at, checkins(places(name, cities(timezone)))")
    .eq("id", redemptionId)
    .maybeSingle();
  const place = data?.checkins?.places;
  if (!data || !place?.cities) return <Notice title="Canje no encontrado" />;

  const snapshot = data.offer_snapshot as { title: string };
  return (
    <RedemptionScreen
      placeName={place.name}
      offerTitle={snapshot.title}
      displayCode={redemptionDisplayCode(data.id)}
      expiresAt={data.expires_at}
      timeZone={place.cities.timezone}
    />
  );
}
