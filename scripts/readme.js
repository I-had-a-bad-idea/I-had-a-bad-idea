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

const data = fs.readFileSync("assets/top-langs.txt", "utf-8");
const top_languages = JSON.parse(data);
// [[lang, size]]

// Combine technologies
const technologies = [
    ...other_technologies,
    ...top_languages.map(l => l[0])
];

const badges = technologies.map(name => {
    const encoded = encodeURIComponent(name);
    const color = (language_colors[name] || "#cccccc").replace("#", "")
    return `![${name}](https://img.shields.io/badge/${encoded}-${encoded}-${color}?style=flat-square&logo=${encoded}&logoColor=auto)`;
}).join("\n");


const parts = new_readme.split("## Technologies I use");
const before = parts[0];
const after = parts[1].split("## Stuff I am (mostly) proud of")[1];

new_readme = `${before}## Technologies I use\n\n${badges}\n\n## Stuff I am (mostly) proud of${after}`


fs.writeFileSync("README.md", new_readme, "utf-8");