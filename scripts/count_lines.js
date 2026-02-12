import fs from "fs";
import { execSync } from "child_process";

const user = process.env.GH_USER;
const pat = process.env.GH_PAT;

let all_repos = {};

const pinned_repos = ["IPL", "ILI", "Rasterization-Renderer", "C-Dictionary", "V.A.C.E", "DocGen"]

if (fs.existsSync("assets/repo-line-counts.txt")) {
    all_repos = JSON.parse(fs.readFileSync("assets/repo-line-counts.txt", "utf-8"));
}


const active_repos_data = fs.readFileSync("temp/active-repos.txt", "utf-8");
const active_repos = JSON.parse(active_repos_data);


function clone_all_repos(repos) {
    try {
        repos.forEach(repo => {
            execSync(
            `git clone https://${user}:${pat}@github.com/${repo.url.split('github.com/')[1]} repos/${repo.name}`,
            { stdio: 'inherit' }
            );
        })
    } catch (e) {
        console.error("Error cloning repos:", e);
    }
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
clone_all_repos(active_repos);
for (let i = 0; i < active_repos.length; i++) {
    let repo_name = active_repos[i].name;
    console.log(`Doing repo: ${repo_name}`);
    all_repos[repo_name] = [
        count_lines_in_repo(repo_name),
        count_commited_lines_in_repo(repo_name)
    ];
};

fs.writeFileSync("assets/repo-line-counts.txt", JSON.stringify(all_repos, null, 2));

let all_lines_added = 0;
let all_lines_removed = 0;

for (const [repo, [, [added, removed]]] of Object.entries(all_repos)) {
    all_lines_added += added;
    all_lines_removed += removed;
}


const readme = fs.readFileSync("README.md", "utf-8");

let new_readme = readme
  // Update "Added" shield
  .replace(
    /!\[Lines Added\]\(https:\/\/img\.shields\.io\/badge\/Added-\d+_lines-brightgreen\)/,
    `![Lines Added](https://img.shields.io/badge/Added-${all_lines_added}_lines-brightgreen)`
  )
  // Update "Removed" shield
  .replace(
    /!\[Lines Removed\]\(https:\/\/img\.shields\.io\/badge\/Removed-\d+_lines-red\)/,
    `![Lines Removed](https://img.shields.io/badge/Removed-${all_lines_removed}_lines-red)`
);

const parts = new_readme.split("### Repo stats");
const before = parts[0];
const after = parts[1].split("### Most active repos this week")[1];

let repo_table = "| Repo | Total Lines | Top Language: loc |\n|------|------------|--------------|\n";

for (const [repo, [langData]] of Object.entries(all_repos)) {
    if (!pinned_repos.includes(repo)) continue;

    const { SUM, Text, ...langs } = langData; // exclude SUM and Text
    // Find top language and its lines
    const top = Object.entries(langs)
        .map(([lang, lines]) => ({ lang, lines }))
        .sort((a, b) => b.lines - a.lines)[0];
    repo_table += `| ${repo} | ${SUM} | ${top.lang}: ${top.lines} |\n`;
}

new_readme = `${before}### Repo stats\n\n${repo_table}\n\n### Most active repos this week${after}`;


fs.writeFileSync("README.md", new_readme);
