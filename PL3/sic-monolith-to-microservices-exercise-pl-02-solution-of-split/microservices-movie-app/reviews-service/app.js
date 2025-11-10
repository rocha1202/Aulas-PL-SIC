const express = require("express");
const app = express();

const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.use(express.json());

let reviews = [
  { id: 1, movieId: 1, userId: 2, text: "Very underrated movie!" },
  { id: 2, movieId: 1, userId: 1, text: "Best animated movie ever." },
  { id: 3, movieId: 2, userId: 1, text: "Classic sci-fi." }
];

// Get all reviews, optionally filtered by movieId
app.get("/reviews", (req, res) => {
  const { movieId } = req.query;
  if (movieId) {
    const filteredReviews = reviews.filter(r => r.movieId === parseInt(movieId));
    return res.json(filteredReviews);
  }
  res.json(reviews);

  /* #swagger.tags = ['Reviews']
     #swagger.parameters['movieId'] = {
       in: 'query',
       description: 'Filter reviews by movie ID',
       required: false,
       type: 'integer'
     }
     #swagger.responses[200] = {
       description: 'List of reviews',
       schema: [{ $ref: '#/definitions/Review' }]
     }
  */
});


// Get a review by ID
app.get("/reviews/:id", (req, res) => {
  const review = reviews.find(r => r.id === parseInt(req.params.id));
  review ? res.json(review) : res.status(404).json({ error: "Review not found" });

  /* #swagger.tags = ['Reviews']
     #swagger.parameters['id'] = {
       in: 'path',
       description: 'ID of the review',
       required: true,
       type: 'integer'
     }
     #swagger.responses[200] = {
       description: 'Review obtained successfully',
       schema: { $ref: '#/definitions/Review' }
     }
     #swagger.responses[404] = { description: 'Review not found' }
  */  
});

// Create a new review
app.post("/reviews", (req, res) => {
  const newReview = { id: reviews.length + 1, ...req.body };
  reviews.push(newReview);
  res.status(201).json(newReview);

  /* #swagger.tags = ['Reviews']
     #swagger.parameters['body'] = {
       in: 'body',
       description: 'New review',
       required: true,
       schema: { $ref: '#/definitions/ReviewInput' }
     }
     #swagger.responses[201] = {
       description: 'Review created successfully',
       schema: { $ref: '#/definitions/Review' }
     }
  */
});



// Atualizar review
app.put("/reviews/:id", (req, res) => {
  const review = reviews.find(r => r.id === parseInt(req.params.id));
  if (!review) return res.status(404).json({ error: "Review not found" });

  const { text, movieId, userId } = req.body;
  review.text = text || review.text;
  review.movieId = movieId || review.movieId;
  review.userId = userId || review.userId;
  res.json(review);

  /* #swagger.tags = ['Reviews']
     #swagger.parameters['id'] = {
       in: 'path',
        description: 'ID of the review',
        required: true,
        type: 'integer'
      }
      #swagger.parameters['body'] = {
        in: 'body',
        description: 'Updated review data',
        required: true,
        schema: { $ref: '#/definitions/ReviewInput' }
      }
      #swagger.responses[200] = {
        description: 'Review updated successfully',
        schema: { $ref: '#/definitions/Review' }
      }
      #swagger.responses[404] = { description: 'Review not found' }
  */
});

// Eliminar review
app.delete("/reviews/:id", (req, res) => {
  const index = reviews.findIndex(r => r.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: "Review not found" });

  reviews.splice(index, 1);
  res.status(200).json({ message: "Review deleted" });

  /* #swagger.tags = ['Reviews']
     #swagger.parameters['id'] = {
       in: 'path',
       description: 'ID of the review',
       required: true,
       type: 'integer'
     }
     #swagger.responses[200] = { description: 'Review deleted successfully' }
     #swagger.responses[404] = { description: 'Review not found' }
  */
});
app.listen(3002, () => console.log("Reviews service running on port 3002"));
