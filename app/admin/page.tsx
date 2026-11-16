"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type Category = { id: string; name: string };
type Product = { id: string; name: string; price: number; description?: string; size?: string; image_url?: string; category_id?: string; slug?: string; is_active?: boolean };

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<any>(null);
  const [allowed, setAllowed] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState("Sign in with the admin account you created in Supabase.");
  const [form, setForm] = useState({ name: "", price: "", description: "", size: "", category_id: "" });
  const [image, setImage] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const [c, p] = await Promise.all([
      supabase.from("categories").select("id,name").order("name"),
      supabase.from("products").select("*").order("created_at", { ascending: false })
    ]);
    if (!c.error) setCategories(c.data || []);
    if (!p.error) setProducts(p.data || []);
  }

  useEffect(() => {
    if (!isSupabaseConfigured) { setMessage("First add Supabase settings in .env.local."); return; }
    supabase.auth.getSession().then(({ data }) => { if (data.session?.user) checkAdmin(data.session.user); });
  }, []);

  async function checkAdmin(currentUser: any) {
    setUser(currentUser);
    const { data, error } = await supabase.from("admin_users").select("*").eq("user_id", currentUser.id).maybeSingle();
    if (error || !data) {
      setAllowed(false);
      setMessage("This account is not listed as an admin in admin_users, or the admin policy blocked access.");
      return;
    }
    setAllowed(true);
    setMessage("Admin access confirmed.");
    await refresh();
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage(error.message);
    else if (data.user) await checkAdmin(data.user);
    setBusy(false);
  }

  async function signOut() {
    await supabase.auth.signOut(); setUser(null); setAllowed(false); setProducts([]);
  }

  async function addProduct(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    let image_url = "";
    if (image) {
      const safeName = `${Date.now()}-${image.name.replace(/[^a-zA-Z0-9.-]/g, "-")}`;
      const { error: uploadError } = await supabase.storage.from("qiuiks-products").upload(safeName, image, { upsert: false });
      if (uploadError) { setMessage(`Image upload failed: ${uploadError.message}`); setBusy(false); return; }
      const { data } = supabase.storage.from("qiuiks-products").getPublicUrl(safeName);
      image_url = data.publicUrl;
    }
    const slug = form.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const { error } = await supabase.from("products").insert({
      name: form.name, slug, price: Number(form.price), description: form.description,
      size: form.size, category_id: form.category_id || null, image_url: image_url || null,
      is_active: true, stock_quantity: 0
    });
    if (error) setMessage(`Could not save product: ${error.message}`);
    else { setMessage("Product added successfully."); setForm({ name: "", price: "", description: "", size: "", category_id: "" }); setImage(null); await refresh(); }
    setBusy(false);
  }

  async function toggleProduct(p: Product) {
    const { error } = await supabase.from("products").update({ is_active: !p.is_active }).eq("id", p.id);
    setMessage(error ? error.message : "Product visibility updated.");
    await refresh();
  }

  async function deleteProduct(p: Product) {
    if (!confirm(`Delete ${p.name}?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    setMessage(error ? error.message : "Product deleted.");
    await refresh();
  }

  return <main className="admin-page">
    <header className="topbar"><Link href="/" className="brand"><span className="brand-mark">Q</span><span>QIUIKS <small>HERBALS</small></span></Link><Link href="/">← Back to store</Link></header>
    <section className="admin-wrap">
      <p className="eyebrow">QIUIKS HERBALS · CONTROL PANEL</p>
      <h1>Admin Panel</h1>
      <p className="admin-intro">Manage products, prices and product photos.</p>
      {!user && <form className="admin-card login-card" onSubmit={signIn}>
        <h2>Admin sign in</h2>
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        <button className="checkout" disabled={busy || !isSupabaseConfigured}>{busy ? "Please wait..." : "Sign in"}</button>
      </form>}
      {user && <div className="admin-actions"><span>Signed in: {user.email}</span><button className="filter" onClick={signOut}>Sign out</button></div>}
      <p className="notice">{message}</p>
      {user && allowed && <>
        <form className="admin-card" onSubmit={addProduct}>
          <h2>Add a product</h2>
          <div className="form-grid">
            <label>Product name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
            <label>Price (₹)<input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></label>
            <label>Pack size<input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} placeholder="e.g. 100 ml" /></label>
            <label>Category<select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}><option value="">Choose category</option>{categories.map((c) => <option value={c.id} key={c.id}>{c.name}</option>)}</select></label>
            <label className="wide">Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></label>
            <label className="wide">Product photo<input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} /></label>
          </div>
          <button className="checkout" disabled={busy}>{busy ? "Saving..." : "Save product"}</button>
        </form>
        <section className="admin-card"><h2>Products ({products.length})</h2>
          {products.map((p) => <div className="admin-product" key={p.id}><div><strong>{p.name}</strong><small>₹{Number(p.price || 0).toLocaleString("en-IN")} · {p.is_active ? "Visible" : "Hidden"}</small></div><div className="admin-product-actions"><button className="filter" onClick={() => toggleProduct(p)}>{p.is_active ? "Hide" : "Show"}</button><button className="filter danger" onClick={() => deleteProduct(p)}>Delete</button></div></div>)}
        </section>
      </>}
    </section>
  </main>;
}
