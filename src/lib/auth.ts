import { auth } from "@clerk/nextjs/server";

export function getUserAuth() {
  const { userId, sessionClaims } = auth();
  return {
    userId,
    role: (sessionClaims?.metadata as { role?: string })?.role,
    //dsafadsfdsaf
  };
}
