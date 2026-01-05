const fs = require("fs");
const language_colors = require("./language_colors");


const other_technologies = [
    "VS Code",
    "Git",
]

// Read README
const readme = fs.readFileSync("README.md", "utf-8");


const ts = Date.now();
// Add timestamp for forced reloading
let new_readme = readme.replace(
    /!\[Top Languages\]\(assets\/top-langs.svg.*?\)/,
    `![Top Languages](assets/top-langs.svg?ts=${ts})`
);

const lang_data = fs.readFileSync("temp/langs.txt", "utf-8");
const json = JSON.parse(lang_data);
const repos = json.data.user.repositoriesContributedTo.nodes;

const lang_map = {};
for (const repo of repos) {
    if (!repo) continue;
    for (const edge of repo.languages.edges) {
        lang_map[edge.node.name] =
            (lang_map[edge.node.name] || 0) + edge.size;
    }
}

const top_languages = Object.entries(lang_map)
    .sort((a, b) => b[1] - a[1]);

// Combine technologies
const technologies = [
    ...other_technologies,
    ...top_languages.map(l => l[0])
];

const badges = technologies.map(name => {
    const encoded = encodeURIComponent(name);
    const color = (language_colors[name] || "#cccccc").replace("#", "")
    return `![${name}](https://img.shields.io/badge/${encoded}-${encoded}-${color}?style=plastic&logo=${encoded}&logoColor=auto)`;
}).join("\n");


const badges_parts = new_readme.split("## Technologies I use");
const badges_before = badges_parts[0];
const badges_after = badges_parts[1].split("## Stuff I am (mostly) proud of")[1];

new_readme = `${badges_before}## Technologies I use\n\n${badges}\n\n## Stuff I am (mostly) proud of${badges_after}`

// Read json
const repo_data = fs.readFileSync("temp/active-repos.txt", "utf-8");
const most_active_repos = JSON.parse(repo_data);

// Take first repos
const top5_repos = most_active_repos
    // Sort by number of commits desc
    .sort((a, b) => b.defaultBranchRef.target.history.totalCount - a.defaultBranchRef.target.history.totalCount)
    .slice(0, 5); // Get top 5

// Create markdown listing the repos, with name, url and number of commits.
const repo_list_md = top5_repos
    .map(r => `- [${r.name}](${r.url}) (${r.defaultBranchRef.target.history.totalCount} commits)`)
    .join("\n");


const repos_parts = new_readme.split("### Most active repos this week");
const repos_before = repos_parts[0];
const repos_after = repos_parts[1].split("---")[1];



new_readme = `${repos_before}### Most active repos this week\n\n${repo_list_md}\n\n---${repos_after}`;


fs.writeFileSync("README.md", new_readme, "utf-8");
