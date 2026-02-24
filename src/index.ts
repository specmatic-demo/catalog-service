import express, { type Request, type Response } from 'express';

const app = express();
const host = process.env.CATALOG_HOST || '0.0.0.0';
const port = Number.parseInt(process.env.CATALOG_PORT || '9000', 10);

type CatalogItem = {
  sku: string;
  name: string;
  category: string;
  available: boolean;
  listPrice: number;
};

const catalog: CatalogItem[] = [
  { sku: 'SKU-IPHONE', name: 'iPhone 15', category: 'Phones', available: true, listPrice: 799.0 },
  { sku: 'SKU-PIXEL', name: 'Pixel 8', category: 'Phones', available: true, listPrice: 699.0 },
  { sku: 'SKU-HEADPHONE', name: 'Noise Cancelling Headphones', category: 'Audio', available: false, listPrice: 199.0 }
];

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

  res.status(200).json(items.slice(0, limit));
});

app.get('/catalog/items/:sku', (req: Request, res: Response) => {
  const item = catalog.find((entry) => entry.sku === req.params.sku);
  if (item) {
    res.status(200).json(item);
    return;
  }

  res.status(200).json({
    sku: req.params.sku,
    name: `Catalog item ${req.params.sku}`,
    category: 'General',
    available: true,
    listPrice: 99.0
  });
});

app.listen(port, host, () => {
  console.log(`catalog-service listening on http://${host}:${port}`);
});
