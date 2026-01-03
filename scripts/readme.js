import fs from "fs";

// Read README
const readme = fs.readFileSync("README.md", "utf-8");

// Normalize line endings to \n
let new_readme = readme.replace(/\r\n/g, "\n");

const ts = Date.now();
// Add timestamp for forced reloading
new_readme = new_readme.replace(
    /!\[Top Languages\]\(assets\/top-langs.svg.*?\)/,
    `![Top Languages](assets/top-langs.svg?ts=${ts})`
);

const data = fs.readFileSync("assets/top-langs.txt", "utf-8");
const top_languages = JSON.parse(data);
// [[lang, size]]


const badges = top_languages.map(lang => {
    const logo = encodeURIComponent(lang[0]);
    return `![${lang[0]}](https://img.shields.io/badge/${logo}-${logo}?style=flat-square&logo=${logo}&logoColor=white)`;
}).join("\n");


const parts = new_readme.split("## Technologies I use");
const before = parts[0];
const after = parts[1].split("## Stuff I am (mostly) proud of")[1];

new_readme = `${before}## Technologies I use\n\n${badges}\n\n## Stuff I am (mostly) proud of${after}`


fs.writeFileSync("README.md", new_readme, "utf-8");