import { useState, useEffect, useCallback, useRef } from "react";
import * as Papa from "papaparse";
import { createClient } from '@supabase/supabase-js';

// --- Supabase 連線設定 ---
const supabaseUrl = 'https://gsrhvjxodnjsqaosgegl.supabase.co';
const supabaseKey = 'sb_publishable_n23wUeYIP_WCd1PUbrCmeg_1zbJwqSp';
const supabase = createClient(supabaseUrl, supabaseKey);
const SKEY = "main"; 

const loadDB = async () => { 
  try { 
    const { data, error } = await supabase.from('app_data').select('data').eq( 'id', SKEY).single();
    if (error) throw error;
    return data ? data.data : null;
  } catch { return null; } 
};

const saveDB = async (d) => { 
  try { 
    const { error } = await supabase.from('app_data').upsert({ id: SKEY, data: d, updated_at: new Date().toISOString() });
    if (error) throw error;
    return true; 
  } catch { return false; } 
};

const td = () => new Date().toISOString().split("T")[0];
const uid = () => Math.random().toString(36).slice(2, 10);
const HB = () => ({ background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.2)", color: "#fff", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 10, fontWeight: 600 });
const S = {
  i: { width: "100%", padding: "8px 10px", border: "1.5px solid #cbd5e1", borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  l: { display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 3 },
  b: (bg, c) => ({ padding: "8px 14px", background: bg, color: c || "#fff", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }),
  f: { marginBottom: 12 },
};

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,20,40,.45)", backdropFilter: "blur(3px)" }} onClick={onClose}>
    <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: "22px 24px", width: 450, maxWidth: "94vw", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,40,80,.18)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><h3 style={{ margin: 0, fontSize: 16 }}>{title}</h3><button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#94a3b8" }}>×</button></div>
      {children}
    </div></div>;
}

function Login({ techs, adminPin, adminLabel, appName, logo, onLogin }) {
  const [acc, setAcc] = useState(""); const [pin, setPin] = useState(""); const [err, setErr] = useState(""); const [showF, setShowF] = useState(false);
  const tryLogin = () => {
    const inputAcc = acc.trim().toLowerCase();
    if (inputAcc === "admin" || inputAcc === adminLabel.toLowerCase()) {
      if (pin === adminPin) onLogin({ role: "admin" }); else setErr("密碼錯誤");
    } else {
      const t = techs.find(x => x.name.toLowerCase() === inputAcc);
      if (t && t.pin === pin) onLogin({ role: "tech", techId: t.id });
      else setErr("帳號或密碼錯誤");
    }
  };
  return <div style={{ fontFamily: "'Noto Sans TC',sans-serif", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0c4a6e" }}>
    <div style={{ background: "#fff", borderRadius: 18, padding: "32px 28px", width: 340, boxShadow: "0 24px 60px rgba(0,0,0,0.3)" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        {logo && <img src={logo} style={{ maxHeight: 60, marginBottom: 12, borderRadius: 8 }} />}
        <div style={{ fontSize: 20, fontWeight: 900, color: "#0c4a6e" }}>{appName}</div>
      </div>
      <div style={S.f}><label style={S.l}>帳號</label><input style={S.i} value={acc} onChange={e => setAcc(e.target.value)} placeholder="admin 或 姓名" /></div>
      <div style={S.f}><label style={S.l}>PIN 碼</label><input type="password" style={{ ...S.i, letterSpacing: 4 }} value={pin} onChange={e => setPin(e.target.value)} onKeyDown={e => e.key === "Enter" && tryLogin()} /></div>
      {err && <div style={{ color: "#dc2626", fontSize: 12, marginBottom: 12, textAlign: "center" }}>{err}</div>}
      <button onClick={tryLogin} style={{ ...S.b("#0e7490"), width: "100%", justifyContent: "center" }}>登入</button>
      <button onClick={() => setShowF(true)} style={{ background: "none", border: "none", width: "100%", marginTop: 15, fontSize: 11, color: "#94a3b8", textDecoration: "underline", cursor: "pointer" }}>忘記密碼？</button>
    </div>
    <Modal open={showF} onClose={() => setShowF(false)} title="忘記密碼">
        <p style={{ fontSize: 14 }}>請聯繫管理員 <b>{adminLabel}</b> 為您重設 4 位數 PIN 碼。</p>
        <button onClick={() => setShowF(false)} style={S.b("#0e7490")}>確定</button>
    </Modal>
  </div>;
}

export default function App() {
  const [data, setData] = useState(null); const [session, setSession] = useState(null); const [tab, setTab] = useState("schedule");
  const [saveStatus, setSaveStatus] = useState(""); const [modals, setModals] = useState({}); const [editing, setEditing] = useState({});
  const ready = useRef(false);

  useEffect(() => { loadDB().then(d => { setData(d); setTimeout(() => { ready.current = true; }, 500); }); }, []);
  useEffect(() => { if (ready.current && data) { 
    setSaveStatus("saving");
    saveDB(data).then(ok => { setSaveStatus(ok ? "saved" : "error"); setTimeout(() => setSaveStatus(""), 3000); });
  } }, [data]);

  if (!data) return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>連線中...</div>;
  if (!session) return <Login techs={data.technicians} adminPin={data.adminPin} adminLabel={data.adminLabel} appName={data.appName} logo={data.logo} onLogin={setSession} />;

  const isAdmin = session.role === "admin" || data.technicians.find(t => t.id === session.techId)?.isAdmin;
  const upd = (k, v) => setData(p => ({ ...p, [k]: typeof v === 'function' ? v(p[k]) : v }));

  return <div style={{ fontFamily: "'Noto Sans TC',sans-serif", background: "#f0f9ff", minHeight: "100vh" }}>
    {saveStatus && <div style={{ position: "fixed", bottom: 12, right: 12, zIndex: 2000, padding: "8px 14px", borderRadius: 8, fontSize: 12, background: "#fff", border: "1px solid #ddd" }}>
      {saveStatus === "saving" ? "🔄 同步中..." : saveStatus === "saved" ? "✅ 同步完成" : "❌ 同步失敗"}
    </div>}
    
    <div style={{ background: "linear-gradient(135deg,#0c4a6e,#0e7490)", padding: "12px 18px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{data.logo && <img src={data.logo} style={{ height: 24 }} />} <b>{data.appName}</b></div>
      <div style={{ display: "flex", gap: 5 }}>
        {isAdmin && <button onClick={() => setModals({ tech: true })} style={HB()}>技師管理</button>}
        {isAdmin && <button onClick={() => setModals({ cfg: true })} style={HB()}>系統設定</button>}
        <button onClick={() => setSession(null)} style={HB()}>登出</button>
      </div>
    </div>

    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 20 }}>
       {/* 這裡可以依序加入你的排程 UI */}
       <p>目前系統已採用 AOT 版本格式，您可以開始操作。</p>
    </div>

    {/* 技師指派密碼彈窗 */}
    <Modal open={modals.tech} onClose={() => setModals({})} title="技師管理與密碼指派">
       {data.technicians.map((t, idx) => (
         <div key={t.id} style={{ border: "1px solid #eee", padding: 10, borderRadius: 8, marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input style={{ ...S.i, flex: 2 }} value={t.name} onChange={e => {
                const n = [...data.technicians]; n[idx].name = e.target.value;
                upd("technicians", n);
              }} />
              <input style={{ ...S.i, flex: 1 }} placeholder="PIN" value={t.pin} onChange={e => {
                const n = [...data.technicians]; n[idx].pin = e.target.value.replace(/\D/g,'');
                upd("technicians", n);
              }} />
            </div>
            <label style={{ fontSize: 12 }}><input type="checkbox" checked={t.isAdmin} onChange={e => {
              const n = [...data.technicians]; n[idx].isAdmin = e.target.checked;
              upd("technicians", n);
            }} /> 管理員權限</label>
         </div>
       ))}
       <button onClick={() => setModals({})} style={S.b("#0e7490")}>關閉並儲存</button>
    </Modal>

    {/* 系統與備份彈窗 */}
    <Modal open={modals.cfg} onClose={() => setModals({})} title="系統設定">
       <div style={S.f}><label style={S.l}>系統名稱</label><input style={S.i} value={data.appName} onChange={e => upd("appName", e.target.value)} /></div>
       <div style={S.f}><label style={S.l}>Logo URL (或上傳)</label><input type="file" onChange={e => {
         const r = new FileReader(); r.onload = ev => upd("logo", ev.target.result); r.readAsDataURL(e.target.files[0]);
       }} /></div>
       <button onClick={() => {
         const b = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
         const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "backup.json"; a.click();
       }} style={S.b("#64748b")}>💾 下載 JSON 備份</button>
    </Modal>
  </div>;
}