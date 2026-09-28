"use client";
import dynamic from "next/dynamic";
const SalesMapInner = dynamic(() => import("./SalesMapInner"), { ssr: false, loading: () => <div className="fullLoading">Memuat map...</div> });
export default function SalesMap() { return <SalesMapInner />; }
