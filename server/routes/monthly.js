const express = require('express');
const router = express.Router();
const { db } = require('../database');
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);

// GET /api/monthly?month=YYYY-MM
// Auto-upserts the month, returns full tally data
router.get('/', wrap(async (req, res) => {
  const { month } = req.query;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'month query param required (YYYY-MM)' });
  }

  // Upsert month
  await db.run(`
    INSERT INTO monthly_tally (month, closing_balance)
    VALUES (?, 0)
    ON CONFLICT(month) DO NOTHING
  `, [month]);

  const tally = await db.first('SELECT * FROM monthly_tally WHERE month = ?', [month]);

  const cards = await db.all(
    'SELECT * FROM credit_card_bills WHERE month_id = ? ORDER BY due_date ASC',
    [tally.id]
  );

  const receivables = await db.all(
    "SELECT * FROM receivables WHERE status = 'PENDING' ORDER BY expected_return_date ASC"
  );

  const emis = await db.all(
    "SELECT * FROM emis WHERE status = 'ACTIVE' ORDER BY name ASC"
  );

  const totalCards = cards.reduce((sum, c) => sum + c.amount, 0);
  const totalEmiMonthly = emis.reduce((sum, e) => sum + e.monthly_amount, 0);
  const totalReceivables = receivables.reduce((sum, r) => sum + r.amount, 0);

  res.json({
    tally,
    cards,
    receivables,
    emis,
    summary: {
      totalCards,
      totalEmiMonthly,
      totalReceivables,
      netBalance: tally.closing_balance - totalCards - totalEmiMonthly,
    },
  });
}));

// POST /api/monthly — create month explicitly
router.post('/', wrap(async (req, res) => {
  const { month, closing_balance = 0 } = req.body;
  if (!month) return res.status(400).json({ error: 'month required' });

  try {
    const info = await db.run(
      'INSERT INTO monthly_tally (month, closing_balance) VALUES (?, ?)',
      [month, closing_balance]
    );
    const row = await db.first('SELECT * FROM monthly_tally WHERE id = ?', [info.lastInsertRowid]);
    res.status(201).json(row);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Month already exists' });
    }
    throw err;
  }
}));

// PUT /api/monthly/:id — update closing balance
router.put('/:id', wrap(async (req, res) => {
  const { closing_balance } = req.body;
  if (closing_balance === undefined) return res.status(400).json({ error: 'closing_balance required' });

  await db.run('UPDATE monthly_tally SET closing_balance = ? WHERE id = ?', [closing_balance, req.params.id]);
  const row = await db.first('SELECT * FROM monthly_tally WHERE id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
}));

module.exports = router;
