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
    const { data, error } = await supabase.from('app_data').select('data').eq('id', SKEY).single();
    if (error) throw error;
    return data ? data.data : null;
  } catch (e) { return null; } 
};

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

const CSS = "@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700;900&display=swap');*{box-sizing:border-box}input:focus,select:focus,textarea:focus{border-color:#0ea5e9!important;box-shadow:0 0 0 3px rgba(14,165,233,.12)}";
const DN = ["一", "二", "三", "四", "五", "六", "日"];
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
    <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: "22px 24px", width: 420, maxWidth: "94vw", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,40,80,.18)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{title}</h3><button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>×</button></div>
      {children}
    </div></div>;
}

function Login({ techs, adminPin, adminLabel, appName, logo, onLogin }) {
  const [acc, setAcc] = useState(""); const [pin, setPin] = useState(""); const [err, setErr] = useState(""); const [showForgot, setShowForgot] = useState(false);
  const tryLogin = () => {
    const inputAcc = acc.trim().toLowerCase();
    const isAdminAcc = (inputAcc === "admin" || inputAcc === adminLabel.toLowerCase() || inputAcc === "管理員");
    if (isAdminAcc) {
      if (pin === adminPin) onLogin({ role: "admin" }); else setErr("密碼錯誤");
    } else {
      const t = techs.find(x => x.name.toLowerCase() === inputAcc || x.id.toLowerCase() === inputAcc);
      if (t && t.active !== false && t.pin === pin) onLogin({ role: "tech", techId: t.id });
      else setErr("帳號錯誤或已停用");
    }
  };
  return <div style={{ fontFamily: "'Noto Sans TC',sans-serif", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg,#0c4a6e,#0e7490)" }}><style>{CSS}</style>
    <div style={{ background: "#fff", borderRadius: 18, padding: "32px 28px", width: 340, maxWidth: "92vw", boxShadow: "0 24px 60px rgba(0,30,60,.25)" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        {logo && <img src={logo} alt="Logo" style={{ maxHeight: 60, maxWidth: "100%", marginBottom: 12, borderRadius: 8 }} />}
        <div style={{ fontSize: 20, fontWeight: 900, color: "#0c4a6e" }}>{appName}</div>
      </div>
      <div style={S.f}><label style={S.l}>帳號 (不分大小寫)</label><input style={S.i} value={acc} onChange={e => setAcc(e.target.value)} placeholder="admin 或 姓名" /></div>
      <div style={S.f}><label style={S.l}>PIN 碼</label><input type="password" style={{ ...S.i, letterSpacing: 4 }} value={pin} onChange={e => setPin(e.target.value)} onKeyDown={e => e.key === "Enter" && tryLogin()} placeholder="••••" /></div>
      {err && <div style={{ color: "#dc2626", fontSize: 12, marginBottom: 12, textAlign: "center" }}>{err}</div>}
      <button onClick={tryLogin} style={{ ...S.b("#0e7490"), width: "100%", justifyContent: "center" }}>登入</button>
      <div style={{ textAlign: "center", marginTop: 14 }}><button onClick={() => setShowForgot(true)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#94a3b8", textDecoration: "underline" }}>忘記密碼？</button></div>
    </div>
    <Modal open={showForgot} onClose={() => setShowForgot(false)} title="忘記密碼說明">
      <p style={{ fontSize: 14, lineHeight: 1.6, color: "#475569" }}>如果您忘記了登入密碼，請聯繫<b>「系統管理員」</b>。<br/><br/>管理員可以進入「技師管理」介面，直接為您指派並修改新的 4 位數 PIN 碼。</p>
      <button onClick={() => setShowForgot(false)} style={{ ...S.b("#0e7490"), width: "100%", justifyContent: "center" }}>我了解了</button>
    </Modal>
  </div>;
}

export default function App() {
  const [data, setData] = useState(null); const [session, setSession] = useState(null); const [tab, setTab] = useState("schedule");
  const [modals, setModals] = useState({}); const [saveStatus, setSaveStatus] = useState("");
  
  useEffect(() => { loadDB().then(d => { setData(d || INIT); }); }, []);

  const triggerSave = async (newData) => {
    setSaveStatus("saving");
    const ok = await saveDB(newData || data);
    setSaveStatus(ok ? "saved" : "error");
    setTimeout(() => setSaveStatus(""), 3000);
  };

  const downloadBackup = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `backup_${td()}.json`; a.click();
  };

  if (!data) return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>載入中...</div>;
  if (!session) return <Login techs={data.technicians} adminPin={data.adminPin} adminLabel={data.adminLabel} appName={data.appName} logo={data.logo} onLogin={setSession} />;

  const isAdmin = session.role === "admin" || data.technicians.find(t => t.id === session.techId)?.isAdmin;

  return <div style={{ fontFamily: "'Noto Sans TC',sans-serif", background: "#f0f9ff", minHeight: "100vh" }}><style>{CSS}</style>
    {saveStatus && <div style={{ position: "fixed", bottom: 12, right: 12, zIndex: 2000, padding: "8px 14px", borderRadius: 8, fontSize: 12, background: "#fff", border: "1px solid #ddd", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
      {saveStatus === "saving" && "🔄 儲存中..."}{saveStatus === "saved" && "✅ 已存至雲端"}{saveStatus === "error" && "❌ 儲存失敗"}</div>}
    
    <div style={{ background: "linear-gradient(135deg,#0c4a6e,#0e7490)", padding: "12px 18px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ fontWeight: 800 }}>{data.appName}</div>
      <div style={{ display: "flex", gap: 5 }}>
        {isAdmin && <button onClick={() => setModals({ tech: true })} style={HB()}>技師管理</button>}
        {isAdmin && <button onClick={() => setModals({ cfg: true })} style={HB()}>系統設定</button>}
        <button onClick={() => setSession(null)} style={HB()}>登出</button>
      </div>
    </div>

    <div style={{ textAlign: "center", padding: 40 }}>
      <h3>歡迎回來，{session.role === "admin" ? "管理員" : data.technicians.find(t => t.id === session.techId)?.name}</h3>
      <p>排班系統運行中...</p>
    </div>

    {/* 技師管理彈窗 */}
    <Modal open={modals.tech} onClose={() => setModals({})} title="技師帳號與密碼指派">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {data.technicians.map((t, idx) => (
          <div key={t.id} style={{ padding: 10, border: "1px solid #e2e8f0", borderRadius: 8 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1 }}><label style={S.l}>姓名</label>
                <input style={S.i} value={t.name} onChange={e => {
                  const n = [...data.technicians]; n[idx].name = e.target.value;
                  setData({ ...data, technicians: n });
                }} />
              </div>
              <div style={{ width: 80 }}><label style={S.l}>PIN 碼</label>
                <input style={S.i} maxLength={4} value={t.pin} onChange={e => {
                  const n = [...data.technicians]; n[idx].pin = e.target.value.replace(/\D/g,'');
                  setData({ ...data, technicians: n });
                }} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ fontSize: 12 }}><input type="checkbox" checked={t.active} onChange={e => {
                const n = [...data.technicians]; n[idx].active = e.target.checked;
                setData({ ...data, technicians: n });
              }} /> 啟用帳號</label>
              <button onClick={() => triggerSave()} style={S.b("#16a34a")}>單獨儲存此技師</button>
            </div>
          </div>
        ))}
        <button onClick={() => {
          const newList = [...data.technicians, { id: uid(), name: "新技師", pin: "1234", active: true, isAdmin: false }];
          setData({ ...data, technicians: newList });
        }} style={S.b("#0e7490")}>+ 新增技師欄位</button>
        <hr/>
        <button onClick={() => { triggerSave(); setModals({}); }} style={{ ...S.b("#0c4a6e"), padding: 12, justifyContent: "center" }}>儲存並關閉</button>
      </div>
    </Modal>

    {/* 系統設定彈窗 */}
    <Modal open={modals.cfg} onClose={() => setModals({})} title="系統進階設定">
      <div style={S.f}><label style={S.l}>系統名稱</label>
        <input style={S.i} value={data.appName} onChange={e => setData({ ...data, appName: e.target.value })} />
      </div>
      <div style={S.f}><label style={S.l}>管理員 PIN 碼 (admin)</label>
        <input style={S.i} value={data.adminPin} onChange={e => setData({ ...data, adminPin: e.target.value })} />
      </div>
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={() => triggerSave()} style={{ ...S.b("#16a34a"), padding: 12, justifyContent: "center" }}>確認儲存所有設定</button>
        <button onClick={downloadBackup} style={{ ...S.b("#64748b"), padding: 10, justifyContent: "center" }}>💾 下載資料備份 (JSON)</button>
        <button onClick={() => setModals({})} style={{ ...S.b("#f1f5f9", "#475569"), justifyContent: "center" }}>取消</button>
      </div>
    </Modal>
  </div>;
}