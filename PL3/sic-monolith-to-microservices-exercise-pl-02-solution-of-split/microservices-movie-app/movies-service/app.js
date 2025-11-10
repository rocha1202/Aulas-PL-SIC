const express = require("express");
const axios = require("axios"); // we'll use this to call the review service
const app = express();

const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.use(express.json());

// our "database" data
let movies = [
  { id: 1, title: "Treasure Planet", year: 2002 },
  { id: 2, title: "The Matrix", year: 1999 }
];

// GET all movies
app.get("/movies", (req, res) => {
  res.json(movies)
  /*#swagger.tags = ['Movies']
  #swagger.responses[200] = {
    description: 'List of all movies',
    schema: [{ $ref: '#/definitions/Movie' }]
  }
  */
});

// GET a movie by ID (and fetch its reviews from the Review Service)
app.get("/movies/:id", async (req, res) => {

  const movie = movies.find(m => m.id === parseInt(req.params.id));
  if (!movie) {
    return res.status(404).json({ error: "Movie not found" });
  }

  try {
    // call the review service
    const response = await axios.get(`http://localhost:3002/reviews?movieId=${movie.id}`);
    const movieReviews = response.data;

    res.json({
      id: movie.id,
      title: movie.title,
      year: movie.year,
      reviews: movieReviews
    });

  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }

  /*#swagger.tags = ['Movies']
  #swagger.parameters['id'] = {
    in: 'path',
    description: 'ID of the movie',
    required: true,
    type: 'integer'
  }
  #swagger.responses[200] = {
    description: 'Movie obtained successfully',
    schema: { 
      type: 'object',
      properties: {
        id: { type: 'integer' },
        title: { type: 'string' },
        year: { type: 'integer' },
        reviews: {
          type: 'array',
          items: { $ref: '#/definitions/Review' }
        }
      }
    }
  }
  #swagger.responses[404] = { description: 'Movie not found' }
  */
});


// Criar filme
app.post("/movies", (req, res) => {
  const { title, year } = req.body;
  if (!title || !year) return res.status(400).json({ error: "Title and year are required" });

  const newMovie = { id: movies.length + 1, title, year };
  movies.push(newMovie);
  res.status(201).json(newMovie);

  /*#swagger.tags = ['Movies']
  #swagger.parameters['body'] = {
    in: 'body',
    description: 'New movie',
    required: true,
    schema: { $ref: '#/definitions/MovieInput' }
  }
  #swagger.responses[201] = {
    description: 'Movie created successfully',
    schema: { $ref: '#/definitions/Movie' }
  }
  */
});

// Atualizar filme
app.put("/movies/:id", (req, res) => {
  const movie = movies.find(m => m.id === parseInt(req.params.id));
  if (!movie) return res.status(404).json({ error: "Movie not found" });

  const { title, year } = req.body;
  movie.title = title || movie.title;
  movie.year = year || movie.year;
  res.json(movie);

  /*#swagger.tags = ['Movies']
  #swagger.parameters['id'] = {
    in: 'path',
    description: 'ID of the movie',
    required: true,
    type: 'integer'
  }
  #swagger.parameters['body'] = {
    in: 'body',
    description: 'Updated movie data',
    required: true,
    schema: { $ref: '#/definitions/MovieInput' }
  }
  #swagger.responses[200] = {
    description: 'Movie updated successfully',
    schema: { $ref: '#/definitions/Movie' }
  }
  #swagger.responses[404] = { description: 'Movie not found' }
  */
});

// Eliminar filme
app.delete("/movies/:id", (req, res) => {
  const index = movies.findIndex(m => m.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: "Movie not found" });

  movies.splice(index, 1);
  res.status(200).json({ message: "Movie deleted" });

  /*#swagger.tags = ['Movies']
  #swagger.parameters['id'] = {
    in: 'path',
    description: 'ID of the movie',
    required: true,
    type: 'integer'
  }
  #swagger.responses[200] = {
    description: 'Movie deleted successfully',
    schema: { $ref: '#/definitions/DeleteResponse' }
  }
  #swagger.responses[404] = { description: 'Movie not found' }
  */
});
app.listen(3001, () => console.log("Movies service running on port 3001"));
