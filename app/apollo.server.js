import { ApolloServer, gql } from "apollo-server";

// see package.json for the path alias
import {
  getEmailGeneratorsByShop,
  getEmailGeneratorById,
} from "#models/EmailGenerator.server";

const typeDefs = gql`
  type Query {
    getEmailGeneratorsByShop(shop: String!): [EmailGenerator!]!
    getEmailGeneratorById(id: Int!): EmailGenerator
  }

  type EmailProvider {
    name: String!
  }

  type LLMProvider {
    name: String!
  }

  type EmailGenerator {
    id: Int!
    name: String!
    shop: String!
    productId: String!
    productHandle: String!
    productVariantId: String!
    emailProvider: EmailProvider!
    llmProvider: LLMProvider!
    emailPrivateKey: String!
    llmPrivateKey: String!
    createdAt: String!
  }
`;

const resolvers = {
  Query: {
    getEmailGeneratorsByShop: async (_, { shop }) =>
      await getEmailGeneratorsByShop(shop),
    getEmailGeneratorById: async (_, { id }) => await getEmailGeneratorById(id),
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
