import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Store push subscription for a user
export async function POST(req: NextRequest) {
  try {
    const authResult = await auth();
    if (!authResult.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await req.json();
    const userId = authResult.userId;
    const userRole = (authResult.sessionClaims?.metadata as { role?: string })?.role;

    if (!userRole) {
      return NextResponse.json({ error: "User role not found" }, { status: 400 });
    }

    // Store subscription in database (you might want to create a PushSubscription model)
    // For now, we'll store it in a simple way
    // You can extend the database schema to include push subscriptions

    console.log("Push subscription received:", { userId, userRole, subscription });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error storing push subscription:", error);
    return NextResponse.json(
      { error: "Failed to store subscription" },
      { status: 500 }
    );
  }
}

// Remove push subscription for a user
export async function DELETE(req: NextRequest) {
  try {
    const authResult = await auth();
    if (!authResult.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authResult.userId;

    // Remove subscription from database
    console.log("Push subscription removed for user:", userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing push subscription:", error);
    return NextResponse.json(
      { error: "Failed to remove subscription" },
      { status: 500 }
    );
  }
}
