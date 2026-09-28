"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { compactRupiah } from "@/lib/format";
import type { SalesProfile } from "@/lib/types";

type EventRow = { created_at:string; sales_code:string; outlet_code:string|null; event_type:string; actual_order:number|null; recommended_order:number|null };

export default function ManagerDashboard(){
  const router=useRouter();
  const [profile,setProfile]=useState<SalesProfile|null>(null);
  const [events,setEvents]=useState<EventRow[]>([]);
  const [error,setError]=useState("");
  useEffect(()=>{(async()=>{
    const sb=getSupabase(); const {data:s}=await sb.auth.getSession(); if(!s.session){router.replace('/');return}
    const {data:p,error:pe}=await sb.from('sales_users').select('*').eq('auth_uid',s.session.user.id).single();
    if(pe||!p){setError(pe?.message||'Profile tidak ada');return} setProfile(p as SalesProfile);
    if(p.role!=='manager')return;
    const since=new Date(Date.now()-30*86400000).toISOString();
    const {data:e,error:ee}=await sb.from('usage_events').select('created_at,sales_code,outlet_code,event_type,actual_order,recommended_order').gte('created_at',since).order('created_at',{ascending:false}).limit(10000);
    if(ee)setError(ee.message); else setEvents((e||[]) as EventRow[]);
  })()},[router]);
  const summary=useMemo(()=>{
    const c=(t:string)=>events.filter(e=>e.event_type===t).length;
    return {active:new Set(events.map(e=>e.sales_code)).size,login:c('LOGIN'),views:c('STORE_VIEW'),pitch:c('PITCH_SHOWN'),visits:c('VISIT_COMPLETE'),orders:c('ORDER_COMMIT'),value:events.filter(e=>e.event_type==='ORDER_COMMIT').reduce((s,e)=>s+Number(e.actual_order||0),0)};
  },[events]);
  const bySales=useMemo(()=>{
    const m=new Map<string,{sales:string;views:number;pitch:number;visits:number;orders:number;value:number}>();
    for(const e of events){const r=m.get(e.sales_code)||{sales:e.sales_code,views:0,pitch:0,visits:0,orders:0,value:0};if(e.event_type==='STORE_VIEW')r.views++;if(e.event_type==='PITCH_SHOWN')r.pitch++;if(e.event_type==='VISIT_COMPLETE')r.visits++;if(e.event_type==='ORDER_COMMIT'){r.orders++;r.value+=Number(e.actual_order||0)}m.set(e.sales_code,r)}
    return [...m.values()].sort((a,b)=>b.value-a.value);
  },[events]);
  if(!profile)return <div className="fullLoading">{error||'Loading...'}</div>;
  if(profile.role!=='manager')return <div className="accessDenied"><h1>Akses manager diperlukan</h1><button onClick={()=>router.replace('/map')}>Kembali ke Map</button></div>;
  return <main className="managerPage">
    <div className="managerHead"><div><span>MANAGER MONITORING</span><h1>Engine Adoption</h1><p>30 hari terakhir · {profile.depo||'All depo'}</p></div><button onClick={()=>router.push('/map')}>Map</button></div>
    <div className="managerKpis">
      <div><small>Active Sales</small><b>{summary.active}</b></div><div><small>Store Viewed</small><b>{summary.views}</b></div><div><small>Pitch Shown</small><b>{summary.pitch}</b></div><div><small>Visit Complete</small><b>{summary.visits}</b></div><div><small>Order</small><b>{summary.orders}</b></div><div><small>Order Value</small><b>{compactRupiah(summary.value)}</b></div>
    </div>
    <section className="managerTable"><h2>By Salesman</h2><div className="tableScroll"><table><thead><tr><th>Sales</th><th>Viewed</th><th>Pitch</th><th>Visit</th><th>Order</th><th>Value</th></tr></thead><tbody>{bySales.map(r=><tr key={r.sales}><td>{r.sales}</td><td>{r.views}</td><td>{r.pitch}</td><td>{r.visits}</td><td>{r.orders}</td><td>{compactRupiah(r.value)}</td></tr>)}</tbody></table></div></section>
  </main>
}
