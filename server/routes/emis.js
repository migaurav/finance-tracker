const express = require('express');
const router = express.Router();
const { db } = require('../database');
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);

// GET /api/emis
router.get('/', wrap(async (req, res) => {
  const emis = await db.all('SELECT * FROM emis ORDER BY status ASC, name ASC');
  res.json(emis);
}));

// POST /api/emis
router.post('/', wrap(async (req, res) => {
  const { name, total_amount, monthly_amount, start_date, tenure_months, remaining_months } = req.body;
  if (!name || !total_amount || !monthly_amount || !start_date || !tenure_months) {
    return res.status(400).json({ error: 'name, total_amount, monthly_amount, start_date, tenure_months required' });
  }

  const rem = remaining_months !== undefined ? remaining_months : tenure_months;
  const info = await db.run(
    'INSERT INTO emis (name, total_amount, monthly_amount, start_date, tenure_months, remaining_months, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, total_amount, monthly_amount, start_date, tenure_months, rem, 'ACTIVE']
  );

  const row = await db.first('SELECT * FROM emis WHERE id = ?', [info.lastInsertRowid]);
  res.status(201).json(row);
}));

// PUT /api/emis/:id
router.put('/:id', wrap(async (req, res) => {
  const existing = await db.first('SELECT * FROM emis WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const {
    name = existing.name,
    total_amount = existing.total_amount,
    monthly_amount = existing.monthly_amount,
    start_date = existing.start_date,
    tenure_months = existing.tenure_months,
    remaining_months = existing.remaining_months,
    status = existing.status,
  } = req.body;

  await db.run(
    'UPDATE emis SET name=?, total_amount=?, monthly_amount=?, start_date=?, tenure_months=?, remaining_months=?, status=? WHERE id=?',
    [name, total_amount, monthly_amount, start_date, tenure_months, remaining_months, status, req.params.id]
  );

  res.json(await db.first('SELECT * FROM emis WHERE id = ?', [req.params.id]));
}));

// POST /api/emis/:id/pay — decrement remaining_months, auto-close at 0
router.post('/:id/pay', wrap(async (req, res) => {
  const emi = await db.first('SELECT * FROM emis WHERE id = ?', [req.params.id]);
  if (!emi) return res.status(404).json({ error: 'Not found' });
  if (emi.status === 'CLOSED') return res.status(400).json({ error: 'EMI already closed' });

  const newRemaining = Math.max(0, emi.remaining_months - 1);
  const newStatus = newRemaining === 0 ? 'CLOSED' : 'ACTIVE';

  await db.run('UPDATE emis SET remaining_months = ?, status = ? WHERE id = ?', [newRemaining, newStatus, req.params.id]);

  res.json(await db.first('SELECT * FROM emis WHERE id = ?', [req.params.id]));
}));

module.exports = router;
