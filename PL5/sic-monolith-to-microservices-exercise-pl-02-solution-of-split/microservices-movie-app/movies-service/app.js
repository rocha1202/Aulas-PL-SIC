const { ApolloServer, gql } = require("apollo-server");
const axios = require("axios");

let movies = [
  { id: 1, title: "Treasure Planet", year: 2002 },
  { id: 2, title: "The Matrix", year: 1999 },
];

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
      return Promise.all(
        movies.map(async (movie) => {
          try {
            const response = await axios.get(
              `http://10.0.2.15/reviews?movieId=${movie.id}`
            );
            return { ...movie, reviews: response.data };
          } catch (err) {
            console.error("Error fetching reviews:", err.message);
            return { ...movie, reviews: [] };
          }
        })
      );
    },
    movie: async (_, { id }) => {
      const movie = movies.find((m) => m.id === parseInt(id));
      if (!movie) throw new Error("Movie not found");
      const response = await axios.get(
        `http://10.0.2.15/reviews?movieId=${movie.id}`
      );
      return { ...movie, reviews: response.data };
    },
  },
  Mutation: {
    addMovie: (_, { title, year }) => {
      const newMovie = { id: movies.length + 1, title, year };
      movies.push(newMovie);
      return newMovie;
    },
    updateMovie: (_, { id, title, year }) => {
      const movie = movies.find((m) => m.id === parseInt(id));
      if (!movie) throw new Error("Movie not found");
      if (title) movie.title = title;
      if (year) movie.year = year;
      return movie;
    },
    deleteMovie: (_, { id }) => {
      const index = movies.findIndex((m) => m.id === parseInt(id));
      if (index === -1) throw new Error("Movie not found");
      movies.splice(index, 1);
      return "Movie deleted";
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });
server.listen({ port: 3001 }).then(({ url }) => {
  console.log(`GraphQL Movies Service running at ${url}`);
});
