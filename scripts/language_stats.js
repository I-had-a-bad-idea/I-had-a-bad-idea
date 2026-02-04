const fs = require("fs");
const language_colors = require("./language_colors");

const rm = ["GDScript", "GDShader", "Ruby"]; // Languages taking way too many bytes or languages I didnt activly use.

const data = fs.readFileSync("temp/langs.txt", "utf-8");
const json = JSON.parse(data);
if (json.errors) throw json.errors;

const repos = json.data.user.repositoriesContributedTo.nodes;

// Collect all languages and their size
const totals = {};
repos.forEach(repo => {
    if (!repo?.languages?.edges) return; // If it cant be accessed, doesnt exists, etc.

    repo.languages.edges.forEach(({ size, node}) => {
        if (!rm.includes(node.name)) {
            totals[node.name] = (totals[node.name] || 0) + size;
        }
    });
});

// Sort languages by size
const sorted = Object.entries(totals)
    .sort((a, b) => b[1] - a[1]) // Bytes for language B - bytes for language a -> largest first
    .slice(0, 10); // Keep top 10

// Get total size of all langs in bytes
const sum = sorted.reduce((a, [, v]) => a + v, 0);

let y = 30;
const bars = sorted.map(([lang, size]) => {
    const pct = ((size / sum) * 100).toFixed(1);
    if (pct > 0.5) {
        const color = (language_colors[lang] || "#ff0000ff");
        const bar_width = Math.round((size / sum) * 260);
        const row = `
        <text x="0" y ="${y + 12}" fill="rgba(255, 255, 255, 0.7)" font-size="12">${lang} ${pct}%</text>
        <rect x="0" y="${y + 16}" width="${bar_width}" height="8" fill="${color}" />
        `;
        y += 32;
        return row
    }
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
fs.writeFileSync("temp/top-langs.txt", JSON.stringify(sorted, null, 2));
