import { ApolloServer } from "apollo-server";
import { delegateToSchema } from "@graphql-tools/delegate";
import { loadSchema } from "@graphql-tools/load";
import { UrlLoader } from "@graphql-tools/url-loader";
import { OperationTypeNode, print } from "graphql";
import { stitchSchemas } from "@graphql-tools/stitch";
import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader";
import { NestedDelegationTransform } from "./NestedDelegationTransform";
// import { RenameTypes } from "@graphql-tools/wrap";

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

  const teamsSchema = await loadSchema("./src/schema.graphql", {
    loaders: [new GraphQLFileLoader()],
  });

  const membersSchema = await loadSchema("http://localhost:4001/graphql", {
    loaders: [new UrlLoader()],
  });

  const scaSchema = await loadSchema("http://scapp.nxt.internal/graphql", {
    loaders: [new UrlLoader()],
  });

  const teamsResolvers = {
    Query: {
      nestedMembers: (parent, args, context, info) => {
        return delegateToSchema({
          schema: membersSchema,
          operation: OperationTypeNode.QUERY,
          fieldName: "nested.members",
          transforms: [new NestedDelegationTransform()],
          context,
          info,
        });
      },
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
      football: (_, args, context, info) => {
        return delegateToSchema({
          schema: scaSchema,
          operation: OperationTypeNode.QUERY,
          fieldName: "football",
          context,
          info,
        });
      },
      footballCompetition: (parent, args, context, info) => {
        return delegateToSchema({
          schema: scaSchema,
          operation: OperationTypeNode.QUERY,
          fieldName: "football.competition",
          // args: {
          //   ids: args.ids,
          // },
          transforms: [new NestedDelegationTransform()],
          context,
          info,
        });
      },
    },
  };

  // setup subschema configurations
  const teamsSubschema = {
    schema: teamsSchema,
  };

  const membersSubschema = {
    schema: membersSchema,
    // transforms: [new RenameTypes((name) => `MemberAPI_${name}`)],
  };

  const footballSubschema = {
    schema: scaSchema,
  };

  // build the combined schema
  const gatewaySchema = stitchSchemas({
    subschemas: [teamsSubschema, membersSubschema, footballSubschema],
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
