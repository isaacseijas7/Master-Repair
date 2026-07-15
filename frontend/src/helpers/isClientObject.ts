import { type Client } from "@/types";

export function isClientObject(
  client: Client | string | undefined,
): client is Client {
  return typeof client === "object" && client !== null && "name" in client;
}