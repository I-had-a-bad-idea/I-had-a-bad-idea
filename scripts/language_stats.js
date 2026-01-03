import fetch from "node-fetch";
import fs from "fs";


const user = process.env.GH_USER;
const pat = process.env.GH_PAT;


if (!pat || !user) {
    console.error("Missing user or pat");
    process.exit(1);
}

const query = `
query ($login: String!) {
    user(login: $login) {
        repositoriesContributedTo(
        first: 100
        contributionTypes: [COMMIT, PULL_REQUEST]
        includeUserRepositories: true
        ) {
            nodes {
                languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
                    edges {
                    size
                    node { name }
                    }
                }  
            } 
        }
    }
}
`;

const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
        Authorization: `Bearer ${pat}`,
        "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables: { login: user } }),
});

const json = await res.json()
console.log(json);