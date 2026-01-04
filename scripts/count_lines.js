const fs = require("fs");

const repo_line_data = fs.readFileSync("assets/repo-line-count.txt");
const repo_line_json = JSON.parse(repo_line_data);

const active_repos_data = fs.readFileSync("temp/active-repos");
const active_repos_json = JSON.parse(active_repos_data);


const active_repos = active_repos_json.data.user.repositories.nodes;

all_repos = {};
active_repos.array.forEach(active_repo => {
    all_repos[active_repo.name] = count_lines_in_repo(active_repo.url);
});

function count_lines_in_repo(repo_url) {
    languages = {};
}