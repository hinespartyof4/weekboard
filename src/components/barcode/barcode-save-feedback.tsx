"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { usePathname } from "next/navigation";

import { readBarcodeFeedback } from "@/lib/barcode/feedback";

export function BarcodeSaveFeedback() {
  const pathname = usePathname();
  const [message] = useState<string | null>(() => {
    const feedback = readBarcodeFeedback();

    if (!feedback || feedback.path !== pathname) {
      return null;
    }

    return feedback.message;
  });

  if (!message) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-950">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" />
        <p>{message}</p>
      </div>
    </div>
  );
}
