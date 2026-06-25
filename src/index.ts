import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Request, type Response } from 'express';
import { buildSchema } from 'graphql';
import { createHandler } from 'graphql-http/lib/use/express';
import type { CatalogAvailability, CatalogItem } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, '..', 'specs', 'schema.graphql');
const schemaSource = fs.readFileSync(schemaPath, 'utf8');
const schema = buildSchema(schemaSource);

const app = express();
const host = process.env.CATALOG_HOST || '0.0.0.0';
const port = Number.parseInt(process.env.CATALOG_PORT || '9000', 10);

const catalog: CatalogItem[] = [
  { sku: 'SKU-IPHONE', name: 'iPhone 15', category: 'Phones', available: true, listPrice: 799.0 },
  { sku: 'SKU-PIXEL', name: 'Pixel 8', category: 'Phones', available: true, listPrice: 699.0 },
  { sku: 'SKU-HEADPHONE', name: 'Noise Cancelling Headphones', category: 'Audio', available: false, listPrice: 199.0 }
];

const availabilityBySku: Record<string, CatalogAvailability> = {
  'SKU-IPHONE': { sku: 'SKU-IPHONE', available: true, quantityOnHand: 12, backorderable: false },
  'SKU-PIXEL': { sku: 'SKU-PIXEL', available: true, quantityOnHand: 7, backorderable: false },
  'SKU-HEADPHONE': { sku: 'SKU-HEADPHONE', available: false, quantityOnHand: 0, backorderable: true }
};

function fallbackCatalogItemForSku(sku: string): CatalogItem {
  return {
    sku,
    name: `Catalog item ${sku}`,
    category: 'General',
    available: true,
    listPrice: 99.0
  };
}

function catalogItemsForQuery(category: string | undefined, q: string | undefined, limit: number): CatalogItem[] {
  let items = [...catalog];

  if (typeof category === 'string' && category.trim()) {
    items = items.filter((item) => item.category.toLowerCase().includes(category.toLowerCase()));
  }

  if (typeof q === 'string' && q.trim()) {
    items = items.filter((item) => item.name.toLowerCase().includes(q.toLowerCase()) || item.sku.toLowerCase().includes(q.toLowerCase()));
  }

  if (items.length === 0) {
    items = catalog;
  }

  return items.slice(0, limit);
}

const rootValue = {
  catalogItems: ({ category, limit = 20 }: { category?: string | null; limit?: number | null }) => {
    const parsedLimit = Number.parseInt(String(limit), 10);
    const safeLimit = Number.isFinite(parsedLimit)
      ? Math.min(100, Math.max(1, parsedLimit))
      : 20;

    return catalogItemsForQuery(category ?? undefined, undefined, safeLimit);
  },
  catalogItemBySku: ({ sku }: { sku: string }) => {
    return catalog.find((entry) => entry.sku === sku) || fallbackCatalogItemForSku(sku);
  }
};

app.get('/catalog/items', (req: Request, res: Response) => {
  const { category, q } = req.query;
  let limit = 20;

  if (typeof req.query.limit !== 'undefined') {
    const limitParam = req.query.limit;
    if (typeof limitParam !== 'string' || !/^\d+$/.test(limitParam)) {
      res.status(400).json({ message: 'limit must be an integer between 1 and 100' });
      return;
    }

    const parsedLimit = Number.parseInt(limitParam, 10);
    if (parsedLimit < 1 || parsedLimit > 100) {
      res.status(400).json({ message: 'limit must be an integer between 1 and 100' });
      return;
    }

    limit = parsedLimit;
  }

  const categoryValue = typeof category === 'string' ? category : undefined;
  const queryValue = typeof q === 'string' ? q : undefined;
  res.status(200).json(catalogItemsForQuery(categoryValue, queryValue, limit));
});

app.get('/catalog/items/:sku', (req: Request, res: Response) => {
  const item = catalog.find((entry) => entry.sku === req.params.sku);
  if (item) {
    res.status(200).json(item);
    return;
  }

  res.status(200).json(fallbackCatalogItemForSku(req.params.sku));
});

app.get('/catalog/items/:sku/availability', (req: Request, res: Response) => {
  const { sku } = req.params;
  const availability = availabilityBySku[sku];
  if (availability) {
    res.status(200).json(availability);
    return;
  }

  res.status(200).json({
    sku,
    available: true,
    quantityOnHand: 5,
    backorderable: false
  });
});

app.get('/catalog/categories', (_req: Request, res: Response) => {
  const categories = Array.from(new Set(catalog.map((item) => item.category)));
  res.status(200).json(categories);
});

app.use(
  '/graphql',
  createHandler({
    schema,
    rootValue
  })
);

app.listen(port, host, () => {
  console.log(`catalog-service listening on http://${host}:${port}`);
});
