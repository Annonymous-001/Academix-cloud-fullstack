import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserNotifications, getUnreadNotificationCount } from "@/lib/actions";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await auth();
    if (!authResult.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const countOnly = searchParams.get("count") === "true";

    if (countOnly) {
      const result = await getUnreadNotificationCount();
      return NextResponse.json(result);
    }

    const result = await getUserNotifications(limit, offset);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in notifications API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
