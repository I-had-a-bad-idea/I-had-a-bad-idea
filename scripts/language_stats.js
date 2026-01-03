import fetch from "node-fetch";
import fs from "fs";

// Get user and PAT
const user = process.env.GH_USER;
const pat = process.env.GH_PAT;

// Throw error if missing
if (!pat || !user) {
    console.error("Missing user or pat");
    process.exit(1);
}

// Declare query
// Take first 100 repos a commit/PR was made to, include the users repos
// Get the first 10 languages from them, sort descending by size.
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

// Send query to GraphQL
const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
        Authorization: `Bearer ${pat}`, // Authenticate with PAT
        "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables: { login: user } }),
});

const json = await res.json()
const repos = json.data.user.repositoriesContributedTo.nodes;

// Collect all languages and their size
const totals = {}
repos.forEach(repo => {
    repo.languages.edges.forEach(({ size, node}) => {
        totals[node.name] = (totals[node.name] || 0) + size;
    });
});

// Sort languages by size
const sorted = Object.entries(totals)
    .sort((a, b) => b[1] - a[1]) // Bytes for language B - bytes for language a -> largest first
    .slice(0, 6); // Keep top 6

// Get total size of all langs in bytes
const sum = sorted.reduce((a, [, v]) => a + v, 0)


