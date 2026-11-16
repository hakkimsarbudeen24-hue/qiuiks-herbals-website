"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  price?: number | string;
  size?: string;
  image_url?: string;
  category_id?: string;
};

type Category = { id: string; name: string; slug?: string };

const WHATSAPP = "919080310452";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState("all");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [language, setLanguage] = useState<"en" | "ta">("en");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const t = (en: string, ta: string) => language === "en" ? en : ta;

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured) {
        setNotice("Add your Supabase URL and Publishable Key to .env.local to load products.");
        setLoading(false);
        return;
      }
      const [p, c] = await Promise.all([
        supabase.from("products").select("id,name,slug,description,price,size,image_url,category_id").eq("is_active", true).order("created_at", { ascending: false }),
        supabase.from("categories").select("id,name,slug").order("name")
      ]);
      if (p.error) setNotice("Products could not be loaded. Please check your Supabase table policies.");
      else setProducts((p.data || []) as Product[]);
      if (!c.error) setCategories((c.data || []) as Category[]);
      setLoading(false);
    }
    load();
  }, []);

  const visibleProducts = useMemo(() => products.filter((p) => {
    const matchesCategory = selected === "all" || p.category_id === selected;
    const text = `${p.name} ${p.description || ""}`.toLowerCase();
    return matchesCategory && text.includes(query.toLowerCase());
  }), [products, selected, query]);

  const cartItems = products.filter((p) => cart[p.id]);
  const total = cartItems.reduce((sum, p) => sum + Number(p.price || 0) * cart[p.id], 0);

  function add(id: string) {
    setCart((old) => ({ ...old, [id]: (old[id] || 0) + 1 }));
  }
  function changeQty(id: string, amount: number) {
    setCart((old) => {
      const next = { ...old, [id]: (old[id] || 0) + amount };
      if (next[id] <= 0) delete next[id];
      return next;
    });
  }
  function orderOnWhatsApp() {
    if (!cartItems.length) return;
    const lines = cartItems.map((p) => `${p.name}${p.size ? ` (${p.size})` : ""} x ${cart[p.id]} - ₹${Number(p.price || 0) * cart[p.id]}`);
    const message = `Vanakkam QIUIKS HERBALS! I would like to order:\n${lines.join("\n")}\nTotal: ₹${total}\nPlease confirm availability and delivery details.`;
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`, "_blank");
  }

  return (
    <main>
      <header className="topbar">
        <Link href="/" className="brand"><span className="brand-mark">Q</span><span>QIUIKS <small>HERBALS</small></span></Link>
        <nav><a href="#products">{t("Products", "தயாரிப்புகள்")}</a><a href="#story">{t("Our story", "எங்களைப் பற்றி")}</a><Link href="/admin">{t("Admin", "நிர்வாகம்")}</Link></nav>
        <button className="lang" onClick={() => setLanguage(language === "en" ? "ta" : "en")}>{language === "en" ? "தமிழ்" : "English"}</button>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">{t("ROOTED IN TRADITION · MADE WITH CARE", "பாரம்பரியத்தில் வேரூன்றி · அக்கறையுடன் தயாரிப்பு")}</p>
          <h1>{t("Nature’s care, the QIUIKS way.", "இயற்கையின் பராமரிப்பு — QIUIKS வழியில்.")}</h1>
          <p>{t("Discover thoughtfully prepared herbal care for your everyday routine.", "உங்கள் அன்றாட பராமரிப்பிற்கான மூலிகை தயாரிப்புகளை கண்டறியுங்கள்.")}</p>
          <a className="primary-btn" href="#products">{t("Explore products", "தயாரிப்புகளைப் பாருங்கள்")} <span>↗</span></a>
        </div>
        <div className="hero-art">
          <div className="sun"></div><div className="leaf leaf-one"></div><div className="leaf leaf-two"></div>
          <div className="hero-seal"><span>Q</span><small>PURE HERBAL CARE</small></div>
        </div>
      </section>

      <section className="promise">
        <div><span>✦</span>{t("Herbal-inspired care", "மூலிகை சார்ந்த பராமரிப்பு")}</div>
        <div><span>✦</span>{t("Made with care", "அக்கறையுடன் தயாரிப்பு")}</div>
        <div><span>✦</span>{t("Order directly on WhatsApp", "WhatsApp மூலம் ஆர்டர்")}</div>
      </section>

      <section className="products-section" id="products">
        <div className="section-heading">
          <div><p className="eyebrow">{t("THE QIUIKS COLLECTION", "QIUIKS தயாரிப்புகள்")}</p><h2>{t("Find your daily ritual", "உங்கள் தினசரி பராமரிப்பைத் தேர்வு செய்யுங்கள்")}</h2></div>
          <input className="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("Search products...", "தயாரிப்புகளைத் தேடுங்கள்...")} />
        </div>
        <div className="filters">
          <button className={selected === "all" ? "filter active" : "filter"} onClick={() => setSelected("all")}>{t("All products", "அனைத்தும்")}</button>
          {categories.map((c) => <button key={c.id} className={selected === c.id ? "filter active" : "filter"} onClick={() => setSelected(c.id)}>{c.name}</button>)}
        </div>
        {notice && <p className="notice">{notice}</p>}
        {loading ? <p className="empty">{t("Loading products...", "தயாரிப்புகள் ஏற்றப்படுகின்றன...")}</p> :
          visibleProducts.length === 0 ? <p className="empty">{t("No products to show yet. Please check back soon.", "தற்போது தயாரிப்புகள் இல்லை. விரைவில் மீண்டும் பாருங்கள்.")}</p> :
          <div className="product-grid">
            {visibleProducts.map((p) => <article className="product-card" key={p.id}>
              <div className="product-image">
                {p.image_url ? <img src={p.image_url} alt={p.name} /> : <div className="image-placeholder"><span>Q</span><small>QIUIKS HERBALS</small></div>}
              </div>
              <div className="product-info">
                <p className="product-category">{categories.find((c) => c.id === p.category_id)?.name || "QIUIKS HERBALS"}</p>
                <h3>{p.name}</h3>
                {p.description && <p className="description">{p.description}</p>}
                <div className="product-bottom"><div><strong>₹{Number(p.price || 0).toLocaleString("en-IN")}</strong>{p.size && <small>{p.size}</small>}</div><button className="add-btn" onClick={() => add(p.id)}>{t("Add +", "சேர் +")}</button></div>
              </div>
            </article>)}
          </div>
        }
      </section>

      <section className="story" id="story">
        <p className="eyebrow">{t("A LITTLE ABOUT US", "எங்களைப் பற்றி")}</p>
        <h2>{t("Tradition, thoughtfully brought into today.", "பாரம்பரியத்தை இன்றைய வாழ்வில் அன்புடன் கொண்டு வருகிறோம்.")}</h2>
        <p>{t("QIUIKS HERBALS brings together a love for traditional herbal ingredients and everyday personal care. Thank you for supporting our small business.", "பாரம்பரிய மூலிகைப் பொருட்களின் மீதான அன்பையும் அன்றாட தனிப்பட்ட பராமரிப்பையும் QIUIKS HERBALS ஒன்றிணைக்கிறது. எங்கள் சிறு வணிகத்திற்கு ஆதரவளிப்பதற்கு நன்றி.")}</p>
      </section>

      <footer><div className="brand footer-brand"><span className="brand-mark">Q</span><span>QIUIKS <small>HERBALS</small></span></div><p>Sivagangai, Tamil Nadu, India</p><a href="https://www.instagram.com/qiuiksherbals/" target="_blank">Instagram @qiuiksherbals</a><small>© {new Date().getFullYear()} QIUIKS HERBALS</small></footer>

      {cartItems.length > 0 && <aside className="cart-panel">
        <div className="cart-head"><strong>{t("Your order", "உங்கள் ஆர்டர்")} ({cartItems.reduce((s,p) => s + cart[p.id], 0)})</strong><button onClick={() => setCart({})}>×</button></div>
        {cartItems.map((p) => <div className="cart-line" key={p.id}><span>{p.name}</span><div><button onClick={() => changeQty(p.id, -1)}>−</button><b>{cart[p.id]}</b><button onClick={() => changeQty(p.id, 1)}>+</button></div></div>)}
        <div className="cart-total"><span>{t("Subtotal", "மொத்தம்")}</span><strong>₹{total.toLocaleString("en-IN")}</strong></div>
        <button className="checkout" onClick={orderOnWhatsApp}>{t("Order on WhatsApp", "WhatsApp-ல் ஆர்டர் செய்யுங்கள்")} ↗</button>
      </aside>}
    </main>
  );
}
