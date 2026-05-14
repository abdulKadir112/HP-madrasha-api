const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const MONGO_URI = "mongodb+srv://abdulkadir112k_db_user:madrasha1122@sudhisomabesh.ewrzrht.mongodb.net/madrasha_db?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ Database Connected"))
  .catch((err) => console.error("❌ DB Error:", err));

// ফান্ড স্কিমা
const Fund = mongoose.model('Fund', new mongoose.Schema({
  name: String,
  balance: { type: Number, default: 0 },
  logo: String
}));

app.get('/api/funds', async (req, res) => {
  const funds = await Fund.find();
  res.json(funds);
});

app.listen(5000, () => console.log("🚀 Server running on port 5000"));