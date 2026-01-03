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

async function send_query(query) {
    // Send query to GraphQL
    const res = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${pat}`, // Authenticate with PAT
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, variables: { login: user } }),
    });

    const json = await res.json();
    return json;
}

async function lang_query() {
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
    json = await send_query(query);
    fs.mkdirSync("assets", { recursive: true });
    fs.writeFileSync("assets/langs.txt", JSON.stringify(json, null, 2));
}

await lang_query();

