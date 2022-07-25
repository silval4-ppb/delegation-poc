import { ApolloServer } from "apollo-server";

const members = [
    {
        id: "1",
        name: "Luca",
    },
    {
        id: "2",
        name: "Lara",
    },
    {
        id: "3",
        name: "Maia",
    },
    {
        id: "4",
        name: "Rui",
    },
];

const schema = `
    type Member {
        id: ID!
        name: String!
    }

    type Query {
        membersById(id: ID!): Member
    }
`;

const resolvers = {
    Query: {
        membersById: (_, { id }) => {
            console.log("received id", id);
            return members.find((member) => member.id === id);
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
