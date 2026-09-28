"use client";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

export default function LoginForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    sb.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/map");
    });
  }, [router]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      const sb = getSupabase();
      const email = `${code.trim()}@sales.np.local`;
      const { error: authError } = await sb.auth.signInWithPassword({ email, password: pin });
      if (authError) throw authError;
      router.replace("/map");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally { setBusy(false); }
  }

  return (
    <main className="loginPage">
      <section className="loginCard">
        <div className="brandMark">NP</div>
        <p className="eyebrow">FIELD SALES</p>
        <h1>Neighborhood Pricing</h1>
        <p className="loginLead">Masuk dengan kode salesman untuk melihat coverage dan rekomendasi toko milikmu.</p>
        <form onSubmit={submit}>
          <label>Kode Salesman</label>
          <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" placeholder="Contoh: 156067" autoComplete="username" />
          <label>PIN</label>
          <input value={pin} onChange={(e) => setPin(e.target.value)} type="password" placeholder="••••" autoComplete="current-password" />
          {error && <div className="errorBox">{error}</div>}
          <button className="primaryButton" disabled={busy || !code || !pin}>{busy ? "Masuk..." : "Masuk"}</button>
        </form>
        <p className="finePrint">Akses dibatasi oleh Supabase Row Level Security sesuai coverage salesman.</p>
      </section>
    </main>
  );
}
