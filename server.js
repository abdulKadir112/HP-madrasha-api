const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron'); // Cron job লাইব্রেরি

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = "mongodb+srv://abdulkadir112k_db_user:madrasha1122@sudhisomabesh.ewrzrht.mongodb.net/madrasha_db?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ Database Connected: Madrasha Management System"))
  .catch((err) => console.error("❌ Connection Error:", err));

// --- Cron Job: সার্ভারকে সচল রাখা ---
// প্রতি ১০ মিনিট পর পর এটি চলবে
cron.schedule('*/10 * * * *', () => {
  console.log('⏰ Cron Job running: Keeping server awake...');
  // এখানে আপনি আপনার সার্ভারের নিজস্ব কোনো রাউট কল করতে পারেন
  // অথবা শুধু কনসোল লগ দিয়েও কানেকশন সচল রাখা সম্ভব
});

// --- Database Models ---
const fundSchema = new mongoose.Schema({
  name: { type: String, required: true },
  balance: { type: Number, default: 0 },
  logo: { type: String, default: "" },
  description: String,
  createdAt: { type: Date, default: Date.now }
});
const Fund = mongoose.model('Fund', fundSchema);

const transactionSchema = new mongoose.Schema({
  fundId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fund', required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  donorName: String,
  expenseBy: String,
  note: String,
  date: { type: Date, default: Date.now }
});
const Transaction = mongoose.model('Transaction', transactionSchema);

// --- API Routes ---
app.get('/api/funds', async (req, res) => {
  try {
    const funds = await Fund.find().sort({ createdAt: -1 });
    res.json(funds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/funds', async (req, res) => {
  try {
    const newFund = new Fund(req.body);
    await newFund.save();
    res.status(201).json(newFund);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/funds/:id', async (req, res) => {
  try {
    const { name, logo, description } = req.body;
    const updatedFund = await Fund.findByIdAndUpdate(req.params.id, { name, logo, description }, { new: true });
    res.json(updatedFund);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/funds/:id', async (req, res) => {
  try {
    const fundId = req.params.id;
    await Transaction.deleteMany({ fundId: fundId });
    await Fund.findByIdAndDelete(fundId);
    res.json({ message: "Fund and all related transactions deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const { fundId, type, amount, category, donorName, expenseBy, note, date } = req.body;
    const transaction = new Transaction({ fundId, type, amount, category, donorName, expenseBy, note, date });
    await transaction.save();
    const updateAmount = type === 'income' ? amount : -amount;
    await Fund.findByIdAndUpdate(fundId, { $inc: { balance: updateAmount } });
    res.status(201).json({ message: "Transaction Successful", transaction });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).json({ message: "Transaction not found" });
        const reverseAmount = transaction.type === 'income' ? -transaction.amount : transaction.amount;
        await Fund.findByIdAndUpdate(transaction.fundId, { $inc: { balance: reverseAmount } });
        await Transaction.findByIdAndDelete(req.params.id);
        res.json({ message: "Transaction deleted and balance adjusted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/transactions/:fundId', async (req, res) => {
  try {
    const history = await Transaction.find({ fundId: req.params.fundId }).sort({ date: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/summary', async (req, res) => {
  try {
    const funds = await Fund.find();
    const totalBalance = funds.reduce((acc, curr) => acc + curr.balance, 0);
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStats = await Transaction.find({ date: { $gte: today } });
    res.json({ totalCommonBalance: totalBalance, totalFunds: funds.length, todayActivity: todayStats.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Madrasha Server live at PORT: ${PORT}`));