async function loadSupabaseSdk() {
  if (window.supabase?.createClient) return true;

  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    script.onload = resolve;
    script.onerror = () => reject(new Error("Supabase SDK kon niet worden geladen."));
    document.head.appendChild(script);
  });

  if (!window.supabase?.createClient) {
    throw new Error("Supabase SDK is niet beschikbaar.");
  }
  return true;
}

function getSupabaseUrl() {
  const value = window.SUPABASE_URL?.trim();
  if (!value || value.includes("VUL_HIER")) {
    throw new Error("Supabase-URL ontbreekt in supabase-config.js.");
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "https:") throw new Error("De Supabase-URL moet HTTPS gebruiken.");
    url.pathname = url.pathname.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
    url.search = "";
    url.hash = "";
    return url.origin + url.pathname;
  } catch (error) {
    console.error("Ongeldige Supabase-URL:", error);
    throw new Error("Controleer de URL in supabase-config.js.");
  }
}

function isSupabaseConfigured() {
  return !!(window.SUPABASE_URL?.trim() &&
    window.SUPABASE_ANON_KEY &&
    !window.SUPABASE_ANON_KEY.includes("VUL_HIER"));
}

async function getSupabaseClient() {
  const url = getSupabaseUrl();
  const key = window.SUPABASE_ANON_KEY?.trim();
  if (!key || key.includes("VUL_HIER")) {
    throw new Error("Supabase public/anon key ontbreekt in supabase-config.js.");
  }

  await loadSupabaseSdk();
  if (!window.__goudenSupabase) {
    window.__goudenSupabase = window.supabase.createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
  }
  return window.__goudenSupabase;
}

// Website-inhoud wordt uitsluitend uit Supabase gelezen.
// data.json wordt alleen gebruikt als eerste startinhoud wanneer de cloudrij nog leeg is.
async function loadData() {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from("site_content")
    .select("content")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error("Online inhoud niet geladen:", error);
    throw new Error("De online inhoud kon niet uit Supabase worden gelezen: " + error.message);
  }

  if (data?.content && Object.keys(data.content).length > 0) {
    return data.content;
  }

  const response = await fetch("data.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Er staat nog geen website-inhoud in Supabase en data.json kon niet worden geladen.");
  }
  return response.json();
}

// Opslaan lukt alleen wanneer Supabase bereikbaar is en een beheerder is ingelogd.
// Er wordt nooit een lokale browserkopie gemaakt.
async function saveData(content) {
  const client = await getSupabaseClient();
  const { data: sessionData, error: sessionError } = await client.auth.getSession();

  if (sessionError) throw sessionError;
  if (!sessionData?.session) {
    throw new Error("Je bent niet ingelogd. Log in met je Supabase-beheerdersaccount en probeer opnieuw.");
  }

  const { error } = await client
    .from("site_content")
    .upsert({ id: 1, content }, { onConflict: "id" });

  if (error) {
    console.error("Supabase opslaan mislukt:", error);
    throw new Error("Supabase heeft de wijziging niet opgeslagen: " + error.message);
  }

  // Lees terug om te controleren dat de cloud de wijziging echt bevat.
  const { data: verify, error: verifyError } = await client
    .from("site_content")
    .select("content")
    .eq("id", 1)
    .single();

  if (verifyError) throw new Error("Opslaan is verstuurd, maar de controle daarna mislukte: " + verifyError.message);
  const stable = value => {
    if (Array.isArray(value)) return value.map(stable);
    if (value && typeof value === "object") {
      return Object.keys(value).sort().reduce((result, key) => {
        result[key] = stable(value[key]);
        return result;
      }, {});
    }
    return value;
  };
  if (JSON.stringify(stable(verify.content)) !== JSON.stringify(stable(content))) {
    throw new Error("De controle na opslaan kwam niet overeen. De wijziging is niet bevestigd.");
  }

  return { cloud: true };
}

async function resetData() {
  if (!confirm("De website-inhoud in Supabase vervangen door de standaardgegevens? Dit overschrijft je huidige online inhoud.")) return;
  try {
    const response = await fetch("data.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Standaardgegevens konden niet worden geladen.");
    const defaults = await response.json();
    await saveData(defaults);
    alert("De standaardgegevens zijn online opgeslagen in Supabase.");
    location.reload();
  } catch (error) {
    alert("Herstellen mislukt: " + (error.message || error));
  }
}

function applySite(d) {
  document.querySelectorAll("[data-site-name]").forEach(e => e.textContent = d.site?.name || "");
  document.querySelectorAll("[data-tagline]").forEach(e => e.textContent = d.site?.tagline || "");
  if (d.site?.primary) document.documentElement.style.setProperty("--primary", d.site.primary);
  if (d.site?.dark) document.documentElement.style.setProperty("--dark", d.site.dark);
  if (d.site?.cream) document.documentElement.style.setProperty("--cream", d.site.cream);
  if (d.site?.text) document.documentElement.style.setProperty("--text", d.site.text);
  document.querySelectorAll("[data-footer]").forEach(e => e.textContent = d.site?.footer || "");
}
