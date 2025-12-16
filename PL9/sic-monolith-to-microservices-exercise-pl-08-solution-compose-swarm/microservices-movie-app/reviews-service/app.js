const express = require("express");
const app = express();
app.use(express.json());
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

const JWT_SECRET = "secret"; //secret to encode and decode the jwt token

// ======================
// MongoDB Connection
// ======================
mongoose.connect(
  "mongodb://root:pass123@mongodb:27017/reviewsdb?authSource=admin"
).then(() => console.log("MongoDB connected"))
 .catch(err => console.error("MongoDB connection error:", err));


// ======================
// Mongoose Review Model
// ======================
const reviewSchema = new mongoose.Schema({
  id: Number,       // keep your own incremental ID
  movieId: Number,
  userId: Number,
  text: String
}, {
  versionKey: false,   // remove __v
  toJSON: {
    transform: (_, ret) => { delete ret._id; return ret; }
  }
});

const Review = mongoose.model("Review", reviewSchema);


// ======================
// AUTH MIDDLEWARE
// ======================
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied. Token missing." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token." });
    req.user = user;
    next();
  });
}

function authorizeRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: "Access forbidden: insufficient privileges." });
    }
    next();
  };
}


// ======================
// ROUTES
// ======================

// Get all reviews, optionally filtered by movieId
app.get("/reviews", async (req, res) => {
  /* 
    #swagger.tags = ['Reviews']
    #swagger.responses[200] = {
      description: 'List of all reviews',
      schema: [{ $ref: '#/definitions/GetReview' }]
    }
  */
  console.log("received request from movie service");
  const { movieId } = req.query;

  let query = {};
  if (movieId) query.movieId = parseInt(movieId);

  const reviews = await Review.find(query);
  res.json(reviews);
});

// Get a review by ID
app.get("/reviews/:id", async (req, res) => {
  /* 
    #swagger.tags = ['Reviews']
    #swagger.parameters['id'] = { description: 'ID of the review', required: true }
    #swagger.responses[200] = {
      description: 'Single review',
      schema: { $ref: '#/definitions/GetReview' }
    }
    #swagger.responses[404] = { description: 'Review not found' }
  */
  const review = await Review.findOne({ id: parseInt(req.params.id) });
  review ? res.json(review) : res.status(404).json({ error: "Review not found" });
});

// Create a new review
app.post("/reviews", authenticateToken, async (req, res) => {
  /* 
    #swagger.tags = ['Reviews']
    #swagger.parameters['body'] = {
      in: 'body',
      description: 'New review object',
      required: true,
      schema: { $ref: '#/definitions/CreateReview' }
    }
    #swagger.responses[201] = { description: 'Review created successfully', schema: { $ref: '#/definitions/GetReview'} }
  */
  const lastReview = await Review.findOne().sort({ id: -1 });
  const nextId = lastReview ? lastReview.id + 1 : 1;

  const newReview = new Review({ id: nextId, userId: req.user.id, ...req.body });
  await newReview.save();

  res.status(201).json(newReview);
});

// Update review
app.put("/reviews/:id", authenticateToken, async (req, res) => {
  /* 
    #swagger.tags = ['Reviews']
    #swagger.parameters['id'] = { description: 'ID of the review', required: true }
    #swagger.parameters['body'] = {
      in: 'body',
      description: 'Updated review object',
      required: true,
      schema: { $ref: '#/definitions/CreateReview' }
    }
    #swagger.responses[200] = { description: 'Review updated successfully', schema: { $ref: '#/definitions/GetReview' } }
    #swagger.responses[404] = { description: 'Review not found' }
  */
  const reviewId = parseInt(req.params.id);
  const review = await Review.findOne({ id: reviewId });

  if (!review) return res.status(404).json({ error: "Review not found" });

  if (req.user.role !== "ADMIN" && req.user.id != review.userId) {
    return res.status(403).json({ error: "Access forbidden: cannot modify other users." });
  }

  const { movieId, text } = req.body;
  if (movieId !== undefined) review.movieId = movieId;
  review.userId = req.user.id;
  if (text !== undefined) review.text = text;

  await review.save();
  res.json(review);
});

// Delete review
app.delete("/reviews/:id", authenticateToken, async (req, res) => {
  /* 
    #swagger.tags = ['Reviews']
    #swagger.parameters['id'] = { description: 'ID of the review', required: true }
    #swagger.responses[204] = { description: 'Review deleted successfully, no content' }
    #swagger.responses[404] = { description: 'Review not found' }
  */
  const reviewId = parseInt(req.params.id);
  const review = await Review.findOne({ id: reviewId });

  if (!review) return res.status(404).json({ error: "Review not found" });

  if (req.user.id != review.userId) {
    return res.status(403).json({ error: "Access forbidden: cannot delete other users." });
  }

  await Review.deleteOne({ id: reviewId });
  res.status(204).send();
});


app.listen(3002, () => console.log("Reviews service running on port 3002"));
