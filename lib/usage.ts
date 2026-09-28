"use client";
import { getSupabase } from "@/lib/supabase";
import type { Radius } from "@/lib/types";

export async function logUsage(input: {
  salesCode: string;
  eventType: string;
  outletCode?: string;
  radius?: Radius;
  recommendedOrder?: number;
  actualOrder?: number;
  lat?: number;
  lon?: number;
  extra?: Record<string, unknown>;
}) {
  const sb = getSupabase();
  const { error } = await sb.from("usage_events").insert({
    sales_code: input.salesCode,
    outlet_code: input.outletCode || null,
    event_type: input.eventType,
    radius: input.radius || null,
    recommended_order: input.recommendedOrder || 0,
    actual_order: input.actualOrder || 0,
    lat: input.lat ?? null,
    lon: input.lon ?? null,
    extra: input.extra || null,
  });
  if (error) console.warn("usage log failed", error.message);
}
