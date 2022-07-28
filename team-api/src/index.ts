import { ApolloServer } from "apollo-server";
import { delegateToSchema } from "@graphql-tools/delegate";
import { loadSchema } from "@graphql-tools/load";
import { UrlLoader } from "@graphql-tools/url-loader";
import { OperationTypeNode, print } from "graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { stitchSchemas } from "@graphql-tools/stitch";

async function main() {
  const teams = [
    {
      id: "1",
      name: "Greenspot",
    },
    {
      id: "2",
      name: "Pixies",
    },
  ];

  const teamsSchema = makeExecutableSchema({
    typeDefs: /* GraphQL */ `
      type Member {
        id: ID!
      }

      type Team {
        id: ID!
        name: String!
        members: [Member!]!
      }

      type Query {
        teams: [Team!]!
      }
    `,
  });

  const membersSchema = await loadSchema("http://localhost:4001/graphql", {
    loaders: [new UrlLoader()],
  });

  const teamsResolvers = {
    Query: {
      teams: () => {
        return teams.map((team) => {
          return { id: team.id };
        });
      },
    },
    Team: {
      id: ({ id }, args, context, info) => {
        return id;
      },
      name: ({ id }, args, context, info) => {
        return teams.filter((team) => team.id === id)[0].name;
      },
      members: ({ id }, args, context, info) => {
        return delegateToSchema({
          schema: membersSchema,
          operation: OperationTypeNode.QUERY,
          fieldName: "membersByTeam",
          args: {
            teamId: id,
          },
          context,
          info,
        });
      },
    },
  };

  // setup subschema configurations
  const teamsSubschema = { schema: teamsSchema };
  const membersSubschema = { schema: membersSchema };

  // build the combined schema
  const gatewaySchema = stitchSchemas({
    subschemas: [teamsSubschema, membersSubschema],
  });

  // The ApolloServer constructor requires two parameters: your schema
  // definition and your set of resolvers.
  const server = new ApolloServer({
    typeDefs: gatewaySchema,
    resolvers: teamsResolvers,
    context: {},
  });

  // The `listen` method launches a web server.
  server.listen({ port: 4000 }).then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
  });
}

main();
