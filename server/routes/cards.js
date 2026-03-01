const express = require('express');
const router = express.Router();
const { db } = require('../database');
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);

// POST /api/cards
router.post('/', wrap(async (req, res) => {
  const { month_id, card_name, amount, due_date, status = 'UNPAID' } = req.body;
  if (!month_id || !card_name || amount === undefined) {
    return res.status(400).json({ error: 'month_id, card_name, amount required' });
  }

  const info = await db.run(
    'INSERT INTO credit_card_bills (month_id, card_name, amount, due_date, status) VALUES (?, ?, ?, ?, ?)',
    [month_id, card_name, amount, due_date || null, status]
  );

  const row = await db.first('SELECT * FROM credit_card_bills WHERE id = ?', [info.lastInsertRowid]);
  res.status(201).json(row);
}));

// PUT /api/cards/:id
router.put('/:id', wrap(async (req, res) => {
  const { card_name, amount, due_date, status } = req.body;
  const existing = await db.first('SELECT * FROM credit_card_bills WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  await db.run(
    'UPDATE credit_card_bills SET card_name = ?, amount = ?, due_date = ?, status = ? WHERE id = ?',
    [
      card_name ?? existing.card_name,
      amount ?? existing.amount,
      due_date !== undefined ? due_date : existing.due_date,
      status ?? existing.status,
      req.params.id,
    ]
  );

  const row = await db.first('SELECT * FROM credit_card_bills WHERE id = ?', [req.params.id]);
  res.json(row);
}));

// DELETE /api/cards/:id
router.delete('/:id', wrap(async (req, res) => {
  const info = await db.run('DELETE FROM credit_card_bills WHERE id = ?', [req.params.id]);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
}));

module.exports = router;
