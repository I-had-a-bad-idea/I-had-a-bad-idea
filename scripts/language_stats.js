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
if (json.errors) throw json.errors;

const repos = json.data.user.repositoriesContributedTo.nodes;

// Collect all languages and their size
const totals = {}
repos.forEach(repo => {
    if (!repo?.languages?.edges) return; // If it cant be accessed, doesnt exists, etc.

    repo.languages.edges.forEach(({ size, node}) => {
        totals[node.name] = (totals[node.name] || 0) + size;
    });
});

// Sort languages by size
const sorted = Object.entries(totals)
    .sort((a, b) => b[1] - a[1]) // Bytes for language B - bytes for language a -> largest first
    .slice(0, 10); // Keep top 10

// Get total size of all langs in bytes
const sum = sorted.reduce((a, [, v]) => a + v, 0)

let y = 30;
const bars = sorted.map(([lang, size]) => {
    const pct = ((size / sum) * 100).toFixed(1);
    const bar_width = Math.round((size / sum) * 260);
    const row = `
    <text x="0" y ="${y + 12}" fill="#ffffffff" font-size="12">${lang} ${pct}%</text>
    <rect x="0" y="${y + 16}" width="${bar_width}" height="8" fill="#ff0000ff" />
    `;
    y += 32;
    return row
}).join("");

const svg = `
<svg width="260" height="${y}" viewBox="0 0 260 ${y}"
    xmlns="http://www.w3.org/2000/svg">
    <style>
        text { font-family: system-ui, -apple-system, BlinkMacSystemFont; }
    </style>
    ${bars}
</svg>
`;

fs.mkdirSync("assets", { recursive: true });
fs.writeFileSync("assets/top-langs.svg", svg.trim());
fs.writeFileSync("assets/top-langs.txt", JSON.stringify(sorted, null, 2));