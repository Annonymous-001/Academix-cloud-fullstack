import { auth } from "@clerk/nextjs/server";

export async function getUserAuth() {
  const authResult = await auth();
  const userId = authResult.userId;
  const sessionClaims = authResult.sessionClaims;
  
  return {
    userId,
    role: (sessionClaims?.metadata as { role?: string })?.role,
  };
}
