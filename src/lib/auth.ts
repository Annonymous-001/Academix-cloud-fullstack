import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function getUserAuth() {
  const authResult = await auth();
  const userId = authResult.userId;
  const sessionClaims = authResult.sessionClaims;
  
  return {
    userId,
    role: (sessionClaims?.metadata as { role?: string })?.role,
  };
}

export async function checkRoleAccess(allowedRoles: string[]) {
  const { role } = await getUserAuth();
  
  if (!role || !allowedRoles.includes(role)) {
    return {
      hasAccess: false,
      response: new NextResponse(
        JSON.stringify({ error: 'Access denied' }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    };
  }
  
  return { hasAccess: true };
}

export async function withRoleCheck(allowedRoles: string[], handler: Function) {
  const { hasAccess, response } = await checkRoleAccess(allowedRoles);
  
  if (!hasAccess) {
    return response;
  }
  
  return handler();
}
