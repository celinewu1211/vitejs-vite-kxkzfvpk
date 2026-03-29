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
  } catch { return null; } 
};

// 雲端存檔
const saveDB = async (d) => { 
  try { 
    const { error } = await supabase.from('app_data').upsert({ id: SKEY, data: d, updated_at: new Date().toISOString() });
    if (error) throw error;
    return true; 
  } catch { return false; } 
};

// --- 你喜歡的 AOT 預設資料格式 ---
const INIT_AOT = {
  appName: "AOT排班系統",
  adminLabel: "Celine",
  logo: "",
  adminPin: "0000",
  serviceTypes: [
    { id: "mt", label: "定期保養", color: "#2563eb", bg: "#eff6ff" },
    { id: "cl", label: "清洗服務", color: "#a21caf", bg: "#fdf4ff" },
    { id: "eg", label: "工程施作", color: "#0e7490", bg: "#ecfeff" },
    { id: "ur", label: "臨時急件", color: "#dc2626", bg: "#fef2f2" }
  ],
  technicians: [
    { id: "9mt6dztf", name: "Sam", pin: "0000", canEdit: true, isAdmin: true, active: true },
    { id: "n1zposo1", name: "阿肥", pin: "1111", canEdit: true, isAdmin: false, active: true }
  ],
  customers: [], tasks: [], recurring: [], reports: {}
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
  const [acc, setAcc] = useState(""); const [pin, setPin] = useState(""); const [err, setErr] = useState("");
  const tryLogin = () => {
    const inputAcc = acc.trim().toLowerCase();
    if (inputAcc === "admin" || inputAcc === adminLabel.toLowerCase() || inputAcc === "celine") {
      if (pin === adminPin) onLogin({ role: "admin" }); else setErr("密碼錯誤");
    } else {
      const t = techs.find(x => x.name.toLowerCase() === inputAcc);
      if (t && t.active !== false && t.pin === pin) onLogin({ role: "tech", techId: t.id });
      else setErr("帳號錯誤或密碼錯誤");
    }
  };
  return <div style={{ fontFamily: "'Noto Sans TC',sans-serif", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0c4a6e" }}>
    <div style={{ background: "#fff", borderRadius: 18, padding: "32px 28px", width: 340, boxShadow: "0 24px 60px rgba(0,0,0,0.3)" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        {logo && <img src={logo} style={{ maxHeight: 60, marginBottom: 12, borderRadius: 8 }} />}