import { NextResponse } from "next/server"
import {
  getBillingStatus,
  getPlans,
} from "@/lib/billing"

export async function GET() {
  return NextResponse.json({
    success: true,
    billing: getBillingStatus(),
    plans: getPlans(),
  })
}