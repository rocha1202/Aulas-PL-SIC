const { ApolloServer, gql } = require("apollo-server");
const axios = require("axios");
const mongoose = require("mongoose");

mongoose
  .connect("mongodb://root:pass123@mongodb:27017/moviesdb?authSource=admin")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const Movie = mongoose.model(
  "Movie",
  new mongoose.Schema({
    id: Number,
    title: String,
    year: Number,
  })
);

const typeDefs = gql`
  type Review {
    id: ID!
    movieId: Int!
    userId: Int!
    text: String!
  }

  type Movie {
    id: ID!
    title: String!
    year: Int!
    reviews: [Review]
  }

  type Query {
    movies: [Movie!]!
    movie(id: ID!): Movie
  }

  type Mutation {
    addMovie(title: String!, year: Int!): Movie!
    updateMovie(id: ID!, title: String, year: Int): Movie
    deleteMovie(id: ID!): String
  }
`;

const resolvers = {
  Query: {
    movies: async () => {
      const allMovies = await Movie.find();
      return Promise.all(
        allMovies.map(async (movie) => {
          try {
            const response = await axios.get(
              `http://reviews-service:3002/reviews?movieId=${movie.id}`
            );
            return { ...movie.toObject(), reviews: response.data };
          } catch (err) {
            return { ...movie.toObject(), reviews: [] };
          }
        })
      );
    },
  },
  Mutation: {
    addMovie: async (_, { title, year }) => {
      const lastMovie = await Movie.findOne().sort({ id: -1 });
      const newId = lastMovie ? lastMovie.id + 1 : 1;
      const newMovie = new Movie({ id: newId, title, year });
      await newMovie.save();
      return newMovie;
    },

    updateMovie: async (_, { id, title, year }) => {
      const movie = await Movie.findOne({ id: parseInt(id) });
      if (!movie) throw new Error("Movie not found");
      if (title) movie.title = title;
      if (year) movie.year = year;
      await movie.save();
      return movie;
    },

    deleteMovie: async (_, { id }) => {
      const result = await Movie.deleteOne({ id: parseInt(id) });
      if (result.deletedCount === 0) throw new Error("Movie not found");
      return "Movie deleted";
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });
server.listen({ port: 3001 }).then(({ url }) => {
  console.log(`GraphQL Movies Service running at ${url}`);
});
