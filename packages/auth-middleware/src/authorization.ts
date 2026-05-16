import type { JwtPayload } from "./types.js";

export function hasVerifiedHostAccess(payload: JwtPayload) {
  return payload.role === "ADMIN" || (payload.role === "HOST" && payload.hostVerified === true);
}
