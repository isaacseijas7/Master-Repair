import { type Product } from "@/types";

export function isProductObject(product: Product | string): product is Product {
  return typeof product === "object" && product !== null && "name" in product;
}
