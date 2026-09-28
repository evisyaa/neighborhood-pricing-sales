"use client";
import { useState } from "react";
import type { EngineStore, Radius, SalesProfile } from "@/lib/types";
import { compactRupiah, rupiah } from "@/lib/format";
import { logUsage } from "@/lib/usage";

export default function StoreSheet({ store, profile, radius, onClose }: {
  store: EngineStore;
  profile: SalesProfile;
  radius: Radius;
  onClose: () => void;
}) {
  const [showOrder, setShowOrder] = useState(false);
  const [actualOrder, setActualOrder] = useState("");
  const [saved, setSaved] = useState(false);

  async function event(type: string) {
    await logUsage({ salesCode: profile.sales_code, eventType: type, outletCode: store.outlet_code, radius, recommendedOrder: store.recommended_order, lat: store.lat, lon: store.lon });
  }

  async function saveOrder() {
    const value = Number(actualOrder.replace(/[^0-9]/g, "")) || 0;
    await logUsage({ salesCode: profile.sales_code, eventType: "ORDER_COMMIT", outletCode: store.outlet_code, radius, recommendedOrder: store.recommended_order, actualOrder: value, lat: store.lat, lon: store.lon });
    setSaved(true);
  }

  return (
    <>
      <div className="sheetBackdrop" onClick={onClose} />
      <section className="storeSheet">
        <div className="sheetHandle" />
        <button className="sheetClose" onClick={onClose}>×</button>
        <h2>{store.outlet_name}</h2>
        <p className="sheetCode">{store.outlet_code} · {store.strata ? `Strata ${store.strata}` : ""}</p>
        <div className="badgeRow">
          <span className={store.roa_3m ? "badge green" : "badge red"}>{store.roa_3m ? "ROA" : "NON-ROA"}</span>
          <span className="badge neutral">{store.quadrant}</span>
        </div>

        <div className="detailGrid">
          <div><small>Retail AOI</small><b>{store.retail_base.toLocaleString("id-ID")} toko</b></div>
          <div><small>Retail ROA</small><b>{store.retail_roa_pct == null ? "N/A" : `${store.retail_roa_pct.toFixed(1)}%`}</b></div>
          <div><small>Benchmark</small><b>{store.benchmark.toFixed(1)}%</b></div>
          <div><small>Potential/mo</small><b>+{compactRupiah(store.potential_month)}</b></div>
          <div><small>Current/mo</small><b>{compactRupiah(store.current_month)}</b></div>
          <div><small>Target/mo</small><b>{compactRupiah(store.target_month)}</b></div>
        </div>

        <div className="recommendCard">
          <span>REKOMENDASI PENGAMBILAN</span>
          <strong>{compactRupiah(store.recommended_order)} / order</strong>
          <p>{store.action || "Action recommendation"} · Strata {store.strata}</p>
        </div>

        <div className="pitchCard">
          <b>Tampilan untuk toko</b>
          <p>Potensi neighborhood: <strong>+{compactRupiah(store.potential_month)}/bulan</strong></p>
          <p>Retail aktif sekitar: <strong>{store.retail_base} toko</strong> dalam {store.radius_km.toFixed(2)} km</p>
          <p>Saran pengambilan: <strong>{compactRupiah(store.recommended_order)}/order</strong></p>
          <small>Indikasi berbasis engine neighborhood; bukan jaminan penjualan.</small>
        </div>

        <div className="actionGrid">
          <button onClick={() => event("PITCH_SHOWN")}>Tampilkan ke Toko</button>
          <button onClick={() => event("VISIT_COMPLETE")}>Visit Selesai</button>
          <button className="actionPrimary" onClick={() => { setShowOrder(true); event("ORDER_FORM_OPEN"); }}>Catat Order</button>
        </div>

        {showOrder && <div className="orderBox">
          <label>Actual order (Rp)</label>
          <input inputMode="numeric" value={actualOrder} onChange={(e) => setActualOrder(e.target.value)} placeholder="Contoh: 450000" />
          <button onClick={saveOrder}>{saved ? `Tersimpan ${rupiah(Number(actualOrder.replace(/[^0-9]/g,"")) || 0)}` : "Simpan Order"}</button>
        </div>}
      </section>
    </>
  );
}
