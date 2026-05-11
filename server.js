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

// ১. ফান্ড ক্যাটাগরি (logo ফিল্ড যোগ করা হয়েছে)
const fundSchema = new mongoose.Schema({
  name: { type: String, required: true },
  balance: { type: Number, default: 0 },
  logo: { type: String, default: "" }, // লোগো URL এর জন্য
  description: String,
  createdAt: { type: Date, default: Date.now }
});

const Fund = mongoose.model('Fund', fundSchema);

// ২. ট্রানজেকশন
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

// [GET] সকল ফান্ড দেখা
app.get('/api/funds', async (req, res) => {
  try {
    const funds = await Fund.find().sort({ createdAt: -1 });
    res.json(funds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [POST] নতুন ফান্ড খোলা
app.post('/api/funds', async (req, res) => {
  try {
    const newFund = new Fund(req.body);
    await newFund.save();
    res.status(201).json(newFund);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/** 
 * ৩. ফান্ড এডিট (Update) 
 * [PUT] /api/funds/:id
 */
app.put('/api/funds/:id', async (req, res) => {
  try {
    const { name, logo, description } = req.body;
    const updatedFund = await Fund.findByIdAndUpdate(
      req.params.id,
      { name, logo, description },
      { new: true } // এটি আপডেট হওয়া নতুন ডাটা রিটার্ন করবে
    );
    res.json(updatedFund);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/** 
 * ৪. ফান্ড ডিলিট (Delete)
 * [DELETE] /api/funds/:id
 * নোট: এটি ডিলিট করলে ওই ফান্ডের সব ট্রানজেকশনও ডিলিট করা ভালো।
 */
app.delete('/api/funds/:id', async (req, res) => {
  try {
    const fundId = req.params.id;
    // ১. ফান্ডের সব ট্রানজেকশন ডিলিট করুন
    await Transaction.deleteMany({ fundId: fundId });
    // ২. ফান্ড ডিলিট করুন
    await Fund.findByIdAndDelete(fundId);
    
    res.json({ message: "Fund and all related transactions deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- লেনদেন (Transactions) রাউটস ---

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

// ট্রানজেকশন ডিলিট করার রাউট (প্রয়োজন হলে)
app.delete('/api/transactions/:id', async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).json({ message: "Transaction not found" });

        // ফান্ডের ব্যালেন্স রিভার্স করা (ডিলিট করলে ব্যালেন্স ঠিক করতে হবে)
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
    
    res.json({
      totalCommonBalance: totalBalance,
      totalFunds: funds.length,
      todayActivity: todayStats.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Madrasha Server live at PORT: ${PORT}`));