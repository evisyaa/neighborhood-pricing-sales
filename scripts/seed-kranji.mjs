import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const pin = process.env.SEED_DEMO_PIN;
if (!url || !serviceKey || !pin) {
  throw new Error("Isi NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, dan SEED_DEMO_PIN di .env.local");
}
const sb = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const readJson = async (name) => JSON.parse(await fs.readFile(path.join(process.cwd(), "supabase", "seed", name), "utf8"));
const sales = await readJson("kranji_sales.json");
const engine = await readJson("kranji_engine.json");
const retail = await readJson("kranji_retail.json");

console.log(`Seed KRANJI: ${sales.length} sales, ${engine.length} engine rows, ${retail.length} retail`);

// Find/create auth users, then bind auth_uid to sales_users.
const { data: listed, error: le } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (le) throw le;
const byEmail = new Map((listed.users || []).map((u) => [u.email, u]));
for (const s of sales) {
  const email = `${s.sales_code}@sales.np.local`;
  let user = byEmail.get(email);
  if (!user) {
    const { data, error } = await sb.auth.admin.createUser({ email, password: pin, email_confirm: true, user_metadata: { sales_code: s.sales_code, sales_name: s.sales_name } });
    if (error) throw error;
    user = data.user;
    console.log("created", email);
  }
  const { error: pe } = await sb.from("sales_users").upsert({ ...s, auth_uid: user.id }, { onConflict: "sales_code" });
  if (pe) throw pe;
}

async function chunkUpsert(table, rows, conflict, size=500) {
  for (let i=0;i<rows.length;i+=size) {
    const part=rows.slice(i,i+size);
    const { error }=await sb.from(table).upsert(part,{onConflict:conflict});
    if(error)throw error;
    console.log(`${table}: ${Math.min(i+size,rows.length)}/${rows.length}`);
  }
}
await chunkUpsert("engine_grosir_result", engine, "outlet_code,radius");
await chunkUpsert("sales_retail_points", retail, "outlet_code");
console.log("KRANJI seed selesai. Login pilot memakai Sales Code + PIN dari SEED_DEMO_PIN.");
