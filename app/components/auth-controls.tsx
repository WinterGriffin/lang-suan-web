"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
export function LogoutButton(){const router=useRouter();return <button className="profile-button" onClick={async()=>{await createClient().auth.signOut();router.replace("/login");router.refresh()}}>ออกจากระบบ</button>}
