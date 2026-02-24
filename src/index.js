'use strict';

const express = require('express');

const app = express();
const host = process.env.CATALOG_HOST || '0.0.0.0';
const port = Number.parseInt(process.env.CATALOG_PORT || '9000', 10);

const catalog = [
  { sku: 'SKU-IPHONE', name: 'iPhone 15', category: 'Phones', available: true, listPrice: 799.0 },
  { sku: 'SKU-PIXEL', name: 'Pixel 8', category: 'Phones', available: true, listPrice: 699.0 },
  { sku: 'SKU-HEADPHONE', name: 'Noise Cancelling Headphones', category: 'Audio', available: false, listPrice: 199.0 }
];

app.get('/catalog/items', (req, res) => {
  const { category, q } = req.query;
  const rawLimit = Number.parseInt(String(req.query.limit || '20'), 10);
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(100, rawLimit)) : 20;

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

app.get('/catalog/items/:sku', (req, res) => {
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
