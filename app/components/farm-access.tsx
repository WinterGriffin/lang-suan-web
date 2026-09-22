"use client";
import { useEffect,useState } from "react";
import { createClient } from "@/lib/supabase/client";
export function FarmAccess(){const [state,setState]=useState<"loading"|"empty"|"error"|"ready">("loading");useEffect(()=>{createClient().from("farms").select("id").then(({data,error})=>setState(error?"error":data?.length?"ready":"empty"))},[]);if(state==="loading")return <p className="muted">กำลังโหลดข้อมูล…</p>;if(state==="error")return <p className="form-error">โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่</p>;if(state==="empty")return <p className="muted">ยังไม่มีฟาร์มที่คุณมีสิทธิ์ ติดต่อผู้ดูแลฟาร์ม</p>;return null}
