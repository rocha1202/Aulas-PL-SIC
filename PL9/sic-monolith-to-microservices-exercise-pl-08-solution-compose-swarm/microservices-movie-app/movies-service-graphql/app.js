const { ApolloServer, gql, UserInputError } = require("apollo-server");
const axios = require("axios");

// our "database"
let movies = [
  { id: 1, title: "Treasure Planet", year: 2002 },
  { id: 2, title: "The Matrix", year: 1999 }
];

// GraphQL schema
const typeDefs = gql`
  type Movie {
    id: ID!
      title: String!
      year: Int!
      reviews: [Review]
  }

  type Review {
    id: ID!
    movieId: Int!
    userId: String!
    text: String!
  }

  type Query {
    movies: [Movie!]!
    movie(id: ID!): Movie
  }

  type Mutation {
    addMovie(title: String!, year: Int!): Movie!
    updateMovie(id: ID!, title: String, year: Int): Movie!
    deleteMovie(id: ID!): Boolean!
  }
`;

// Resolvers
const resolvers = {
  Query: {
    movies: () => movies,
    movie: async (_, { id }) => {
      const movie = movies.find(m => m.id === parseInt(id));
      if (!movie) {
        throw new UserInputError(`Movie with ID ${id} not found`);
      }

      try {
        const response = await axios.get(
          `http://localhost:3002/reviews?movieId=${movie.id}`
        );
        return { ...movie, reviews: response.data };
      } catch (error) {
        console.error("Error fetching reviews:", error.message);
        // You can either throw or return the movie with empty reviews
        return { ...movie, reviews: [] };
      }
    },
  },

  Mutation: {
    addMovie: (_, { title, year }) => {
      const newMovie = { id: movies.length + 1, title, year };
      movies.push(newMovie);
      return newMovie;
    },

    updateMovie: (_, { id, title, year }) => {
      const movie = movies.find(m => m.id === parseInt(id));
      if (!movie) throw new UserInputError(`Movie with ID ${id} not found`);

      if (title !== undefined) movie.title = title;
      if (year !== undefined) movie.year = year;
      return movie;
    },

    deleteMovie: (_, { id }) => {
      const index = movies.findIndex(m => m.id === parseInt(id));
      if (index === -1) throw new Error(`Movie with ID ${id} not found`);
      movies.splice(index, 1);
      return true;
    },
  },


};


// Create Apollo Server

const server = new ApolloServer({
  typeDefs,
  resolvers,

  // Remove stack traces from error responses
  formatError: (err) => {
    return {
      message: err.message,
      locations: err.locations,
      path: err.path,

    };
  },
});
// Start the server
server.listen({ port: 3001 }).then(({ url }) => {
  console.log(`GraphQL movie service server running in ${url}`);
});
