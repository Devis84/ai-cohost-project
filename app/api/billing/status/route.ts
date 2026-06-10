
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

 import { NextResponse } from "next/server"
import {
  getBillingStatus,
  getPlans,
} from "@/lib/services/billing"

export async function GET() {
  return NextResponse.json({
    success: true,
    billing: getBillingStatus(),
    plans: getPlans(),
  })
}
