import { type Supplier } from "@/types";

export function isSupplierObject(
  supplier: Supplier | string | undefined,
): supplier is Supplier {
  return (
    typeof supplier === "object" && supplier !== null && "name" in supplier
  );
}
