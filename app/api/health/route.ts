import { NextResponse } from "next/server";
import { config } from "@/lib/config/env";
export function GET() { return NextResponse.json({ status:"ok", environment:config.app.environment, version:process.env.BUILD_VERSION??"unknown" }); }
