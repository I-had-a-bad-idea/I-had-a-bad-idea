import fs from "fs";
import { execSync } from "child_process";

let all_repos = {};

if (fs.existsSync("assets/repo-line-counts.txt")) {
    all_repos = JSON.parse(fs.readFileSync("assets/repo-line-counts.txt", "utf-8"));
}


const active_repos_data = fs.readFileSync("temp/active-repos.txt", "utf-8");
const active_repos_json = JSON.parse(active_repos_data);


const active_repos = active_repos_json.data.user.repositories.nodes;

function count_lines_in_repo(repo_name, repo_url) {
    execSync(`git clone ${repo_url} repos/${repo_name}`);

    execSync(`cloc --json repos/${repo_name} > temp/${repo_name}.json`);

    let langs = {};
    const langs_in_repo = JSON.parse(fs.readFileSync(`temp/${repo_name}.json`));

    // fs.writeFileSync("temp/lines", JSON.stringify(langs_in_repo, null, 2));
    for (const [lang, status] of Object.entries(langs_in_repo)) {
        if (!status.code) continue;
        langs[lang] = status.code;
    }

    return langs;
}

fs.mkdirSync("repos", { recursive: true });
fs.mkdirSync("temp", { recursive: true });
active_repos.forEach(active_repo => {
    all_repos[active_repo.name] = count_lines_in_repo(active_repo.name, active_repo.url);
});


fs.writeFileSync("assets/repo-line-counts.txt", JSON.stringify(all_repos, null, 2));