const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const JWT_SECRET = 'secret_key_123';

app.use(cors());
app.use(express.json());

// ── MongoDB ───────────────────────────────────────────────────────────────────
mongoose.connect('mongodb+srv://tshaurya929_db_user:0UknDwB4I3Bfsoau@cluster0.wc60bjl.mongodb.net/expense_tracker')
  .then(() => console.log('✅ MongoDB Connected!'))
  .catch(err => console.log('❌ MongoDB Error:', err.message));

// ── Models ────────────────────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  email:         { type: String, required: true, unique: true },
  password:      { type: String, required: true },
  currency:      { type: String, default: '₹' },
  monthlyBudget: { type: Number, default: 0 },
  createdAt:     { type: Date, default: Date.now }
});

const CategorySchema = new mongoose.Schema({
  name:      { type: String, required: true },
  type:      { type: String, enum: ['income', 'expense'], required: true },
  icon:      String,
  color:     String,
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isDefault: { type: Boolean, default: false }
});

const TransactionSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  amount:   { type: Number, required: true },
  type:     { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, required: true },
  date:     { type: Date, default: Date.now },
  notes:    String,
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

const User        = mongoose.model('User', UserSchema);
const Category    = mongoose.model('Category', CategorySchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);

// ── Auth Middleware ───────────────────────────────────────────────────────────
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      console.log('⚠️  No token provided');
      return res.status(401).json({ error: 'Please authenticate' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log('⚠️  User not found for token');
      return res.status(401).json({ error: 'Please authenticate' });
    }
    req.userId = decoded.userId;
    next();
  } catch (error) {
    // Log to terminal only — not exposed to app with extra detail
    console.log('⚠️  Auth failed:', error.message);
    return res.status(401).json({ error: 'Session expired. Please login again.' });
  }
};

// ── Test Route ────────────────────────────────────────────────────────────────
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Server is running!', time: new Date().toISOString() });
});

// ── Auth Routes ───────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email: email.toLowerCase(), password: hashedPassword });
    await user.save();

    // Create default categories — always scoped to this user only
    const defaultCategories = [
      { name: 'Salary',        type: 'income',  icon: 'cash',          color: '#27ae60', userId: user._id, isDefault: true },
      { name: 'Freelance',     type: 'income',  icon: 'laptop',        color: '#2980b9', userId: user._id, isDefault: true },
      { name: 'Investment',    type: 'income',  icon: 'trending-up',   color: '#8e44ad', userId: user._id, isDefault: true },
      { name: 'Gift',          type: 'income',  icon: 'gift',          color: '#16a085', userId: user._id, isDefault: true },
      { name: 'Food',          type: 'expense', icon: 'food',          color: '#e74c3c', userId: user._id, isDefault: true },
      { name: 'Transport',     type: 'expense', icon: 'car',           color: '#f39c12', userId: user._id, isDefault: true },
      { name: 'Shopping',      type: 'expense', icon: 'cart',          color: '#3498db', userId: user._id, isDefault: true },
      { name: 'Bills',         type: 'expense', icon: 'file-document', color: '#95a5a6', userId: user._id, isDefault: true },
      { name: 'Entertainment', type: 'expense', icon: 'movie',         color: '#9b59b6', userId: user._id, isDefault: true },
      { name: 'Health',        type: 'expense', icon: 'heart',         color: '#e91e63', userId: user._id, isDefault: true },
      { name: 'Other',         type: 'expense', icon: 'dots-horizontal',color: '#7f8c8d',userId: user._id, isDefault: true },
    ];

    // Only insert if no categories exist for this user
    const existingCats = await Category.countDocuments({ userId: user._id });
    if (existingCats === 0) {
      await Category.insertMany(defaultCategories);
    }

    // Token valid for 30 days
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });
    console.log(`✅ New user registered: ${email}`);

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, currency: user.currency }
    });
  } catch (error) {
    console.log('❌ Register error:', error.message);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Token valid for 30 days
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });
    console.log(`✅ User logged in: ${email}`);

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, currency: user.currency }
    });
  } catch (error) {
    console.log('❌ Login error:', error.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ── Transaction Routes ────────────────────────────────────────────────────────
app.get('/api/transactions', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = { userId: req.userId };

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate   = new Date(year, month, 0, 23, 59, 59);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const transactions = await Transaction.find(query).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    console.log('❌ Get transactions error:', error.message);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

app.post('/api/transactions', auth, async (req, res) => {
  try {
    const { title, amount, type, category, notes, date } = req.body;
    if (!title || !amount || !type || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const transaction = new Transaction({
      title, amount, type, category, notes,
      date: date || Date.now(),
      userId: req.userId
    });
    await transaction.save();
    console.log(`✅ Transaction added: ${type} ${amount}`);
    res.json(transaction);
  } catch (error) {
    console.log('❌ Add transaction error:', error.message);
    res.status(500).json({ error: 'Failed to add transaction' });
  }
});

app.put('/api/transactions/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    res.json(transaction);
  } catch (error) {
    console.log('❌ Update transaction error:', error.message);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

app.delete('/api/transactions/:id', auth, async (req, res) => {
  try {
    const result = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!result) return res.status(404).json({ error: 'Transaction not found' });
    console.log(`✅ Transaction deleted: ${req.params.id}`);
    res.json({ success: true });
  } catch (error) {
    console.log('❌ Delete transaction error:', error.message);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// ── Category Routes ───────────────────────────────────────────────────────────
app.get('/api/categories', auth, async (req, res) => {
  try {
    // ✅ FIXED: only fetch THIS user's categories — no cross-user leakage
    const categories = await Category.find({ userId: req.userId });

    // Deduplicate by name+type in case of old bad data in DB
    const seen = new Set();
    const unique = categories.filter(c => {
      const key = `${c.name}-${c.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    res.json(unique);
  } catch (error) {
    console.log('❌ Get categories error:', error.message);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.post('/api/categories', auth, async (req, res) => {
  try {
    const { name, type, color, icon } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'Name and type required' });

    // Prevent duplicate category names for this user
    const existing = await Category.findOne({ name, type, userId: req.userId });
    if (existing) return res.status(400).json({ error: 'Category already exists' });

    const category = new Category({ name, type, color, icon, userId: req.userId });
    await category.save();
    res.json(category);
  } catch (error) {
    console.log('❌ Add category error:', error.message);
    res.status(500).json({ error: 'Failed to add category' });
  }
});

// ── Stats Route ───────────────────────────────────────────────────────────────
app.get('/api/stats/dashboard', auth, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const transactions = await Transaction.find({
      userId: req.userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    }).sort({ date: -1 });

    let totalIncome = 0, totalExpense = 0;
    const byCategory = {};

    transactions.forEach(t => {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
        byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
      }
    });

    const user = await User.findById(req.userId);

    res.json({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      byCategory,
      recentTransactions: transactions.slice(0, 5),
      budget: user.monthlyBudget,
      budgetRemaining: user.monthlyBudget - totalExpense
    });
  } catch (error) {
    console.log('❌ Stats error:', error.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://192.168.31.227:${PORT}`);
});