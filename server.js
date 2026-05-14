const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// CORS কনফিগারেশন - আপনার ফ্রন্টএন্ড ডোমেইনটি এলাউ করুন
app.use(cors());
app.use(express.json());

// ডাটাবেজ কানেকশন
const MONGO_URI = "mongodb+srv://abdulkadir112k_db_user:madrasha1122@sudhisomabesh.ewrzrht.mongodb.net/madrasha_db?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ Database Connected Successfully"))
  .catch((err) => console.error("❌ DB Error:", err));

// ফান্ড স্কিমা
const FundSchema = new mongoose.Schema({
  name: { type: String, required: true },
  balance: { type: Number, default: 0 },
  logo: { type: String, default: "" } // এখানে সরাসরি ইমেজের URL বা Base64 সেভ হবে
});

const Fund = mongoose.model('Fund', FundSchema);

// রুট পাথ চেক
app.get('/', (req, res) => {
  res.send("Madrasha API is running...");
});

// সব ফান্ড পাওয়ার রুট
app.get('/api/funds', async (req, res) => {
  try {
    const funds = await Fund.find();
    res.json(funds);
  } catch (err) {
    res.status(500).json({ error: "ফান্ড ফেচ করতে সমস্যা হয়েছে" });
  }
});

// নতুন ফান্ড তৈরির রুট
app.post('/api/funds', async (req, res) => {
  try {
    const { name, logo } = req.body;
    const newFund = new Fund({ name, logo });
    await newFund.save();
    res.status(201).json(newFund);
  } catch (err) {
    res.status(500).json({ error: "ফান্ড তৈরি করা যায়নি" });
  }
});

// ফান্ড ডিলিট করার রুট
app.delete('/api/funds/:id', async (req, res) => {
  try {
    await Fund.findByIdAndDelete(req.params.id);
    res.json({ message: "ফান্ড ডিলিট হয়েছে" });
  } catch (err) {
    res.status(500).json({ error: "ডিলিট করতে সমস্যা হয়েছে" });
  }
});

// পোর্ট সেটআপ (Render এর জন্য process.env.PORT গুরুত্বপূর্ণ)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));