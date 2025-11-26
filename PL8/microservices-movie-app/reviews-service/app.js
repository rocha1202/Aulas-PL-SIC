const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());

mongoose.connect("mongodb://root:pass123@mongodb:27017/reviewsdb?authSource=admin")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const Review = mongoose.model("Review", new mongoose.Schema({
  id: Number,
  movieId: Number,
  userId: Number,
  text: String
}));

// Endpoint para obter reviews por movieId
app.get("/reviews", async (req, res) => {
  const { movieId } = req.query;
  const reviews = await Review.find({ movieId: parseInt(movieId) });
  res.json(reviews);
});

// Endpoint para adicionar uma review
app.post("/reviews", async (req, res) => {
  const { movieId, userId, text } = req.body;
  const lastReview = await Review.findOne().sort({ id: -1 });
  const newId = lastReview ? lastReview.id + 1 : 1;
  const newReview = new Review({ id: newId, movieId, userId, text });
  await newReview.save();
  res.json(newReview);
});

app.listen(3002, () => {
  console.log("Reviews Service running on port 3002");
});