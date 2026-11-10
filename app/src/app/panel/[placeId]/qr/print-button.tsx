"use client";

import { PrimaryButton } from "@/components/ui";

export function PrintButton() {
  return <PrimaryButton className="print:hidden" onClick={() => window.print()}>Imprimir</PrimaryButton>;
}
