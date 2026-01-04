import fs from "fs";
import { execSync } from "child_process";

const user = process.env.GH_USER;
// const user = "I-had-a-bad-idea";

let all_repos = {};

if (fs.existsSync("assets/repo-line-counts.txt")) {
    all_repos = JSON.parse(fs.readFileSync("assets/repo-line-counts.txt", "utf-8"));
}


const active_repos_data = fs.readFileSync("temp/active-repos.txt", "utf-8");
const active_repos_json = JSON.parse(active_repos_data);


const active_repos = active_repos_json.data.user.repositories.nodes;

function clone_all_repos(repos) {
    repos.forEach(repo => {
        execSync(`git clone ${repo.url} repos/${repo.name}`, { stdio: 'inherit' });
    })
}

function count_lines_in_repo(repo_name) {

    execSync(`cloc --json repos/${repo_name} > temp/${repo_name}.json`, { stdio: 'inherit' });

    let langs = {};
    const langs_in_repo = JSON.parse(fs.readFileSync(`temp/${repo_name}.json`));

    for (const [lang, status] of Object.entries(langs_in_repo)) {
        if (!status.code) continue;
        langs[lang] = status.code;
    }

    return langs;
}

function count_commited_lines_in_repo(repo_name) {
    const cmd = `git -C repos/${repo_name} log --author "${user}" --pretty=tformat: --numstat`;
    const output = execSync(cmd, { encoding: "utf-8", stdio: `pipe` });

    let added = 0;
    let removed = 0;

    output.split("\n").forEach(line => {
        const parts = line.trim().split("\t");
        if (parts.length < 2) return;
        added += parseInt(parts[0]) || 0;
        removed += parseInt(parts[1]) || 0;
    })

    return [added, removed];
}

fs.mkdirSync("repos", { recursive: true });
fs.mkdirSync("temp", { recursive: true });
// clone_all_repos(active_repos);
for (let i = 0; i < active_repos.length; i++) {
    let repo_name = active_repos[i].name;
    console.log(`Doing repo: ${repo_name}`);
    all_repos[repo_name] = [
        count_lines_in_repo(repo_name),
        count_commited_lines_in_repo(repo_name)
    ];
};

fs.writeFileSync("assets/repo-line-counts.txt", JSON.stringify(all_repos, null, 2));