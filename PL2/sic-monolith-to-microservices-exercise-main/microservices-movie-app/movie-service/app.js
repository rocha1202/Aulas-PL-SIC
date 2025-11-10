const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

const movies = [
  { id: 1, title: "Treasure Planet", year: 2002 },
  { id: 2, title: "The Matrix", year: 1999 }
];

app.get("/movies", (req, res) => res.json(movies));

app.get("/movies/:id", async (req, res) => {
  const movie = movies.find(m => m.id === parseInt(req.params.id));
  if (!movie) return res.status(404).json({ error: "Movie not found" });

  try {
    const response = await axios.get(`http://localhost:3002/reviews?movieId=${movie.id}`);
    const reviews = response.data;
    res.json({ ...movie, reviews });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

app.listen(3001, () => console.log("Movie service running on port 3001"));