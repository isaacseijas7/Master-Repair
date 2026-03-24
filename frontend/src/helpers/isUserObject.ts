import { type User } from "@/types";

export function isUserObject(user: User | string): user is User {
  return typeof user === "object" && user !== null && "firstName" in user;
}
