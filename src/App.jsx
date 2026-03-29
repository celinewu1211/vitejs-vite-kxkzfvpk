import { useState, useEffect, useCallback, useRef } from "react";
import * as Papa from "papaparse";
import { createClient } from '@supabase/supabase-js';

// --- Supabase 連線設定 ---
const supabaseUrl = 'https://gsrhvjxodnjsqaosgegl.supabase.co';
const supabaseKey = 'sb_publishable_n23wUeYIP_WCd1PUbrCmeg_1zbJwqSp';
const supabase = createClient(supabaseUrl, supabaseKey);
const SKEY = "main"; 

// 雲端讀取
const loadDB = async () => { 
  try { 
    const { data, error } = await supabase.from('app_data').select('data').eq('id', SKEY).single();
    if (error) throw error;
    return data ? data.data : null;
  } catch (e) { return null; } 
};

// 雲端存檔
const saveDB = async (d) => { 
  try { 
    const { error } = await supabase.from('app_data').upsert({ id: SKEY, data: d, updated_at: new Date().toISOString() });
    if (error) throw error;
    return true; 
  } catch (e) { return false; } 
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
    { id: "t1", name: "admin", pin: "0000", isAdmin: true, active: true },
  ],
  customers: [], recurring: [], tasks: [], reports: {}, adminPin: "0000",
};

const COLORS = ["#0e7490","#0369a1","#0284c7","#2563eb","#4f46e5","#6d28d9","#7c3aed","#9333ea","#a21caf","#db2777","#e11d48","#dc2626","#ea580c","#d97706","#ca8a04","#65a30d","#16a34a","#059669","#0d9488","#475569","#92400e","#78350f","#1e1b4b","#831843"];
const BG = { "#0e7490":"#ecfeff","#0369a1":"#e0f2fe","#0284c7":"#e0f2fe","#2563eb":"#eff6ff","#4f46e5":"#eef2ff","#6d28d9":"#ede9fe","#7c3aed":"#f5f3ff","#9333ea":"#faf5ff","#a21caf":"#fdf4ff","#db2777":"#fdf2f8","#e11d48":"#fff1f2","#dc2626":"#fef2f2","#ea580c":"#fff7ed","#d97706":"#fffbeb","#ca8a04":"#fefce8","#65a30d":"#f7fee7","#16a34a":"#f0fdf4","#059669":"#ecfdf5","#0d9488":"#f0fdfa","#475569":"#f8fafc","#92400e":"#fffbeb","#78350f":"#fef3c7","#1e1b4b":"#eef2ff","#831843":"#fdf2f8" };
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
const Fi = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6.5 12c2-6 7-7 14.5-4C17.5 12 17.5 16 21 20c-7.5 3-12.5 2-14.5-4"/><path d="M2 12l4-2v4l-4-2z"/><circle cx="14" cy="11" r="1" fill="currentColor"/></svg>;

const PhLink = ({ n: num }) => num ? <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}><a href={"tel:" + hkTel(num)} style={{ color: "#0369a1", fontWeight: 600, textDecoration: "underline", fontSize: 11 }}>{"📞" + num}</a><a href={"https://wa.me/" + hkWa(num)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "#16a34a", fontWeight: 600, textDecoration: "underline" }}>WA</a></span> : null;

function NavLk({ addr }) {
  const [o, sO] = useState(false); if (!addr) return null; const e = encodeURIComponent(addr);
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

function Login({ techs, adminPin, adminLabel, appName, logo, onLogin, status }) {
  const [acc, setAcc] = useState(""); const [pin, setPin] = useState(""); const [err, setErr] = useState("");
  const tryLogin = () => {
    if (!acc || !pin) { setErr("請輸入帳號與密碼"); return; }
    if (acc === adminLabel || acc === "admin" || acc === "管理員") {
      if (pin === adminPin) onLogin({ role: "admin" }); else setErr("密碼錯誤");
    } else {
      const t = techs.find(x => x.name === acc || x.id === acc);
      if (t && t.active !== false && t.pin === pin) onLogin({ role: "tech", techId: t.id });
      else setErr("帳號錯誤或已停用");
    }
  };
  return <div style={{ fontFamily: "'Noto Sans TC',sans-serif", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg,#0c4a6e,#0e7490 50%,#14b8a6)" }}><style>{CSS}</style>
    <div style={{ background: "#fff", borderRadius: 18, padding: "32px 28px", width: 340, maxWidth: "92vw", boxShadow: "0 24px 60px rgba(0,30,60,.25)" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        {logo ? <img src={logo} alt="Logo" style={{ maxHeight: 60, maxWidth: "100%", marginBottom: 12, borderRadius: 8 }} />
             : <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#0e7490,#14b8a6)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", marginBottom: 8, fontSize: 24 }}>🏢</div>}
        <div style={{ fontSize: 20, fontWeight: 900, color: "#0c4a6e" }}>{appName}</div>
      </div>
      <div style={S.f}><label style={S.l}>帳號</label><input style={{ ...S.i, fontSize: 14 }} value={acc} onChange={e => {setAcc(e.target.value); setErr("");}} placeholder="admin 或 姓名" /></div>
      <div style={S.f}><label style={S.l}>PIN 碼</label><input type="password" style={{ ...S.i, fontSize: 16, letterSpacing: 4 }} value={pin} onChange={e => {setPin(e.target.value); setErr("");}} onKeyDown={e => { if (e.key === "Enter") tryLogin(); }} placeholder="••••" /></div>
      {err && <div style={{ color: "#dc2626", fontSize: 12, fontWeight: 600, marginBottom: 12, textAlign: "center" }}>{err}</div>}
      <button onClick={tryLogin} style={{ ...S.b("#0e7490"), width: "100%", justifyContent: "center", padding: "10px" }}>登入</button>
      <div style={{ textAlign: "center", marginTop: 14 }}><button onClick={() => alert("請聯繫管理員重設密碼")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#94a3b8", textDecoration: "underline" }}>忘記密碼？</button></div>
    </div></div>;
}

export default function App() {
  const [data, setData] = useState(null); const [session, setSession] = useState(null); const [tab, setTab] = useState("schedule");
  const [weekBase, setWeekBase] = useState(td()); const [modals, setModals] = useState({}); const [editing, setEditing] = useState({});
  const [saveStatus, setSaveStatus] = useState(""); const [dayDetail, setDayDetail] = useState(null); const [importMsg, setImportMsg] = useState("");
  const ready = useRef(false);

  useEffect(() => { loadDB().then(d => { if (d && d.technicians) { setData(d); setSaveStatus("loaded"); } else { setData(INIT); setSaveStatus("new"); } setTimeout(() => { ready.current = true; }, 200); }); }, []);
  const doSave = useCallback(async (d) => { const x = d || data; if (!x) return; setSaveStatus("saving"); const ok = await saveDB(x); setSaveStatus(ok ? "saved" : "error"); setTimeout(() => setSaveStatus(""), 3000); }, [data]);
  useEffect(() => { if (!data || !ready.current) return; doSave(data); }, [data]);

  const upd = (key, val) => { setData(prev => { if (!prev) return prev; return { ...prev, [key]: typeof val === "function" ? val(prev[key]) : val }; }); };
  const openM = (k) => setModals(p => ({ ...p, [k]: true })); const closeM = (k) => setModals(p => ({ ...p, [k]: false }));
  
  if (!data) return <div style={{ background: "#fff", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>🐠 載入中...</div>;
  if (!session) return <Login techs={data.technicians} adminPin={data.adminPin} adminLabel={data.adminLabel} appName={data.appName} logo={data.logo} onLogin={setSession} status={saveStatus} />;

  const { customers, tasks, recurring, technicians, serviceTypes, adminLabel, appName, logo } = data;
  const curTech = session.role === "tech" ? technicians.find(t => t.id === session.techId) : null;
  const isAdmin = session.role === "admin" || (curTech && curTech.isAdmin);
  const canEdit = isAdmin || (curTech && curTech.canEdit);
  const visTechs = isAdmin ? technicians.map(t => t.id) : (curTech?.canView || [session.techId]);
  const gS = (id) => serviceTypes.find(x => x.id === id) || serviceTypes[0];
  const gC = (id) => customers.find(c => c.id === id); const gT = (id) => technicians.find(t => t.id === id);
  const weekDates = weekOf(weekBase);
  const tfd = (ds) => { 
    const oo = (tasks || []).filter(t => t.date === ds && visTechs.includes(t.techId)); 
    const fr = (recurring || []).filter(r => visTechs.includes(r.techId) && recMatch(r, ds) && !(r.skipDates || []).includes(ds)).map(r => ({ id: r.id + "_" + ds, recurringId: r.id, customerId: r.customerId, techId: r.techId, date: ds, time: r.time, serviceType: r.serviceType, note: r.note, done: false, isRecurring: true })); 
    return [...fr, ...oo].sort((a, b) => a.time.localeCompare(b.time)); 
  };

  const importCSV = (file) => { const r = new FileReader(); r.onload = (e) => { try { const res = Papa.parse(e.target.result, { header: true, skipEmptyLines: true }); const mapped = (res.data || []).map(r => ({ id: uid(), name: String(r["客戶名稱"] || "").trim(), code: String(r["客戶編碼"] || "").trim(), address: String(r["地址"] || "").trim(), contact: String(r["聯絡人"] || "").trim(), contactPhone: String(r["聯絡人電話"] || "").trim(), siteContact: String(r["現場聯絡人"] || "").trim(), sitePhone: String(r["現場電話"] || "").trim(), tanks: parseInt(r["魚缸數"] || "1") || 1, active: true })).filter(c => c.name); 
    if (mapped.length) { 
      const eCodes = customers.map(c => c.code).filter(Boolean); const eNames = customers.map(c => c.name).filter(Boolean);
      const newCusts = mapped.filter(c => !(c.code && eCodes.includes(c.code)) && !(c.name && eNames.includes(c.name)));
      if(newCusts.length > 0) { upd("customers", prev => [...prev, ...newCusts]); setImportMsg(`✅ 已匯入 ${newCusts.length} 筆`); } else setImportMsg("⚠️ 資料皆重複");
    } } catch { setImportMsg("❌ 失敗"); } }; r.readAsText(file); };

  function TaskCard({ task, date }) {
    const svc = gS(task.serviceType); const cust = gC(task.customerId); const rk = task.isRecurring ? (task.recurringId + "_" + date) : task.id;
    const rp = (data.reports || {})[rk]; const canE = isAdmin || task.techId === session.techId;
    return <div style={{ padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
      <div style={{ display: "flex", gap: 6 }}>
        <div style={{ width: 3, background: svc.color, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 1 }}>
            <span style={{ fontWeight: 800, fontSize: 13, color: "#0c4a6e" }}>{task.time}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: svc.color, background: svc.bg, padding: "0 5px", borderRadius: 3 }}>{svc.label}</span>
            {task.done && <span style={{ fontSize: 9, color: "#16a34a" }}>✅</span>}
            {canE && !task.isRecurring && <button onClick={() => { setEditing({ task }); openM("task"); }} style={{ fontSize: 9, marginLeft: "auto", background: "#f1f5f9", border: "none" }}>✏️改期</button>}
          </div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{cust?.name}{cust?.tanks ? ` 🐠${cust.tanks}缸` : ""}</div>
          {cust?.address && <NavLk addr={cust.address} />}
          <div style={{ fontSize: 11, color: "#0369a1", marginTop: 2 }}>👷 {cust?.siteContact || "未設定"} <PhLink n={cust?.sitePhone} /></div>
          {task.note && <div style={{ fontSize: 11, color: "#64748b" }}>📝 {task.note}</div>}
          <div style={{ fontSize: 10, color: "#94a3b8" }}>🔧 {gT(task.techId)?.name}</div>
          {rp && <div style={{ fontSize: 11, color: "#16a34a", background: "#f0fdf4", padding: "3px 6px", borderRadius: 4 }}>📋 {rp.text}</div>}
          <button onClick={() => { setEditing({ tKey: rk }); openM("rpt"); }} style={{ fontSize: 10, color: "#16a34a", marginTop: 4, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>{rp ? "修改回報" : "寫現場回報"}</button>
        </div>
        {canE && <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {!task.isRecurring && <button onClick={() => upd("tasks", p => p.map(t => t.id === task.id ? { ...t, done: !t.done } : t))} style={S.m}>{task.done ? "↩" : "✓"}</button>}
          {isAdmin && !task.isRecurring && <button onClick={() => upd("tasks", p => p.filter(t => t.id !== task.id))} style={{ ...S.m, color: "#ef4444" }}><Tr /></button>}
        </div>}
      </div>
    </div>;
  }

  return <div style={{ fontFamily: "'Noto Sans TC',sans-serif", background: "#f0f9ff", minHeight: "100vh" }}><style>{CSS}</style>
    {saveStatus && <div style={{ position: "fixed", bottom: 12, right: 12, zIndex: 999, padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: "#fff", border: "1px solid #ddd" }}>
      {saveStatus === "saving" && "🔄 同步中..."}{saveStatus === "saved" && "✅ 同步完成"}{saveStatus === "error" && "❌ 同步失敗"}</div>}
    <div style={{ background: "linear-gradient(135deg,#0c4a6e,#0e7490)", padding: "12px 18px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>{logo ? <img src={logo} style={{ height: 25 }} /> : <Fi />} <b>{appName}</b></div>
      <div style={{ display: "flex", gap: 5 }}>
        {isAdmin && <button onClick={() => openM("tech")} style={HB()}>技師</button>}
        {isAdmin && <button onClick={() => openM("cust")} style={HB()}>客戶</button>}
        {isAdmin && <button onClick={() => openM("cfg")} style={HB()}>系統</button>}
        <button onClick={() => setSession(null)} style={HB()}>登出</button>
      </div>
    </div>
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
      <div style={{ display: "flex", gap: 10, borderBottom: "2px solid #ddd", marginBottom: 15 }}>
        <button onClick={() => setTab("schedule")} style={{ padding: 10, background: "none", border: "none", fontWeight: tab === "schedule" ? 800 : 500, borderBottom: tab === "schedule" ? "3px solid #0e7490" : "none" }}>排程總覽</button>
        <button onClick={() => setTab("today")} style={{ padding: 10, background: "none", border: "none", fontWeight: tab === "today" ? 800 : 500, borderBottom: tab === "today" ? "3px solid #0e7490" : "none" }}>今日行程</button>
      </div>
      {tab === "schedule" && <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <button onClick={() => shiftW(-1)}>◀</button><b>{fmt(weekDates[0])} - {fmt(weekDates[6])}</b><button onClick={() => shiftW(1)}>▶</button>
          {canEdit && <button onClick={() => { setEditing({ task: null }); openM("task"); }} style={S.b("#0e7490")}>+ 新增單次</button>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 5 }}>
          {weekDates.map((date, i) => { const dt = tfd(date); return <div key={date} style={{ background: "#fff", borderRadius: 8, padding: 8, minHeight: 150 }}>
            <div style={{ textAlign: "center", borderBottom: "1px solid #eee", paddingBottom: 5, marginBottom: 5 }}>
              <div style={{ fontSize: 10, color: "#999" }}>週{DN[i]}</div><div style={{ fontSize: 16, fontWeight: 900 }}>{new Date(date).getDate()}</div>
              <button onClick={() => { setEditing({ prefillDate: date }); openM("task"); }} style={{ border: "none", background: "none", color: "#0ea5e9" }}>+</button>
            </div>
            {dt.map(t => <div key={t.id} style={{ fontSize: 10, background: gS(t.serviceType).bg, borderLeft: "2px solid " + gS(t.serviceType).color, padding: 3, marginBottom: 2, borderRadius: 3 }}>
              <b>{t.time}</b> {gC(t.customerId)?.name}</div>)}
          </div>; })}
        </div>
      </div>}
      {tab === "today" && technicians.filter(t => visTechs.includes(t.id)).map(tech => <div key={tech.id} style={{ background: "#fff", padding: 15, borderRadius: 10, marginBottom: 10 }}>
        <div style={{ fontWeight: 800, borderBottom: "1px solid #eee", paddingBottom: 5 }}>{tech.name}</div>
        {tfd(td()).filter(t => t.techId === tech.id).map(task => <TaskCard key={task.id} task={task} date={td()} />)}
      </div>)}
    </div>

    <Modal open={modals.task} onClose={() => closeM("task")} title="排程編輯">
      <div style={S.f}><label style={S.l}>客戶</label><select style={S.s} value={editing.task?.customerId || ""} onChange={e => setEditing({ ...editing, task: { ...editing.task, customerId: e.target.value } })}>{customers.filter(c => c.active).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      <div style={S.f}><label style={S.l}>日期</label><input type="date" style={S.i} value={editing.task?.date || editing.prefillDate || td()} onChange={e => setEditing({ ...editing, task: { ...editing.task, date: e.target.value } })} /></div>
      <div style={S.f}><label style={S.l}>時間</label><input type="time" style={S.i} value={editing.task?.time || "09:00"} onChange={e => setEditing({ ...editing, task: { ...editing.task, time: e.target.value } })} /></div>
      <button onClick={() => { 
        const nt = { ...editing.task, id: editing.task?.id || uid(), date: editing.task?.date || editing.prefillDate || td(), time: editing.task?.time || "09:00", techId: editing.task?.techId || session.techId || technicians[0].id };
        upd("tasks", p => editing.task?.id ? p.map(x => x.id === nt.id ? nt : x) : [...p, nt]); closeM("task");
      }} style={S.b("#0e7490", "#fff")}>儲存</button>
    </Modal>
    <Modal open={modals.rpt} onClose={() => closeM("rpt")} title="現場回報">
      <textarea style={{ ...S.i, height: 100 }} value={data.reports[editing.tKey]?.text || ""} onChange={e => upd("reports", p => ({ ...p, [editing.tKey]: { text: e.target.value } }))} />
      <button onClick={() => closeM("rpt")} style={S.b("#16a34a", "#fff")}>送出</button>
    </Modal>
    <Modal open={modals.tech} onClose={() => closeM("tech")} title="技師管理">
       {technicians.map((t, i) => <div key={t.id} style={{ display: "flex", gap: 5, marginBottom: 5 }}>
         <button onClick={() => upd("technicians", p => mv(p, i, i - 1))}>🔼</button>
         <input style={S.i} value={t.name} onChange={e => upd("technicians", p => p.map(x => x.id === t.id ? { ...x, name: e.target.value } : x))} />
         <label><input type="checkbox" checked={t.isAdmin} onChange={e => upd("technicians", p => p.map(x => x.id === t.id ? { ...x, isAdmin: e.target.checked } : x))} /> 管理</label>
       </div>)}
       <button onClick={() => upd("technicians", p => [...p, { id: uid(), name: "新技師", pin: "0000", active: true }])}>+ 新技師</button>
    </Modal>
    <Modal open={modals.cust} onClose={() => closeM("cust")} title="客戶管理">
       <input type="file" onChange={e => importCSV(e.target.files[0])} /> {importMsg}
       {customers.map((c, i) => <div key={c.id} style={{ display: "flex", gap: 5, marginBottom: 5 }}>
         <button onClick={() => upd("customers", p => mv(p, i, i - 1))}>🔼</button>
         <div style={{ flex: 1 }}>{c.name}</div>
         <label><input type="checkbox" checked={c.active} onChange={e => upd("customers", p => p.map(x => x.id === c.id ? { ...x, active: e.target.checked } : x))} /> 啟用</label>
       </div>)}
    </Modal>
    <Modal open={modals.cfg} onClose={() => closeM("cfg")} title="系統設定">
       <input style={S.i} value={appName} onChange={e => upd("appName", e.target.value)} />
       <label>更換 Logo</label><input type="file" onChange={e => { const f = e.target.files[0]; const r = new FileReader(); r.onload = ev => upd("logo", ev.target.result); r.readAsDataURL(f); }} />
    </Modal>
  </div>;
}