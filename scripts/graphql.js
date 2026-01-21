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

async function send_query(query, variables) {
    // Send query to GraphQL
    const res = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${pat}`, // Authenticate with PAT
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, variables: variables }),
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
    const json = await send_query(query, { login: user });
    fs.writeFileSync("temp/langs.txt", JSON.stringify(json, null, 2));
}

async function most_active_repos_query() {
    const one_week_in_ms = 7 * 24 * 60 * 60 * 1000;
    const one_hour_in_ms =      1 * 60 * 60 * 1000;
    const since = new Date(Date.now() - (one_week_in_ms + one_hour_in_ms)).toISOString(); // Last week + one extra hour
    const query = `
    query($login: String!, $since: GitTimestamp!) {
        user(login: $login) {
            repositories(first: 50, orderBy: {field: PUSHED_AT, direction: DESC}) {
                nodes {
                name
                url
                defaultBranchRef {
                    target {
                        ...on Commit {
                            history(since: $since) {
                                totalCount
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    `;
    const json = await send_query(query, { login: user, since: since });
    const filtered = json.data.user.repositories.nodes.filter(
        repo => repo?.defaultBranchRef?.target?.history?.totalCount > 0
    );
    fs.writeFileSync("temp/active-repos.txt", JSON.stringify(filtered, null, 2));
}


fs.mkdirSync("temp", { recursive: true });

await lang_query();
await most_active_repos_query();
