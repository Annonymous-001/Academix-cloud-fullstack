import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { jwtDecode }from "jwt-decode";

export async function POST(req: Request) {
  try {
    const { getToken } = auth();
    const token = await getToken({ template: "neon" }); // Fetch JWT

    if (!token) {
      console.error("❌ Failed to retrieve token");
      return NextResponse.json({ error: "Failed to retrieve token" }, { status: 401 });
    }

    console.log("✅ New JWT Token:", token); // Log token

    const response = NextResponse.json({ success: true, token });

    // Store JWT in a secure cookie
    response.cookies.set("__session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("❌ Error fetching or setting token:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const token = req.headers.get("cookie")?.split("__session=")[1]?.split(";")[0];

    if (!token) {
      return NextResponse.json({ error: "No token found in cookies" }, { status: 401 });
    }

    // Decode JWT token to extract details
    const decoded: any = jwtDecode(token);

    return NextResponse.json({
      success: true,
      token,
      issuedAt: new Date(decoded.iat * 1000).toISOString(),
      expiresAt: new Date(decoded.exp * 1000).toISOString(),
      payload: decoded,
    });
  } catch (error) {
    console.error("❌ Error decoding token:", error);
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
  }
}
