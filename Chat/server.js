const { ApolloServer, gql } = require("apollo-server");
const MiddleContext =require('./utils/contentMiddleware')
// The GraphQL schema
const typeDefs = require("./graphql/typeDefs");
const {sequelize}=require('./models')
// A map of functions which return data for the schema.
const resolvers = require("./graphql/resolvers");

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context:MiddleContext,
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
  sequelize.authenticate()
  .then(()=>console.log(`database connected !!`))
  .catch((error)=>console.log(error))
});
