import { ApolloServer } from "apollo-server";
import { delegateToSchema } from "@graphql-tools/delegate";
import { loadSchema } from "@graphql-tools/load";
import { UrlLoader } from "@graphql-tools/url-loader";
import { OperationTypeNode, print } from "graphql";

const teams = [
    {
        id: 1,
        name: "Greenspot",
        members: [
            {
                id: 1,
            },
            {
                id: 2,
            },
        ],
    },
    {
        id: 2,
        name: "Pixies",
        members: [
            {
                id: 3,
            },
            {
                id: 4,
            },
        ],
    },
];

const schema = `
    type Member {
        id: ID!
        name: String!
    }

    type Team {
        id: ID!
        name: String!
        members: [Member!]!
    }

    type Query {
        teams: [Team!]!
    }
`;

const resolvers = {
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
        members: ({ id }) => {
            return teams.filter((team) => team.id === id)[0].members;
        },
    },
    Member: {
        id: ({ id }, args, context, info) => {
            return id;
        },
        name: async ({ id }, args, context, info) => {
            const memberAPISchema = await loadSchema("http://localhost:4001", {
                loaders: [new UrlLoader()],
            });

            return delegateToSchema({
                schema: memberAPISchema,
                operation: OperationTypeNode.QUERY,
                fieldName: "membersById",
                args: { id },
                info,
            });
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
server.listen({ port: 4000 }).then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
});
