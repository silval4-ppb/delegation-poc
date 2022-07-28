import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader";
import { loadSchema } from "@graphql-tools/load";
import { ApolloServer } from "apollo-server";

async function main() {
  const members = [
    {
      id: "1",
      teamId: "1",
      name: "Luca",
    },
    {
      id: "2",
      teamId: "1",
      name: "Lara",
    },
    {
      id: "3",
      teamId: "2",
      name: "Maia",
    },
    {
      id: "4",
      teamId: "2",
      name: "Rui",
    },
  ];

  const schema = await loadSchema("./src/schema.graphql", {
    loaders: [new GraphQLFileLoader()],
  });

  const resolvers = {
    Member: {
      id: ({ id }, args, context, info) => {
        return id;
      },
      name: async ({ id }, args, context, info) => {
        return members.find((member) => member.id === id).name;
      },
    },
    Query: {
      memberById: (_, { id }) => {
        return members.find((member) => member.id === id);
      },
      membersByTeam: (_, { teamId }) => {
        return members.filter((member) => member.teamId === teamId);
      },
    },
  };

  // The ApolloServer constructor requires two parameters: your schema
  // definition and your set of resolvers.
  const server = new ApolloServer({
    typeDefs: schema,
    resolvers: resolvers,
    context: {},
  });

  // The `listen` method launches a web server.
  server.listen({ port: 4001 }).then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
  });
}

main();
