import { useState, useEffect, useCallback, useRef } from "react";
import * as Papa from "papaparse";
import { createClient } from '@supabase/supabase-js';

// --- Supabase 連線設定 ---
const supabaseUrl = 'https://gsrhvjxodnjsqaosgegl.supabase.co';
const supabaseKey = 'sb_publishable_n23wUeYIP_WCd1PUbrCmeg_1zbJwqSp';
const supabase = createClient(supabaseUrl, supabaseKey);
const SKEY = "main";

// 讀取
const loadDB = async () => { 
  try { 
    const { data, error } = await supabase.from('app_data').select('data').eq('id', SKEY).single();
    if (error) throw error;
    return data ? data.data : null;
  } catch { return null; } 
};

// 存檔
const saveDB = async (d) => { 
  try { 
    const { error } = await supabase.from('app_data').upsert({ id: SKEY, data: d, updated_at: new Date().toISOString() });
    if (error) throw error;
    return true; 
  } catch { return false; } 
};

const INIT = {
  appName: "水族排班系統", adminLabel: "管理員", logo: "",
  serviceTypes: [
    { id: "mt", label: "定期保養", color: "#0e7490", bg: "#ecfeff" },
    { id: "cl", label: "清洗服務", color: "#0369a1", bg: "#e0f2fe" },
    { id: "eg", label: "工程施作", color: "#6d28d9", bg: "#ede9fe" },
    { id: "ur", label: "臨時急件", color: "#dc2626", bg: "#fef2f2" },
  ],
  technicians: [
    { id: "t1", name: "技師 A", pin: "1111", canView: ["t1"], canEdit: false, active: true, isAdmin: false },
  ],
  customers: [
    { id: "c1", name: "海洋主題餐廳", code: "A001", address: "香港銅鑼灣告士打道100號", contact: "陳經理", contactPhone: "66022133", fax: "", email: "", siteContact: "王姐", sitePhone: "91234567", note: "3座大型海水缸", tanks: 3, active: true },
  ],
  recurring: [], tasks: [], reports: {}, adminPin: "0000",
};

const COLORS = ["#0e7490","#0369a1","#0284c7","#2563eb","#4f46e5","#6d28d9","#7c3aed","#9333ea","#a21caf","#db2777","#e11d48","#dc2626","#ea580c","#d97706","#ca8a04","#65a30d","#16a34a","#059669","#0d9488","#475569","#92400e","#78350f","#1e1b4b","#831843"];
const BG = { "#0e7490":"#ecfeff","#0369a1":"#e0f2fe","#0284c7":"#e0f2fe","#2563eb":"#eff6ff","#4f46e5":"#eef2ff","#6d28d9":"#ede9fe","#7c3aed":"#f5f3ff","#9333ea":"#faf5ff","#a21caf":"#fdf4ff","#db2777":"#fdf2f8","#e11d48":"#fff1f2","#dc2626":"#fef2f2","#ea580c":"#fff7ed","#d97706":"#fffbeb","#ca8a04":"#fefce8","#65a30d":"#f7fee7","#16a34a":"#f0fdf4","#059669":"#ecfdf5","#0d9488":"#f0fdfa","#475569":"#f8fafc","#92400e":"#fffbeb","#78350f":"#fef3c7","#1e1b4b":"#eef2ff","#831843":"#fdf2f8" };

const FREQS = [{ id: "weekly", l: "每週" }, { id: "biweekly", l: "每兩週" }, { id: "monthly", l: "每月" }];
const DAYOPT = [{ id: 1, l: "週一" }, { id: 2, l: "週二" }, { id: 3, l: "週三" }, { id: 4, l: "週四" }, { id: 5, l: "週五" }, { id: 6, l: "週六" }, { id: 0, l: "週日" }];
const DN = ["一", "二", "三", "四", "五", "六", "日"];

const td = () => new Date().toISOString().split("T")[0];
const uid = () => Math.random().toString(36).slice(2, 10);
const fmt = (s) => { const d = new Date(s); return (d.getMonth() + 1) + "/" + d.getDate(); };
const mv = (a, f, t) => { const n = [...a]; const [i] = n.splice(f, 1); n.splice(t, 0, i); return n; };
const weekOf = (b) => { const d = new Date(b); const m = new Date(d); m.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return Array.from({ length: 7 }, (_, i) => { const dd = new Date(m); dd.setDate(m.getDate() + i); return dd.toISOString().split("T")[0]; }); };
const recMatch = (r, ds) => { const d = new Date(ds); if (d.getDay() !== r.dayOfWeek) return false; const s = new Date(r.startDate); if (d < s) return false; if (r.endDate && d > new Date(r.endDate)) return false; if (r.frequency === "weekly") return true; if (r.frequency === "biweekly") return Math.floor((d - s) / 604800000) % 2 === 0; if (r.frequency === "monthly") return Math.ceil(s.getDate() / 7) === Math.ceil(d.getDate() / 7); return false; };
const hkTel = (n) => { if (!n) return ""; const c = n.replace(/[^0-9]/g, ""); return c.length === 8 ? "+852" + c : c.startsWith("852") ? "+" + c : c; };
const hkWa = (n) => { if (!n) return ""; const c = n.replace(/[^0-9]/g, ""); return c.length === 8 ? "852" + c : c; };

const Up = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="18 15 12 9 6 15"/></svg>;
const Dn = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"/></svg>;
const Pl = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const Xx = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const Tr = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const Ed = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;

const PhLink = ({ n: num }) => num ? <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}><a href={"tel:" + hkTel(num)} style={{ color: "#0369a1", fontWeight: 600, textDecoration: "underline", fontSize: 11 }}>{"📞" + num}</a><a href={"https://wa.me/" + hkWa(num)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "#16a34a", fontWeight: 600, textDecoration: "underline" }}>WA</a></span> : null;

function NavLk({ addr }) {
  const [o, sO] = useState(false);
  if (!addr) return null;
  const e = encodeURIComponent(addr);
  return <span style={{ position: "relative" }}><button onClick={() => sO(!o)} style={{ background: "none", border: "none", cursor: "pointer", color: "#0369a1", fontSize: 11, textDecoration: "underline", padding: 0, fontFamily: "inherit" }}>{"📍" + addr + " ▸導航"}</button>
    {o && <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 50, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,.12)", padding: 4, marginTop: 2, minWidth: 120 }}>
      {[["Google Maps", "https://www.google.com/maps/search/?api=1&query=" + e], ["Apple Maps", "https://maps.apple.com/?q=" + e], ["Waze", "https://waze.com/ul?q=" + e], ["高德地圖", "https://uri.amap.com/search?keyword=" + e]].map(([n, u]) =>
        <a key={n} href={u} target="_blank" rel="noopener noreferrer" onClick={() => sO(false)} style={{ display: "block", padding: "7px 10px", fontSize: 12, color: "#1e293b", textDecoration: "none" }}>{n}</a>)}
    </div>}</span>;
}

function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,20,40,.45)", backdropFilter: "blur(3px)" }} onClick={onClose}>
    <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: "22px 24px", width: wide ? 560 : 420, maxWidth: "94vw", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,40,80,.18)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0c4a6e" }}>{title}</h3><button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><Xx /></button></div>
      {children}
    </div></div>;
}

const S = {
  i: { width: "100%", padding: "7px 10px", border: "1.5px solid #cbd5e1", borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  s: { width: "100%", padding: "7px 10px", border: "1.5px solid #cbd5e1", borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit", background: "#fff", cursor: "pointer" },
  l: { display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 3 },
  b: (bg, c) => ({ padding: "7px 14px", background: bg, color: c || "#fff", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }),
  m: { padding: "4px 7px", background: "#f1f5f9", border: "none", borderRadius: 5, cursor: "pointer", color: "#64748b", display: "inline-flex", alignItems: "center" },
  f: { marginBottom: 12 },
};
const CSS = "@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700;900&display=swap');*{box-sizing:border-box}input:focus,select:focus,textarea:focus{border-color:#0ea5e9!important;box-shadow:0 0 0 3px rgba(14,165,233,.12)}.tc{transition:all .15s}.tc:hover{box-shadow:0 4px 16px rgba(0,40,80,.08)!important;transform:translateY(-1px)}.nb{transition:all .15s}.nb:hover{background:rgba(14,116,144,.08)!important}";
const HB = (bg, c) => ({ background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.2)", color: "#fff", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 10, fontWeight: 600 });

/* ═══ 新版 LOGIN ═══ */
function Login({ techs, adminPin, adminLabel, appName, logo, onLogin, status }) {
  const [acc, setAcc] = useState("");
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");

  const tryLogin = () => {
    if (!acc || !pin) { setErr("請輸入帳號與密碼"); return; }
    if (acc === adminLabel || acc === "admin") {
      if (pin === adminPin) onLogin({ role: "admin" });
      else setErr("密碼錯誤");
    } else {
      const t = techs.find(x => x.name === acc || x.id === acc);
      if (t && t.active !== false && t.pin === pin) {
        onLogin({ role: "tech", techId: t.id });
      } else {
        setErr("帳號或密碼錯誤 (或帳號已停用)");
      }
    }
  };

  return <div style={{ fontFamily: "'Noto Sans TC',sans-serif", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg,#0c4a6e,#0e7490 50%,#14b8a6)" }}><style>{CSS}</style>
    <div style={{ background: "#fff", borderRadius: 18, padding: "32px 28px", width: 340, maxWidth: "92vw", boxShadow: "0 24px 60px rgba(0,30,60,.25)" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        {logo ? <img src={logo} alt="Logo" style={{ maxHeight: 60, maxWidth: "100%", marginBottom: 12, borderRadius: 8 }} />
             : <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#0e7490,#14b8a6)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", marginBottom: 8, fontSize: 24 }}>🏢</div>}
        <div style={{ fontSize: 20, fontWeight: 900, color: "#0c4a6e" }}>{appName}</div>
        {status === "loaded" && <div style={{ fontSize: 11, color: "#16a34a", marginTop: 4 }}>{"✅ 雲端連線成功"}</div>}
        {status === "new" && <div style={{ fontSize: 11, color: "#ea580c", marginTop: 4 }}>{"🆕 建立新資料庫"}</div>}
      </div>
      
      <div style={S.f}>
        <label style={S.l}>姓名 / 帳號</label>
        <input style={{ ...S.i, fontSize: 14 }} value={acc} onChange={e => {setAcc(e.target.value); setErr("");}} placeholder="輸入技師姓名或 admin" />
      </div>
      <div style={S.f}>
        <label style={S.l}>PIN 碼</label>
        <input type="password" style={{ ...S.i, fontSize: 16, letterSpacing: 4 }} value={pin} onChange={e => {setPin(e.target.value); setErr("");}} onKeyDown={e => { if (e.key === "Enter") tryLogin(); }} placeholder="••••" />
      </div>
      
      {err && <div style={{ color: "#dc2626", fontSize: 12, fontWeight: 600, marginBottom: 12, textAlign: "center" }}>{err}</div>}
      
      <button onClick={tryLogin} style={{ ...S.b("#0e7490"), width: "100%", justifyContent: "center", padding: "10px", fontSize: 14 }}>登入</button>
      
      <div style={{ textAlign: "center", marginTop: 14 }}>
        <button onClick={() => alert(`請聯繫【${adminLabel}】協助重設您的密碼。`)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#94a3b8", textDecoration: "underline" }}>忘記密碼？</button>
      </div>
    </div></div>;
}

/* ═══ MAIN ═══ */
export default function App() {
  const [data, setData] = useState(null);
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState("schedule");
  const [weekBase, setWeekBase] = useState(td());
  const [modals, setModals] = useState({});
  const [editing, setEditing] = useState({});
  const [saveStatus, setSaveStatus] = useState("");
  const [dayDetail, setDayDetail] = useState(null);
  const [importMsg, setImportMsg] = useState("");
  const ready = useRef(false);

  useEffect(() => { loadDB().then(d => { if (d && Object.keys(d).length > 0) { setData(d); setSaveStatus("loaded"); } else { setData(INIT); setSaveStatus("new"); } setTimeout(() => { ready.current = true; }, 200); setTimeout(() => setSaveStatus(""), 3000); }); }, []);

  const doSave = useCallback(async (d) => { const x = d || data; if (!x) return; setSaveStatus("saving"); const ok = await saveDB(x); setSaveStatus(ok ? "saved" : "error"); if (ok) setTimeout(() => setSaveStatus(""), 2500); }, [data]);
  useEffect(() => { if (!data || !ready.current) return; doSave(data); }, [data]);

  const upd = (key, val) => { setData(prev => { if (!prev) return prev; return { ...prev, [key]: typeof val === "function" ? val(prev[key]) : val }; }); };
  const openM = (k) => setModals(p => ({ ...p, [k]: true })); const closeM = (k) => setModals(p => ({ ...p, [k]: false }));
  
  if (!data) return <div style={{ fontFamily: "'Noto Sans TC',sans-serif", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg,#0c4a6e,#0e7490,#14b8a6)" }}><style>{CSS}</style><div style={{ background: "#fff", borderRadius: 14, padding: 32, textAlign: "center" }}>{"🐠 載入中..."}</div></div>;
  if (!session) return <Login techs={data.technicians} adminPin={data.adminPin} adminLabel={data.adminLabel || "管理員"} appName={data.appName || "水族排班系統"} logo={data.logo} onLogin={setSession} status={saveStatus} />;

  const { customers, tasks, recurring, technicians, serviceTypes, adminLabel, appName, logo } = data;
  
  // 權限判斷（技師可以被設為管理員）
  const curTech = session.role === "tech" ? technicians.find(t => t.id === session.techId) : null;
  const isAdmin = session.role === "admin" || (curTech && curTech.isAdmin);
  // 技師能看到誰的行程
  const visTechs = isAdmin ? technicians.map(t => t.id) : (curTech?.canView || [session.techId]);
  
  const gS = (id) => serviceTypes.find(x => x.id === id) || serviceTypes[0] || { label: "?", color: "#999", bg: "#eee" };
  const gC = (id) => customers.find(c => c.id === id); const gT = (id) => technicians.find(t => t.id === id);
  const fL = (f) => FREQS.find(x => x.id === f)?.l || f; const dL = (d) => DAYOPT.find(x => x.id === d)?.l || d;
  const weekDates = weekOf(weekBase); const shiftW = (dir) => { const d = new Date(weekBase); d.setDate(d.getDate() + dir * 7); setWeekBase(d.toISOString().split("T")[0]); };
  
  const tfd = (ds) => { 
    const oo = tasks.filter(t => t.date === ds && visTechs.includes(t.techId)); 
    const fr = recurring.filter(r => visTechs.includes(r.techId) && recMatch(r, ds) && !(r.skipDates || []).includes(ds)).map(r => ({ id: r.id + "_" + ds, recurringId: r.id, customerId: r.customerId, techId: r.techId, date: ds, time: r.time, serviceType: r.serviceType, note: r.note, done: false, isRecurring: true })); 
    return [...fr, ...oo].sort((a, b) => a.time.localeCompare(b.time)); 
  };
  const todayT = tfd(td()); 

  // CSV 防呆匯入
  const importCSV = (file) => { const r = new FileReader(); r.onload = (e) => { try { const res = Papa.parse(e.target.result, { header: true, skipEmptyLines: true }); const mapped = (res.data || []).map(r => { const name = r["客戶名稱"] || r["name"] || r["公司"] || Object.values(r)[0] || ""; return { id: uid(), name: String(name).trim(), code: String(r["客戶編碼"] || r["編碼"] || "").trim(), address: String(r["地址"] || "").trim(), contact: String(r["聯絡人"] || "").trim(), contactPhone: String(r["聯絡人電話"] || r["電話"] || "").trim(), fax: String(r["Fax"] || r["傳真"] || "").trim(), email: String(r["Email"] || "").trim(), siteContact: String(r["現場聯絡人"] || "").trim(), sitePhone: String(r["現場電話"] || "").trim(), note: String(r["備註"] || "").trim(), tanks: parseInt(r["魚缸數"] || "1") || 1, active: true }; }).filter(c => c.name); 
    if (mapped.length) { 
      const eCodes = data.customers.map(c => c.code).filter(Boolean); const eNames = data.customers.map(c => c.name).filter(Boolean);
      const newCusts = mapped.filter(c => !(c.code && eCodes.includes(c.code)) && !(c.name && eNames.includes(c.name)));
      if(newCusts.length > 0) { upd("customers", prev => [...prev, ...newCusts]); setImportMsg("✅ 成功匯入 " + newCusts.length + " 筆新客戶"); } else setImportMsg("⚠️ 沒有匯入新資料 (皆為重複)");
    } else setImportMsg("❌ 無法識別"); } catch { setImportMsg("❌ 匯入失敗"); } setTimeout(() => setImportMsg(""), 4000); }; r.readAsText(file); };

  /* ── 現場修改元件 ── */
  function SiteEdit({ cust }) {
    const [o, sO] = useState(false); const [nc, sNc] = useState(cust?.siteContact || ""); const [np, sNp] = useState(cust?.sitePhone || "");
    useEffect(() => { sNc(cust?.siteContact || ""); sNp(cust?.sitePhone || ""); }, [cust]);
    if (!o) return <div style={{ fontSize: 11, color: "#0369a1", background: "#f0f9ff", padding: "2px 6px", borderRadius: 4, marginTop: 2, display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>{"👷 " + (cust?.siteContact || "未設定")}{cust?.sitePhone && <PhLink n={cust.sitePhone} />}<button onClick={() => sO(true)} style={{ fontSize: 9, color: "#0369a1", background: "#e0f2fe", border: "none", borderRadius: 3, padding: "1px 5px", cursor: "pointer", fontFamily: "inherit" }}>{"✏️"}</button></div>;
    return <div style={{ background: "#f0f9ff", border: "1px solid #bfdbfe", borderRadius: 6, padding: "6px 8px", marginTop: 2 }}><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}><div><label style={{ fontSize: 10, fontWeight: 600, color: "#0369a1" }}>聯絡人</label><input style={{ ...S.i, fontSize: 12, padding: "4px 6px" }} value={nc} onChange={e => sNc(e.target.value)} /></div><div><label style={{ fontSize: 10, fontWeight: 600, color: "#0369a1" }}>電話</label><input style={{ ...S.i, fontSize: 12, padding: "4px 6px" }} value={np} onChange={e => sNp(e.target.value)} /></div></div><div style={{ display: "flex", gap: 4, marginTop: 4, justifyContent: "flex-end" }}><button onClick={() => sO(false)} style={{ ...S.b("#f1f5f9", "#475569"), padding: "2px 8px", fontSize: 11 }}>取消</button><button onClick={() => { upd("customers", p => p.map(c => c.id === cust.id ? { ...c, siteContact: nc, sitePhone: np } : c)); sO(false); }} style={{ ...S.b("#0369a1"), padding: "2px 8px", fontSize: 11 }}>存</button></div></div>;
  }

  function RptInput({ tKey }) {
    const [o, sO] = useState(false); const rp = (data.reports || {})[tKey]; const [txt, sTxt] = useState(rp?.text || "");
    useEffect(() => { sTxt(rp?.text || ""); }, [rp]);
    if (!o) return <button onClick={() => sO(true)} style={{ marginTop: 3, fontSize: 10, color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 4, padding: "2px 8px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>{rp ? "✏️修改回報" : "📋寫現場回報"}</button>;
    return <div style={{ marginTop: 3, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "6px 8px" }}><textarea value={txt} onChange={e => sTxt(e.target.value)} placeholder="現場回報內容..." style={{ ...S.i, minHeight: 40, resize: "vertical", fontSize: 12, border: "1px solid #bbf7d0" }} autoFocus /><div style={{ display: "flex", gap: 4, marginTop: 4, justifyContent: "flex-end" }}><button onClick={() => sO(false)} style={{ ...S.b("#f1f5f9", "#475569"), padding: "2px 8px", fontSize: 10 }}>取消</button><button onClick={() => { upd("reports", prev => ({ ...(prev || {}), [tKey]: { text: txt, time: new Date().toLocaleString("zh-TW"), techId: session.techId || "admin" } })); sO(false); }} style={{ ...S.b("#16a34a"), padding: "2px 8px", fontSize: 10 }}>送出</button></div></div>;
  }

  /* ── 任務卡片 ── */
  function TaskCard({ task, date }) {
    const svc = gS(task.serviceType); const cust = gC(task.customerId);
    const rk = task.isRecurring ? (task.recurringId + "_" + date) : task.id;
    const rp = (data.reports || {})[rk];
    // 判斷是否可以編輯/改期 (管理員或該任務屬於自己)
    const canEditTask = isAdmin || task.techId === session.techId;

    return <div style={{ padding: "8px 0" }}>
      <div style={{ display: "flex", gap: 6 }}>
        <div style={{ width: 3, borderRadius: 2, background: svc.color, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 1 }}>
            <span style={{ fontWeight: 800, fontSize: 13, color: "#0c4a6e" }}>{task.time}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: svc.color, background: svc.bg, padding: "0 5px", borderRadius: 3 }}>{svc.label}</span>
            {task.isRecurring && <span style={{ fontSize: 9, color: "#0d9488" }}>{"🔄"}</span>}
            {task.done && <span style={{ fontSize: 9, color: "#16a34a", fontWeight: 700 }}>{"✅"}</span>}
            {/* 技師跟管理員專屬的改期按鈕 */}
            {canEditTask && !task.isRecurring && <button onClick={(e) => { e.stopPropagation(); setEditing({ task }); openM("task"); }} style={{ fontSize: 9, color: "#64748b", background: "#f1f5f9", border: "none", borderRadius: 3, padding: "1px 5px", cursor: "pointer", marginLeft: "auto" }}>✏️改期</button>}
          </div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{cust?.name}{cust?.tanks ? <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 3 }}>{"🐠" + cust.tanks + "缸"}</span> : null}</div>
          {cust?.address && <NavLk addr={cust.address} />}
          <SiteEdit cust={cust} />
          {task.note && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{"📝 " + task.note}</div>}
          {cust?.note && <div style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>{"💬 " + cust.note}</div>}
          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>{"🔧 " + (gT(task.techId)?.name || "")}</div>
          {rp && <div style={{ fontSize: 11, color: "#16a34a", background: "#f0fdf4", padding: "3px 6px", borderRadius: 4, marginTop: 2, border: "1px solid #bbf7d0" }}>{"📋 " + rp.text + (rp.time ? " (" + rp.time + ")" : "")}</div>}
          <RptInput tKey={rk} />
        </div>
        {canEditTask && <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
          {!task.isRecurring && <button onClick={() => upd("tasks", p => p.map(t => t.id === task.id ? { ...t, done: !t.done } : t))} style={{ ...S.m, color: task.done ? "#ea580c" : "#16a34a", fontSize: 11, fontWeight: 700 }}>{task.done ? "↩" : "✓"}</button>}
          {task.isRecurring && <button onClick={() => upd("recurring", p => p.map(r => r.id === task.recurringId ? { ...r, skipDates: [...(r.skipDates || []), date] } : r))} style={{ ...S.m, color: "#ea580c", fontSize: 9 }}>跳過</button>}
          {isAdmin && !task.isRecurring && <button onClick={() => upd("tasks", p => p.filter(t => t.id !== task.id))} style={{ ...S.m, color: "#ef4444" }}><Tr /></button>}
        </div>}
      </div>
    </div>;
  }

  /* ── 彈窗設定表單 ── */
  function TechEditor({ onClose }) {
    const [list, setList] = useState(technicians.map(t => ({ ...t })));
    const upL = (i, k, v) => { const n = [...list]; n[i] = { ...n[i], [k]: v }; setList(n); };
    return <div>
      {list.map((t, i) => <div key={t.id} style={{ padding: 10, background: t.active === false ? "#f1f5f9" : "#fafbfc", borderRadius: 8, marginBottom: 6, border: "1px solid #e2e8f0", opacity: t.active === false ? 0.6 : 1 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <button disabled={i === 0} onClick={() => setList(mv(list, i, i - 1))} style={{ ...S.m, padding: "1px 3px" }}><Up /></button>
            <button disabled={i === list.length - 1} onClick={() => setList(mv(list, i, i + 1))} style={{ ...S.m, padding: "1px 3px" }}><Dn /></button>
          </div>
          <div style={{ flex: 1 }}><label style={S.l}>姓名</label><input style={S.i} value={t.name} onChange={e => upL(i, "name", e.target.value)} /></div>
          <div><label style={S.l}>PIN</label><div style={{ display: "flex", gap: 3 }}><input maxLength={10} style={{ ...S.i, width: 70, letterSpacing: 3, fontWeight: 700 }} value={t.pin} onChange={e => upL(i, "pin", e.target.value)} /><button onClick={() => upL(i, "pin", "0000")} style={{ ...S.b("#fff7ed", "#ea580c"), padding: "5px 7px", fontSize: 10 }}>重設</button></div></div>
        </div>
        <div style={{ display: "flex", gap: 10, fontSize: 12, fontWeight: 600, color: "#475569", flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><input type="checkbox" checked={t.active !== false} onChange={e => upL(i, "active", e.target.checked)} /> 啟用帳號</label>
          <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: t.isAdmin ? "#dc2626" : "inherit" }}><input type="checkbox" checked={t.isAdmin || false} onChange={e => upL(i, "isAdmin", e.target.checked)} /> 設為管理員</label>
        </div>
      </div>)}
      <button onClick={() => { const nid = uid(); setList(p => [...p, { id: nid, name: "新技師", pin: "0000", canView: [nid], canEdit: false, active: true }]); }} style={{ ...S.b("#f0fdfa", "#0d9488"), width: "100%", justifyContent: "center", padding: 7, borderRadius: 8, border: "1.5px dashed #99f6e4", marginBottom: 10 }}><Pl /> 新增技師</button>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}><button onClick={onClose} style={S.b("#f1f5f9", "#475569")}>取消</button><button onClick={() => { upd("technicians", list); onClose(); }} style={S.b("#0e7490")}>儲存</button></div></div>;
  }

  function AppCfg({ onClose }) {
    const [n, sN] = useState(appName || ""); 
    const handleLogo = (e) => {
      const f = e.target.files[0]; if(!f) return;
      const r = new FileReader(); r.onload = (ev) => upd("logo", ev.target.result); r.readAsDataURL(f);
    };
    return <div>
      <div style={S.f}><label style={S.l}>系統名稱</label><input style={S.i} value={n} onChange={e => sN(e.target.value)} /></div>
      <div style={S.f}>
        <label style={S.l}>更換公司 Logo</label>
        {logo && <div style={{ marginBottom: 8 }}><img src={logo} alt="Logo" style={{ maxHeight: 50, borderRadius: 6 }} /><button onClick={() => upd("logo", "")} style={{ marginLeft: 10, ...S.m, color: "#ef4444" }}>移除</button></div>}
        <input type="file" accept="image/*" onChange={handleLogo} style={S.i} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginBottom: 14 }}><button onClick={onClose} style={S.b("#f1f5f9", "#475569")}>取消</button><button onClick={() => { upd("appName", n); onClose(); }} style={S.b("#0e7490")}>儲存</button></div>
    </div>;
  }

  function CustEditor({ onClose }) {
    const [list, setList] = useState(customers.map(c => ({ ...c })));
    const upL = (i, k, v) => { const n = [...list]; n[i] = { ...n[i], [k]: v }; setList(n); };
    return <div>
      {list.map((c, i) => <div key={c.id} style={{ padding: "8px 10px", background: c.active === false ? "#f1f5f9" : "#fafbfc", borderRadius: 8, marginBottom: 6, border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 6, opacity: c.active === false ? 0.6 : 1 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <button disabled={i === 0} onClick={() => setList(mv(list, i, i - 1))} style={{ ...S.m, padding: "1px 3px" }}><Up /></button>
          <button disabled={i === list.length - 1} onClick={() => setList(mv(list, i, i + 1))} style={{ ...S.m, padding: "1px 3px" }}><Dn /></button>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", gap: 4 }}>
            <input style={{ ...S.i, width: "30%", padding: "4px 6px" }} placeholder="編碼" value={c.code || ""} onChange={e => upL(i, "code", e.target.value)} />
            <input style={{ ...S.i, flex: 1, padding: "4px 6px" }} placeholder="客戶名稱" value={c.name} onChange={e => upL(i, "name", e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 10, fontSize: 11, fontWeight: 600, color: "#475569" }}>
            <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><input type="checkbox" checked={c.active !== false} onChange={e => upL(i, "active", e.target.checked)} /> 合作中 (取消則為已停止)</label>
          </div>
        </div>
      </div>)}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 10 }}><button onClick={onClose} style={S.b("#f1f5f9", "#475569")}>取消</button><button onClick={() => { upd("customers", list); onClose(); }} style={S.b("#0e7490")}>儲存排序與狀態</button></div>
    </div>;
  }

  function TaskForm({ onClose, initial }) {
    const [f, sF] = useState(initial || { customerId: customers[0]?.id || "", techId: session.techId || technicians[0]?.id, date: editing.prefillDate || td(), time: "09:00", serviceType: serviceTypes[0]?.id || "", note: "", done: false });
    const u = (k, v) => sF(p => ({ ...p, [k]: v }));
    return <div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
      <div style={S.f}><label style={S.l}>客戶</label>
        <select style={S.s} value={f.customerId} onChange={e => u("customerId", e.target.value)} disabled={!isAdmin && initial}>
          {customers.filter(c => c.active !== false || c.id === f.customerId).map(c => <option key={c.id} value={c.id}>{c.code ? `[${c.code}] ` : ""}{c.name}</option>)}
        </select>
      </div>
      <div style={S.f}><label style={S.l}>技師</label><select style={S.s} value={f.techId} onChange={e => u("techId", e.target.value)} disabled={!isAdmin && initial}>{technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
      <div style={S.f}><label style={S.l}>日期</label><input type="date" style={S.i} value={f.date} onChange={e => u("date", e.target.value)} /></div>
      <div style={S.f}><label style={S.l}>時間</label><input type="time" style={S.i} value={f.time} onChange={e => u("time", e.target.value)} /></div>
      <div style={{ ...S.f, gridColumn: "1/-1" }}><label style={S.l}>類型</label><select style={S.s} value={f.serviceType} onChange={e => u("serviceType", e.target.value)} disabled={!isAdmin && initial}>{serviceTypes.map(x => <option key={x.id} value={x.id}>{x.label}</option>)}</select></div>
    </div><div style={S.f}><label style={S.l}>備註</label><textarea style={{ ...S.i, minHeight: 36, resize: "vertical" }} value={f.note} onChange={e => u("note", e.target.value)} /></div>
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}><button onClick={onClose} style={S.b("#f1f5f9", "#475569")}>取消</button><button onClick={() => { if (!f.customerId || !f.techId || !f.date) return; if (initial && initial.id && !initial.isRecurring) upd("tasks", p => p.map(t => t.id === initial.id ? { ...f, id: initial.id } : t)); else upd("tasks", p => [...p, { ...f, id: uid() }]); onClose(); }} style={S.b("#0e7490")}>{initial && !initial.isRecurring ? "更新行程" : "新增"}</button></div></div>;
  }

  /* ═══ RENDER ═══ */
  return <div style={{ fontFamily: "'Noto Sans TC',sans-serif", background: "linear-gradient(160deg,#f0f9ff,#e0f2fe 40%,#f0fdfa)", minHeight: "100vh", color: "#1e293b" }}><style>{CSS}</style>

    {/* 狀態提示 */}
    {saveStatus && <div style={{ position: "fixed", bottom: 12, right: 12, zIndex: 999, padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, boxShadow: "0 4px 12px rgba(0,0,0,.1)", background: saveStatus === "saved" ? "#f0fdf4" : saveStatus === "error" ? "#fef2f2" : "#f0f9ff", color: saveStatus === "saved" ? "#16a34a" : saveStatus === "error" ? "#dc2626" : "#0369a1", border: "1px solid " + (saveStatus === "saved" ? "#bbf7d0" : saveStatus === "error" ? "#fecaca" : "#bfdbfe") }}>
      {saveStatus === "saving" && "🔄 同步中..."}{saveStatus === "saved" && "✅ 同步完成"}{saveStatus === "error" && <span>{"❌ 同步失敗 "}<button onClick={() => doSave()} style={{ ...S.b("#dc2626"), padding: "2px 8px", fontSize: 10 }}>重試</button></span>}
    </div>}

    {/* Header */}
    <div style={{ background: "linear-gradient(135deg,#0c4a6e,#0e7490 60%,#14b8a6)", padding: "12px 18px", color: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 1100, margin: "0 auto", flexWrap: "wrap", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          {logo ? <img src={logo} alt="Logo" style={{ height: 30, borderRadius: 4 }} /> : <div style={{ width: 30, height: 30, borderRadius: 7, background: "rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center" }}><Fi /></div>}
          <div><div style={{ fontSize: 15, fontWeight: 900 }}>{appName}</div><div style={{ fontSize: 10, opacity: .7 }}>{isAdmin ? adminLabel : gT(session.techId)?.name || ""}</div></div>
        </div>
        <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
          {isAdmin && <button onClick={() => openM("appCfg")} className="nb" style={HB()}>系統</button>}
          {isAdmin && <button onClick={() => openM("tech")} className="nb" style={HB()}>技師</button>}
          {isAdmin && <button onClick={() => openM("custEditor")} className="nb" style={HB()}>客戶</button>}
          <button onClick={() => setSession(null)} className="nb" style={HB()}>登出</button>
        </div></div></div>

    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px" }}>
      <div style={{ display: "flex", gap: 2, padding: "10px 0 0", borderBottom: "2px solid #e2e8f0", flexWrap: "wrap" }}>
        {[{ id: "schedule", l: "排程總覽" }, { id: "today", l: "今日行程" }, ...(isAdmin ? [{ id: "customers", l: "客戶資料" }] : [])].map(t =>
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "7px 11px", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: tab === t.id ? 700 : 500, color: tab === t.id ? "#0e7490" : "#64748b", borderBottom: tab === t.id ? "2.5px solid #0e7490" : "2.5px solid transparent", marginBottom: -2 }}>{t.l}</button>)}
      </div>

      {/* SCHEDULE */}
      {tab === "schedule" && <div style={{ paddingTop: 14, paddingBottom: 30 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button onClick={() => shiftW(-1)} className="nb" style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 6, padding: "3px 5px", cursor: "pointer" }}>{"◀"}</button>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#0c4a6e", minWidth: 110, textAlign: "center" }}>{fmt(weekDates[0])} — {fmt(weekDates[6])}</span>
            <button onClick={() => shiftW(1)} className="nb" style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 6, padding: "3px 5px", cursor: "pointer" }}>{"▶"}</button>
            <button onClick={() => setWeekBase(td())} className="nb" style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 6, padding: "3px 6px", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#0e7490" }}>今天</button></div>
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={() => { setEditing({ task: null, prefillDate: null }); openM("task"); }} style={{ ...S.b("#0e7490"), borderRadius: 7, padding: "6px 10px" }}><Pl /> 單次</button></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, background: "#fff", borderRadius: 10, padding: 7, boxShadow: "0 2px 12px rgba(0,40,80,.04)", border: "1px solid #e2e8f0" }}>
          {weekDates.map((date, di) => { const isT = date === td(); const dt = tfd(date);
            return <div key={date} style={{ minHeight: 120, borderRadius: 7, padding: 5, background: isT ? "#f0fdfa" : "#fafbfc", border: isT ? "1.5px solid #14b8a6" : "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                 <div style={{ fontSize: 10, fontWeight: 700, textAlign: "center", color: isT ? "#0d9488" : "#94a3b8", flex: 1 }}>
                   <span style={{ display: "block", fontSize: 9 }}>{"週" + DN[di]}</span>
                   <span style={{ display: "inline-block", fontSize: 13, fontWeight: 900, color: isT ? "#fff" : "#475569", background: isT ? "#0d9488" : "transparent", borderRadius: 12, width: 22, height: 22, lineHeight: "22px" }}>{new Date(date).getDate()}</span>
                 </div>
                 {/* 日期專屬新增按鈕 */}
                 <button onClick={() => { setEditing({ task: null, prefillDate: date }); openM("task"); }} style={{ background: "none", border: "none", color: "#0ea5e9", cursor: "pointer", padding: 2 }}><Pl/></button>
              </div>
              {dt.map(task => { const svc = gS(task.serviceType); const cust = gC(task.customerId);
                return <div key={task.id} className="tc" onClick={() => { setDayDetail(date); }} style={{ background: svc.bg, borderLeft: "2px solid " + svc.color, borderRadius: 4, padding: "4px 5px", marginBottom: 3, cursor: "pointer", fontSize: 10 }}>
                  <div style={{ fontWeight: 800, color: svc.color, marginBottom: 1 }}>{task.time}{task.isRecurring ? " 🔄" : ""}</div>
                  <div style={{ color: "#334155", fontWeight: 600, lineHeight: 1.2 }}>{cust?.name || "?"}</div></div>; })}
            </div>; })}
        </div></div>}

      {/* TODAY */}
      {tab === "today" && <div style={{ paddingTop: 14, paddingBottom: 30 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0c4a6e", marginBottom: 10 }}>{new Date().toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric", weekday: "long" })} <span style={{ fontSize: 11, background: "#ecfeff", color: "#0e7490", padding: "2px 7px", borderRadius: 14 }}>{todayT.length + "項"}</span></div>
        {technicians.filter(t => visTechs.includes(t.id)).map(tech => { const tt = todayT.filter(t => t.techId === tech.id);
          return <div key={tech.id} style={{ background: "#fff", borderRadius: 10, padding: "10px 14px", marginBottom: 10, border: "1px solid #e2e8f0" }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, paddingBottom: 6, borderBottom: "1px solid #f1f5f9" }}>{tech.name} <span style={{ fontWeight: 500, color: "#94a3b8", fontSize: 11 }}>{tt.length + "項"}</span></div>
            {tt.length === 0 && <div style={{ color: "#cbd5e1", fontSize: 12, textAlign: "center", padding: 10 }}>今日無行程</div>}
            {tt.map((task, i) => <div key={task.id} style={{ borderBottom: i < tt.length - 1 ? "1px solid #f1f5f9" : "none" }}><TaskCard task={task} date={td()} /></div>)}
          </div>; })}
      </div>}

      {/* CUSTOMERS */}
      {tab === "customers" && isAdmin && <div style={{ paddingTop: 14, paddingBottom: 30 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 5 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0c4a6e" }}>{"客戶 " + customers.length + "位"}</span>
          <div style={{ display: "flex", gap: 4 }}>
            <label style={{ ...S.b("#f0f9ff", "#0369a1"), borderRadius: 7, cursor: "pointer", border: "1.5px solid #bfdbfe" }}>{"📄CSV匯入"}<input type="file" accept=".csv" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) importCSV(e.target.files[0]); e.target.value = ""; }} /></label>
            </div></div>
        {importMsg && <div style={{ marginBottom: 8, padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: importMsg.startsWith("✅") ? "#f0fdf4" : "#fef2f2", color: importMsg.startsWith("✅") ? "#16a34a" : "#dc2626" }}>{importMsg}</div>}
        {customers.map(c => <div key={c.id} style={{ background: "#fff", borderRadius: 9, padding: "10px 14px", marginBottom: 6, border: "1px solid #e2e8f0", opacity: c.active === false ? 0.6 : 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#0c4a6e" }}>{c.code && <span style={{ color: "#94a3b8", fontSize: 11 }}>{"[" + c.code + "] "}</span>}{c.name} {c.active === false && <span style={{ color: "#ef4444", fontSize: 10 }}>[已停止]</span>}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{c.address}</div>
          <div style={{ display: "flex", gap: 7, fontSize: 10, color: "#94a3b8", marginTop: 4, flexWrap: "wrap" }}>
             {c.contact && <span>👤 {c.contact}</span>} {c.siteContact && <span>👷 {c.siteContact}</span>}
          </div>
        </div>)}
      </div>}
    </div>

    {/* Modals */}
    <Modal open={modals.task} onClose={() => closeM("task")} title={editing.task ? "編輯排程" : "新增排程"} wide><TaskForm onClose={() => closeM("task")} initial={editing.task} /></Modal>
    {isAdmin && <Modal open={modals.tech} onClose={() => closeM("tech")} title="技師管理" wide><TechEditor onClose={() => closeM("tech")} /></Modal>}
    {isAdmin && <Modal open={modals.appCfg} onClose={() => closeM("appCfg")} title="系統設定"><AppCfg onClose={() => closeM("appCfg")} /></Modal>}
    {isAdmin && <Modal open={modals.custEditor} onClose={() => closeM("custEditor")} title="編輯與排序客戶" wide><CustEditor onClose={() => closeM("custEditor")} /></Modal>}
    
    {dayDetail && <Modal open={true} onClose={() => setDayDetail(null)} title={(() => { const d = new Date(dayDetail); return (d.getMonth() + 1) + "月" + d.getDate() + "日 週" + DN[(d.getDay() + 6) % 7]; })()} wide>
      {tfd(dayDetail).length === 0 && <div style={{ textAlign: "center", padding: 20, color: "#94a3b8" }}>無排程</div>}
      {tfd(dayDetail).map((task, i) => <div key={task.id} style={{ borderBottom: i < tfd(dayDetail).length - 1 ? "1px solid #f1f5f9" : "none" }}><TaskCard task={task} date={dayDetail} /></div>)}
      {canEdit && <button onClick={() => { setEditing({ task: null, prefillDate: dayDetail }); openM("task"); setDayDetail(null); }} style={{ ...S.b("#0e7490"), width: "100%", justifyContent: "center", marginTop: 8, borderRadius: 8 }}><Pl /> 新增行程</button>}
    </Modal>}
  </div>;
}