const express = require('express');
const router = express.Router();
const { db } = require('../database');
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);

// GET /api/receivables
router.get('/', wrap(async (req, res) => {
  const rows = await db.all('SELECT * FROM receivables ORDER BY status ASC, expected_return_date ASC');
  res.json(rows);
}));

// POST /api/receivables
router.post('/', wrap(async (req, res) => {
  const { person_name, amount, date_given, expected_return_date } = req.body;
  if (!person_name || !amount || !date_given) {
    return res.status(400).json({ error: 'person_name, amount, date_given required' });
  }

  const info = await db.run(
    'INSERT INTO receivables (person_name, amount, date_given, expected_return_date, status) VALUES (?, ?, ?, ?, ?)',
    [person_name, amount, date_given, expected_return_date || null, 'PENDING']
  );

  res.status(201).json(await db.first('SELECT * FROM receivables WHERE id = ?', [info.lastInsertRowid]));
}));

// PUT /api/receivables/:id
router.put('/:id', wrap(async (req, res) => {
  const existing = await db.first('SELECT * FROM receivables WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const {
    person_name = existing.person_name,
    amount = existing.amount,
    date_given = existing.date_given,
    expected_return_date = existing.expected_return_date,
    received_date = existing.received_date,
    status = existing.status,
  } = req.body;

  await db.run(
    'UPDATE receivables SET person_name=?, amount=?, date_given=?, expected_return_date=?, received_date=?, status=? WHERE id=?',
    [person_name, amount, date_given, expected_return_date, received_date, status, req.params.id]
  );

  res.json(await db.first('SELECT * FROM receivables WHERE id = ?', [req.params.id]));
}));

// POST /api/receivables/:id/receive — mark as received with today's date
router.post('/:id/receive', wrap(async (req, res) => {
  const existing = await db.first('SELECT * FROM receivables WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (existing.status === 'RECEIVED') return res.status(400).json({ error: 'Already received' });

  const received_date = req.body.received_date || new Date().toISOString().split('T')[0];

  await db.run("UPDATE receivables SET status='RECEIVED', received_date=? WHERE id=?", [received_date, req.params.id]);

  res.json(await db.first('SELECT * FROM receivables WHERE id = ?', [req.params.id]));
}));

module.exports = router;
