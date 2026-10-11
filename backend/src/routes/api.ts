import { Router, Request, Response } from 'express';
import { db } from '../db';

export const apiRouter = Router();

// Health Check
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Thriftly Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// State Management
apiRouter.get('/state', (_req: Request, res: Response) => {
  res.json(db.getState());
});

apiRouter.post('/state/reset', (_req: Request, res: Response) => {
  const state = db.resetState();
  res.json({ success: true, message: 'Reset to demo state successful', state });
});

apiRouter.put('/state/budget', (req: Request, res: Response) => {
  const { totalBudget } = req.body;
  if (typeof totalBudget !== 'number' || totalBudget <= 0) {
    res.status(400).json({ error: 'Valid totalBudget is required' });
    return;
  }
  const state = db.updateBudget(totalBudget);
  res.json({ success: true, state });
});

apiRouter.post('/state/advance-day', (_req: Request, res: Response) => {
  const state = db.advanceDay();
  res.json({ success: true, state });
});

apiRouter.put('/state/day', (req: Request, res: Response) => {
  const { day } = req.body;
  if (typeof day !== 'number' || day < 1) {
    res.status(400).json({ error: 'Valid day is required' });
    return;
  }
  const state = db.setDay(day);
  res.json({ success: true, state });
});

// Transactions CRUD
apiRouter.get('/transactions', (_req: Request, res: Response) => {
  res.json(db.getState().transactions);
});

apiRouter.post('/transactions', (req: Request, res: Response) => {
  const { description, amount, category, day, dateStr, type, isRecurring, notes } = req.body;
  if (!description || typeof amount !== 'number' || amount <= 0) {
    res.status(400).json({ error: 'Valid description and positive amount are required' });
    return;
  }

  const transaction = db.addTransaction({
    description,
    amount,
    category: category || 'other',
    day: day || db.getState().currentDay,
    dateStr: dateStr || `Day ${day || db.getState().currentDay}`,
    type: type || 'expense',
    isRecurring: !!isRecurring,
    notes,
  });

  res.status(201).json({ success: true, transaction });
});

const getId = (req: Request): string => (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

apiRouter.put('/transactions/:id', (req: Request, res: Response) => {
  const id = getId(req);
  const updated = db.updateTransaction(id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Transaction not found' });
    return;
  }
  res.json({ success: true, transaction: updated });
});

apiRouter.delete('/transactions/:id', (req: Request, res: Response) => {
  const id = getId(req);
  const deleted = db.deleteTransaction(id);
  if (!deleted) {
    res.status(404).json({ error: 'Transaction not found' });
    return;
  }
  res.json({ success: true, id });
});

// Savings Goals CRUD
apiRouter.get('/goals', (_req: Request, res: Response) => {
  res.json(db.getState().savingsGoals);
});

apiRouter.post('/goals', (req: Request, res: Response) => {
  const { name, targetAmount, targetDay, categoryIcon, color, notes } = req.body;
  if (!name || typeof targetAmount !== 'number' || targetAmount <= 0) {
    res.status(400).json({ error: 'Valid name and targetAmount are required' });
    return;
  }

  const goal = db.addGoal({
    name,
    targetAmount,
    currentAmount: 0,
    targetDay: targetDay || 30,
    categoryIcon: categoryIcon || 'ShieldCheck',
    color: color || '#10B981',
    notes,
  });

  res.status(201).json({ success: true, goal });
});

apiRouter.put('/goals/:id', (req: Request, res: Response) => {
  const id = getId(req);
  const updated = db.updateGoal(id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Goal not found' });
    return;
  }
  res.json({ success: true, goal: updated });
});

apiRouter.delete('/goals/:id', (req: Request, res: Response) => {
  const id = getId(req);
  const deleted = db.deleteGoal(id);
  if (!deleted) {
    res.status(404).json({ error: 'Goal not found' });
    return;
  }
  res.json({ success: true, id });
});

apiRouter.post('/goals/:id/deposit', (req: Request, res: Response) => {
  const id = getId(req);
  const { amount } = req.body;
  if (typeof amount !== 'number' || amount <= 0) {
    res.status(400).json({ error: 'Valid positive amount is required' });
    return;
  }

  const goal = db.contributeToGoal(id, amount);
  if (!goal) {
    res.status(404).json({ error: 'Goal not found or deposit failed' });
    return;
  }
  res.json({ success: true, goal });
});

apiRouter.post('/goals/:id/withdraw', (req: Request, res: Response) => {
  const id = getId(req);
  const { amount } = req.body;
  if (typeof amount !== 'number' || amount <= 0) {
    res.status(400).json({ error: 'Valid positive amount is required' });
    return;
  }

  const goal = db.withdrawFromGoal(id, amount);
  if (!goal) {
    res.status(400).json({ error: 'Goal not found or withdrawal amount exceeds balance' });
    return;
  }
  res.json({ success: true, goal });
});

// Commitments CRUD
apiRouter.get('/commitments', (_req: Request, res: Response) => {
  res.json(db.getState().commitments);
});

apiRouter.post('/commitments', (req: Request, res: Response) => {
  const { name, amount, category, dueDay, frequency, isSubscription, serviceProvider } = req.body;
  if (!name || typeof amount !== 'number' || amount <= 0) {
    res.status(400).json({ error: 'Valid name and positive amount are required' });
    return;
  }

  const commitment = db.addCommitment({
    name,
    amount,
    category: category || 'bills_utilities',
    dueDay: dueDay || 15,
    frequency: frequency || 'monthly',
    isPaid: false,
    isSubscription: !!isSubscription,
    serviceProvider,
  });

  res.status(201).json({ success: true, commitment });
});

apiRouter.put('/commitments/:id', (req: Request, res: Response) => {
  const id = getId(req);
  const updated = db.updateCommitment(id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Commitment not found' });
    return;
  }
  res.json({ success: true, commitment: updated });
});

apiRouter.delete('/commitments/:id', (req: Request, res: Response) => {
  const id = getId(req);
  const deleted = db.deleteCommitment(id);
  if (!deleted) {
    res.status(404).json({ error: 'Commitment not found' });
    return;
  }
  res.json({ success: true, id });
});

apiRouter.post('/commitments/:id/pay', (req: Request, res: Response) => {
  const id = getId(req);
  const result = db.payCommitment(id);
  if (!result) {
    res.status(400).json({ error: 'Commitment not found or already paid' });
    return;
  }
  res.json({ success: true, ...result });
});

apiRouter.post('/commitments/:id/unpay', (req: Request, res: Response) => {
  const id = getId(req);
  const commitment = db.unpayCommitment(id);
  if (!commitment) {
    res.status(400).json({ error: 'Commitment not found or not in paid state' });
    return;
  }
  res.json({ success: true, commitment });
});
