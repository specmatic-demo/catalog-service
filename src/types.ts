export type CatalogItem = {
  sku: string;
  name: string;
  category: string;
  available: boolean;
  listPrice: number;
};

export type CatalogAvailability = {
  sku: string;
  available: boolean;
  quantityOnHand: number;
  backorderable: boolean;
};
