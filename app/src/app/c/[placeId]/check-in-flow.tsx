"use client";

import { ArrowLeft, Check, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PlacePhoto } from "@/components/place-photo";
import { SlideToConfirm } from "@/components/slide-to-confirm";
import { ErrorText, IconLink, PrimaryButton, SecondaryButton } from "@/components/ui";
import type { CheckInCredential } from "@/lib/checkin/link";
import { checkInErrorMessage, redeemErrorMessage, UNEXPECTED_ERROR_MESSAGE } from "@/lib/checkin/messages";
import { offersForNight, type Offer } from "@/lib/checkin/offers";
import { parseCheckinRow, parseCheckInResult, parseRedeemResult, type Checkin } from "@/lib/checkin/results";
import { requestPosition, type PositionResult } from "@/lib/geo/position";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Props = {
  placeId: string; placeName: string; zone: string; coverPath: string | null; credential: CheckInCredential; offers: Offer[];
};

type State =
  | { step: "ready" }
  | { step: "working"; label: string }
  | { step: "checked_in"; checkin: Checkin; withoutLocation: boolean }
  | { step: "failed"; message: string };

const ALCOHOL_WARNING = "El consumo de alcohol perjudica la salud. Bebe con moderación.";

function credentialParams(credential: CheckInCredential) {
  return credential.type === "static" ? { p_static_token: credential.token } : { p_screen_code: credential.code };
}

function positionParams(position: PositionResult) {
  return position.kind === "granted" ? { p_lat: position.lat, p_lng: position.lng } : {};
}

export function CheckInFlow({ placeId, placeName, zone, coverPath, credential, offers }: Props) {
  const router = useRouter();
  const [state, setState] = useState<State>({ step: "ready" });
  const supabase = createSupabaseBrowserClient();

  async function goToExistingRedemption(checkinId: string): Promise<boolean> {
    const { data } = await supabase.from("redemptions").select("id").eq("checkin_id", checkinId).maybeSingle();
    if (data) router.push(`/canje/${data.id}`);
    return Boolean(data);
  }

  async function loadTonightCheckin(): Promise<Checkin | null> {
    const { data } = await supabase
      .from("checkins")
      .select("id, place_id, night_date, geo_ok")
      .eq("place_id", placeId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data ? parseCheckinRow(data) : null;
  }

  async function showCheckedIn(checkin: Checkin, withoutLocation: boolean) {
    if (await goToExistingRedemption(checkin.id)) return;
    setState({ step: "checked_in", checkin, withoutLocation });
  }

  async function checkIn() {
    setState({ step: "working", label: "Comprobando tu ubicación…" });
    const position = await requestPosition(navigator.geolocation);
    setState({ step: "working", label: "Haciendo check-in…" });
    const { data, error } = await supabase.rpc("check_in", {
      p_place_id: placeId,
      ...credentialParams(credential),
      ...positionParams(position),
    });
    if (error) return setState({ step: "failed", message: UNEXPECTED_ERROR_MESSAGE });

    const result = parseCheckInResult(data);
    if (result.ok) return showCheckedIn(result.checkin, position.kind !== "granted");
    if (result.error === "already_checked_in") {
      const existing = await loadTonightCheckin();
      if (existing) return showCheckedIn(existing, !existing.geoOk);
    }
    setState({ step: "failed", message: checkInErrorMessage(result.error) });
  }

  async function redeem(checkin: Checkin, offerId: string) {
    setState({ step: "working", label: "Canjeando…" });
    const { data, error } = await supabase.rpc("redeem", { p_checkin_id: checkin.id, p_offer_id: offerId });
    if (error) return setState({ step: "failed", message: UNEXPECTED_ERROR_MESSAGE });

    const result = parseRedeemResult(data);
    if (result.ok) return router.push(`/canje/${result.redemption.id}`);
    if (result.error === "already_redeemed" && (await goToExistingRedemption(checkin.id))) return;
    setState({ step: "failed", message: redeemErrorMessage(result.error) });
  }

  return (
    <section className="flex flex-1 flex-col gap-6">
      <header className="flex items-center gap-3">
        <IconLink href="/" label="Volver al inicio"><ArrowLeft aria-hidden className="h-5 w-5" /></IconLink>
        <div>
          <p className="flex items-center gap-1 text-sm text-muted"><MapPin aria-hidden className="h-4 w-4" />{zone}</p>
          <h1 className="text-3xl font-extrabold">{placeName}</h1>
        </div>
      </header>

      {state.step === "ready" && (
        <div className="mt-auto flex flex-col gap-4">
          <PlacePhoto path={coverPath} alt={placeName} className="h-48 rounded-[var(--radius-card)]" />
          <p className="text-muted">
            Te pediremos la ubicación una sola vez para comprobar que estás en el local. Si no la das, puedes seguir igualmente.
          </p>
          <PrimaryButton onClick={checkIn}>Hacer check-in</PrimaryButton>
        </div>
      )}

      {state.step === "working" && (
        <p aria-live="polite" className="mt-auto text-center text-lg font-semibold">{state.label}</p>
      )}

      {state.step === "failed" && (
        <div className="mt-auto flex flex-col gap-3">
          <ErrorText>{state.message}</ErrorText>
          <SecondaryButton onClick={() => setState({ step: "ready" })}>Volver a intentarlo</SecondaryButton>
        </div>
      )}

      {state.step === "checked_in" && <CheckedIn state={state} offers={offers} coverPath={coverPath} placeName={placeName} onRedeem={redeem} />}
    </section>
  );
}

type CheckedInProps = {
  state: Extract<State, { step: "checked_in" }>;
  offers: Offer[];
  coverPath: string | null;
  placeName: string;
  onRedeem: (checkin: Checkin, offerId: string) => void;
};

function CheckedIn({ state, offers, coverPath, placeName, onRedeem }: CheckedInProps) {
  const tonight = offersForNight(offers, state.checkin.nightDate);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-full border-2 border-lime bg-lime/15 text-lime">
          <Check aria-hidden className="h-10 w-10" strokeWidth={2.5} />
        </div>
        <h2 className="text-[28px] font-extrabold">¡Ya estás dentro!</h2>
        {state.withoutLocation && <p className="text-sm text-muted">Sin ubicación: puedes canjear igualmente.</p>}
      </div>
      {tonight.map((offer) => (
        <article key={offer.id} className="glass flex flex-col gap-4 rounded-[var(--radius-card)] p-4">
          <div className="flex items-center gap-3">
            <PlacePhoto path={coverPath} alt={placeName} className="h-14 w-14 flex-none rounded-2xl" />
            <div>
              <p className="text-xs font-bold tracking-wider text-violet-soft uppercase">Oferta desbloqueada</p>
              <h3 className="text-lg leading-tight font-bold">{offer.title}</h3>
            </div>
          </div>
          {offer.description && <p className="text-sm text-muted">{offer.description}</p>}
          {offer.includesAlcohol && <p className="text-xs text-muted">{ALCOHOL_WARNING}</p>}
          <p className="text-xs text-muted">
            Cuando estés en la barra, desliza para canjear y enseña la pantalla. Dura 15 minutos y solo se puede usar una vez.
          </p>
          <SlideToConfirm
            label="Desliza para canjear"
            accessibleLabel={`Desliza para canjear: ${offer.title}`}
            onConfirm={() => onRedeem(state.checkin, offer.id)}
          />
        </article>
      ))}
      {tonight.length === 0 && <p className="text-center text-muted">Este local no tiene ofertas activas esta noche.</p>}
    </div>
  );
}
