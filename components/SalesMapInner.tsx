"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Circle, CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import { getSupabase } from "@/lib/supabase";
import type { EngineStore, Radius, RetailPoint, SalesProfile } from "@/lib/types";
import { compactRupiah, quadrantColor } from "@/lib/format";
import { logUsage } from "@/lib/usage";
import StoreSheet from "./StoreSheet";

const filters = ["PRIORITY", "ALL", "STRONG", "ISOLATED", "WHITESPACE", "LOW"] as const;
type Filter = typeof filters[number];

function FitCoverage({ stores }: { stores: EngineStore[] }) {
  const map = useMap();
  useEffect(() => {
    if (!stores.length) return;
    const bounds: LatLngBoundsExpression = stores.map((s) => [s.lat, s.lon]);
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: 14 });
  }, [map, stores.length]);
  return null;
}

function LocateMe({ point }: { point: [number, number] | null }) {
  const map = useMap();
  useEffect(() => { if (point) map.flyTo(point, 15, { duration: 0.6 }); }, [map, point]);
  return point ? <CircleMarker center={point} radius={8} pathOptions={{ color: "#fff", weight: 3, fillColor: "#2563eb", fillOpacity: 1 }}><Tooltip>Lokasi saya</Tooltip></CircleMarker> : null;
}

function quadrantMatches(store: EngineStore, filter: Filter) {
  if (filter === "ALL") return true;
  if (filter === "PRIORITY") return [1,2,3].includes(store.quadrant_code);
  if (filter === "STRONG") return store.quadrant_code === 0;
  if (filter === "WHITESPACE") return store.quadrant_code === 1;
  if (filter === "ISOLATED") return store.quadrant_code === 2;
  if (filter === "LOW") return store.quadrant_code === 3;
  return true;
}

export default function SalesMapInner() {
  const router = useRouter();
  const [profile, setProfile] = useState<SalesProfile | null>(null);
  const [radius, setRadius] = useState<Radius>("P50");
  const [stores, setStores] = useState<EngineStore[]>([]);
  const [retail, setRetail] = useState<RetailPoint[]>([]);
  const [selected, setSelected] = useState<EngineStore | null>(null);
  const [filter, setFilter] = useState<Filter>("PRIORITY");
  const [search, setSearch] = useState("");
  const [layers, setLayers] = useState({ potential: true, grosir: true, retail: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [myLocation, setMyLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const sb = getSupabase();
        const { data: sessionData } = await sb.auth.getSession();
        if (!sessionData.session) { router.replace("/"); return; }
        const uid = sessionData.session.user.id;
        const { data: p, error: pe } = await sb.from("sales_users").select("*").eq("auth_uid", uid).single();
        if (pe || !p) throw pe || new Error("Profil salesman tidak ditemukan");
        if (!alive) return;
        setProfile(p as SalesProfile);
        await logUsage({ salesCode: p.sales_code, eventType: "LOGIN" });
      } catch (e) { if (alive) setError(e instanceof Error ? e.message : "Gagal memuat profil"); }
    })();
    return () => { alive = false; };
  }, [router]);

  useEffect(() => {
    if (!profile) return;
    let alive = true;
    setLoading(true);
    (async () => {
      const sb = getSupabase();
      const { data, error: qe } = await sb.from("engine_grosir_result").select("*").eq("radius", radius).order("potential_month", { ascending: false });
      if (!alive) return;
      if (qe) setError(qe.message); else setStores((data || []) as EngineStore[]);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [profile, radius]);

  useEffect(() => {
    if (!profile || !layers.retail || retail.length) return;
    (async () => {
      const sb = getSupabase();
      const { data, error: re } = await sb.from("sales_retail_points").select("sales_code,outlet_code,outlet_name,lat,lon,roa_3m");
      if (re) setError(re.message); else setRetail((data || []) as RetailPoint[]);
    })();
  }, [profile, layers.retail, retail.length]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return stores.filter((s) => quadrantMatches(s, filter) && (!q || `${s.outlet_name} ${s.outlet_code}`.toLowerCase().includes(q)));
  }, [stores, filter, search]);

  const potentialTotal = visible.reduce((sum, s) => sum + Number(s.potential_month || 0), 0);
  const center: [number, number] = stores.length ? [stores.reduce((a,s)=>a+s.lat,0)/stores.length, stores.reduce((a,s)=>a+s.lon,0)/stores.length] : [-6.2, 107.0];

  async function logout() {
    await getSupabase().auth.signOut(); router.replace("/");
  }
  function locate() {
    navigator.geolocation?.getCurrentPosition((p) => setMyLocation([p.coords.latitude, p.coords.longitude]));
  }
  function openStore(s: EngineStore) {
    setSelected(s);
    if (profile) logUsage({ salesCode: profile.sales_code, eventType: "STORE_VIEW", outletCode: s.outlet_code, radius, recommendedOrder: s.recommended_order, lat: s.lat, lon: s.lon });
  }

  if (!profile) return <div className="fullLoading">{error || "Memuat profile..."}</div>;

  return <main className="mapApp">
    <header className="mapTopbar">
      <div>
        <b>Neighborhood Pricing</b>
        <span>{profile.sales_name} · {profile.depo}</span>
      </div>
      <button onClick={logout}>Keluar</button>
    </header>

    <div className="mapToolbar">
      <div className="radiusGroup">{(["P25","P50","P75"] as Radius[]).map((r) => <button key={r} className={radius===r?"active":""} onClick={() => setRadius(r)}>{r}</button>)}</div>
      <button className="gpsButton" onClick={locate}>⌖ GPS</button>
    </div>

    <div className="mapSearch"><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Cari nama / kode Grosir..." /></div>
    <div className="filterScroller">{filters.map((f)=><button key={f} className={filter===f?"active":""} onClick={()=>setFilter(f)}>{f==='PRIORITY'?'Priority':f==='ALL'?'Semua':f[0]+f.slice(1).toLowerCase()}</button>)}</div>

    <div className="mapSummary"><span>{visible.length} Grosir</span><strong>+{compactRupiah(potentialTotal)}/mo</strong></div>

    <div className="mapCanvas">
      <MapContainer center={center} zoom={11} zoomControl={false} style={{height:"100%",width:"100%"}} preferCanvas>
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitCoverage stores={stores} />
        <LocateMe point={myLocation} />
        {layers.potential && visible.map((s) => {
          const r=Math.max(7,Math.min(28,5+Math.sqrt(Math.max(0,s.potential_month)/150000)));
          return <CircleMarker key={`p-${s.outlet_code}`} center={[s.lat,s.lon]} radius={r} pathOptions={{color:quadrantColor[s.quadrant_code],weight:1,fillColor:quadrantColor[s.quadrant_code],fillOpacity:.14}} interactive={false}/>;
        })}
        {layers.grosir && visible.map((s) => <CircleMarker key={s.outlet_code} center={[s.lat,s.lon]} radius={7} pathOptions={{color:"#fff",weight:2,fillColor:quadrantColor[s.quadrant_code],fillOpacity:1}} eventHandlers={{click:()=>openStore(s)}}><Tooltip>{s.outlet_name}<br/>{s.quadrant}</Tooltip></CircleMarker>)}
        {layers.retail && retail.map((r) => <CircleMarker key={r.outlet_code} center={[r.lat,r.lon]} radius={2.5} pathOptions={{stroke:false,fillColor:r.roa_3m?"#16a34a":"#dc2626",fillOpacity:.65}}><Tooltip>{r.outlet_name} · {r.roa_3m?"ROA":"Non-ROA"}</Tooltip></CircleMarker>)}
        {selected && <Circle center={[selected.lat,selected.lon]} radius={selected.radius_km*1000} pathOptions={{color:"#2563eb",weight:2,fillColor:"#2563eb",fillOpacity:.06}} />}
      </MapContainer>
      {loading && <div className="mapLoading">Memuat coverage...</div>}
    </div>

    <div className="layerBar">
      <button className={layers.potential?"active":""} onClick={()=>setLayers(x=>({...x,potential:!x.potential}))}>Potential</button>
      <button className={layers.grosir?"active":""} onClick={()=>setLayers(x=>({...x,grosir:!x.grosir}))}>Grosir</button>
      <button className={layers.retail?"active":""} onClick={()=>setLayers(x=>({...x,retail:!x.retail}))}>Retail</button>
      {profile.role==='manager' && <button onClick={()=>router.push('/manager')}>Monitor</button>}
    </div>
    {error && <div className="toastError">{error}</div>}
    {selected && <StoreSheet store={selected} profile={profile} radius={radius} onClose={()=>setSelected(null)} />}
  </main>;
}
