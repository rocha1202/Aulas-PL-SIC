const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const app = express();
const pino = require("pino");
const logger = pino({
  transport: {
    target: "pino-pretty",
    options: { colorize: true }
  }
});
const { publishMovieCreatedEvent } = require("./rabbitmq");
app.use(express.json());

const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));


// ======================
//  MongoDB CONNECTION
// ======================
mongoose.connect(
  "mongodb://root:pass123@mongodb:27017/moviesdb?authSource=admin"
).then(() => console.log("MongoDB connected"))
 .catch(err => console.error("MongoDB connection error:", err));


// ======================
//  Mongoose Movie Model
// ======================
const Movie = mongoose.model("Movie", new mongoose.Schema({
  id: Number,
  title: String,
  year: Number
}));


// ======================
//  ROUTES
// ======================

// GET all movies
app.get("/movies", async (req, res) => {
  /* 
    #swagger.tags = ['Movies']
    #swagger.responses[200] = {
      description: 'List of all movies',
      schema: [{ $ref: '#/definitions/GetMovie' }]
    }
  */
  logger.info(`Request: GET /movies/ received.`);

  const movies = await Movie.find();
  res.json(movies);
});


// GET a movie by ID + Reviews from Review Service
app.get("/movies/:id", async (req, res) => {
  /* 
    #swagger.tags = ['Movies']
    #swagger.parameters['id'] = { description: 'ID of the movie', required: true }
    #swagger.responses[200] = {
      description: 'Single movie',
      schema: { $ref: '#/definitions/FullMovie' }
    }
    #swagger.responses[404] = { description: 'Movie not found' }
  */
  logger.info(`Request: GET /movies/${req.params.id} received.`);
  const movieId = parseInt(req.params.id);
  const movie = await Movie.findOne({ id: movieId });

  if (!movie) {
    logger.warn(`Movie with id: ${req.params.id} was not found.`)
    return res.status(404).json({ error: "Movie not found" });
  }

  try {
    const response = await axios.get(
      `http://reviews-service:3002/reviews?movieId=${movie.id}`
    );

    res.json({
      id: movie.id,
      title: movie.title,
      year: movie.year,
      reviews: response.data
    });

  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});


// CREATE movie
app.post("/movies", async (req, res) => {
  /* 
    #swagger.tags = ['Movies']
    #swagger.parameters['body'] = {
      in: 'body',
      description: 'New movie object',
      required: true,
      schema: { $ref: '#/definitions/CreateMovie' }
    }
    #swagger.responses[201] = { description: 'Movie created successfully', schema: { $ref: '#/definitions/GetMovie' } }
    #swagger.responses[400] = { description: 'Title and year are required' }
  */
  logger.info("Request: POST /movies received.");
  const { title, year } = req.body;

  if (!title || !year) {
    return res.status(400).json({ error: "Title and year are required." });
  }

  // create next sequential id
  const lastMovie = await Movie.findOne().sort({ id: -1 });
  const nextId = lastMovie ? lastMovie.id + 1 : 1;

  const newMovie = new Movie({
    id: nextId,
    title,
    year
  }
);

  // this should handle error case as well

  // await newMovie.save();
  // logger.info(`Movie created successfully with id: ${newMovie.id}`);
  // res.status(201).json(newMovie);

   await newMovie.save();
 logger.info(`Movie created successfully with id: ${newMovie.id}`);
 publishMovieCreatedEvent(newMovie).catch(err =>
 logger.error("Failed to publish MovieCreated event", err)
 );
});


// UPDATE movie
app.put("/movies/:id", async (req, res) => {
  /* 
    #swagger.tags = ['Movies']
    #swagger.parameters['id'] = { description: 'ID of the movie', required: true }
    #swagger.parameters['body'] = {
      in: 'body',
      description: 'Updated movie object',
      required: true,
      schema: { $ref: '#/definitions/CreateMovie' }
    }
    #swagger.responses[200] = { description: 'Movie updated successfully', schema: { $ref: '#/definitions/GetMovie' } }
    #swagger.responses[404] = { description: 'Movie not found' }
  */

  logger.info(`Request: PUT /movies/${req.params.id} received.`);
  const movieId = parseInt(req.params.id);
  const movie = await Movie.findOne({ id: movieId });

  if (!movie) {
    logger.error(`Movie with id: ${req.params.id} was not found. Update failed.`)
    return res.status(404).json({ error: "Movie not found" });
  }

  const { title, year } = req.body;

  if (title !== undefined) movie.title = title;
  if (year !== undefined) movie.year = year;

  await movie.save();
  logger.info(`Movie updated successfully with id: ${movieId}`);
  res.json(movie);
});


// DELETE movie
app.delete("/movies/:id", async (req, res) => {
  /* 
    #swagger.tags = ['Movies']
    #swagger.parameters['id'] = { description: 'ID of the movie', required: true }
    #swagger.responses[204] = { description: 'Movie deleted successfully, no content' }
    #swagger.responses[404] = { description: 'Movie not found' }
  */

  logger.info(`Request: DELETE /movies/${req.params.id} received.`);
  const movieId = parseInt(req.params.id);
  const movie = await Movie.findOne({ id: movieId });

  if (!movie) {
    logger.error(`Movie with id: ${req.params.id} was not found. Delete failed.`)
    return res.status(404).json({ error: "Movie not found" });
  }

  await Movie.deleteOne({ id: movieId });
  logger.info(`Movie delete successfully with id: ${req.params.id}`);
  res.status(204).send();
});


app.listen(3001, () => console.log("Movies service running on port 3001"));
