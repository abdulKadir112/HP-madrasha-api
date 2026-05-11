const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = "mongodb+srv://abdulkadir112k_db_user:madrasha1122@sudhisomabesh.ewrzrht.mongodb.net/madrasha_db?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ Database Connected: Madrasha Management System"))
  .catch((err) => console.error("❌ Connection Error:", err));

// --- Database Models ---

// ১. ফান্ড ক্যাটাগরি (উদা: সাধারণ, যাকাত, লিল্লাহ বোর্ডিং)
const fundSchema = new mongoose.Schema({
  name: { type: String, required: true },
  balance: { type: Number, default: 0 },
  description: String,
  createdAt: { type: Date, default: Date.now }
});

const Fund = mongoose.model('Fund', fundSchema);

// ২. ট্রানজেকশন (আয় এবং ব্যয়ের বিস্তারিত)
const transactionSchema = new mongoose.Schema({
  fundId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fund', required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, required: true }, // উদা: বেতন, কারেন্ট বিল, অনুদান
  amount: { type: Number, required: true },
  donorName: String, // যদি আয় হয়
  expenseBy: String, // যদি খরচ হয়
  note: String,
  date: { type: Date, default: Date.now }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// --- API Routes ---

// সকল ফান্ডের বর্তমান ব্যালেন্স দেখা
app.get('/api/funds', async (req, res) => {
  try {
    const funds = await Fund.find();
    res.json(funds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// নতুন ফান্ড খোলা (উদা: নতুন একটা প্রজেক্ট বা বিল্ডিং ফান্ড)
app.post('/api/funds', async (req, res) => {
  try {
    const newFund = new Fund(req.body);
    await newFund.save();
    res.status(201).json(newFund);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// লেনদেন নথিভুক্ত করা (এটি করলে অটোমেটিক ফান্ডের ব্যালেন্স আপডেট হবে)
app.post('/api/transactions', async (req, res) => {
  try {
    const { fundId, type, amount, category, donorName, expenseBy, note, date } = req.body;
    
    // ১. ট্রানজেকশন তৈরি
    const transaction = new Transaction({ fundId, type, amount, category, donorName, expenseBy, note, date });
    await transaction.save();

    // ২. ফান্ডের মেইন ব্যালেন্স আপডেট করা (ইன்கাম হলে যোগ, এক্সপেন্স হলে বিয়োগ)
    const updateAmount = type === 'income' ? amount : -amount;
    await Fund.findByIdAndUpdate(fundId, { $inc: { balance: updateAmount } });

    res.status(201).json({ message: "Transaction Successful", transaction });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// রিপোর্ট: নির্দিষ্ট ফান্ডের সকল লেনদেন দেখা
app.get('/api/transactions/:fundId', async (req, res) => {
  try {
    const history = await Transaction.find({ fundId: req.params.fundId }).sort({ date: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// সারাংশ: মোট আয়, মোট ব্যয় এবং হাতে থাকা নগদ টাকা
app.get('/api/summary', async (req, res) => {
  try {
    const funds = await Fund.find();
    const totalBalance = funds.reduce((acc, curr) => acc + curr.balance, 0);
    
    // আজ কত টাকা আয়/ব্যয় হলো
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStats = await Transaction.find({ date: { $gte: today } });
    
    res.json({
      totalCommonBalance: totalBalance,
      totalFunds: funds.length,
      todayActivity: todayStats.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Madrasha Server live at http://localhost:${PORT}`));