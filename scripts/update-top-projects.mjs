// Rebuilds the "Top public projects on GitHub" table in README.md from the GitHub API.
// Run by .github/workflows/top-projects.yml; can also be run locally with `node scripts/update-top-projects.mjs`.
import { readFile, writeFile } from "node:fs/promises";

const USER = "mwandotheboss";
const COUNT = 6;
const README = new URL("../README.md", import.meta.url);
const START = "<!-- TOP-PROJECTS:START -->";
const END = "<!-- TOP-PROJECTS:END -->";

// Used only while a repository has no description set on GitHub.
const FALLBACK_DESCRIPTIONS = {
  "Obuyanzi-Hymns": "A digital home for traditional Luhya hymns, in Luhya and English",
  "Dahua-ANPR-Integrations": "Node.js integration for Dahua ANPR cameras: snapshots, digest authentication and real-time number plate recognition",
  "Dahua-DSS-Integration": "Integration with the Dahua DSS platform",
  "Dahua-Access-Control-Attendance-Integrations": "Access control and attendance integrations for Dahua devices",
  "A-Basic-Social-App": "A basic social app on React, Node.js, Express, MySQL and Sequelize",
};

const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const headers = { Accept: "application/vnd.github+json", "User-Agent": USER };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const res = await fetch(`https://api.github.com/users/${USER}/repos?per_page=100&type=owner`, { headers });
if (!res.ok) throw new Error(`GitHub API returned ${res.status}: ${await res.text()}`);

const repos = (await res.json())
  .filter((r) => !r.fork && !r.archived && !r.private && r.name !== USER)
  .sort((a, b) => b.stargazers_count - a.stargazers_count || new Date(b.pushed_at) - new Date(a.pushed_at))
  .slice(0, COUNT);
if (repos.length === 0) throw new Error("No repositories returned; leaving README unchanged.");

const rows = repos.map((r) => {
  const description = r.description || FALLBACK_DESCRIPTIONS[r.name] || "";
  return `  <tr>
    <td><a href="${r.html_url}"><b>${escapeHtml(r.name)}</b></a></td>
    <td>${escapeHtml(description)}</td>
    <td>${escapeHtml(r.language || "")}</td>
    <td align="center">${r.stargazers_count}</td>
  </tr>`;
});

const table = `<table>
  <tr>
    <th width="330" align="left">Repository</th>
    <th width="520" align="left">What it does</th>
    <th width="130" align="left">Built with</th>
    <th width="60">⭐</th>
  </tr>
${rows.join("\n")}
</table>`;

const readme = await readFile(README, "utf8");
const start = readme.indexOf(START);
const end = readme.indexOf(END);
if (start === -1 || end === -1 || end < start) throw new Error("TOP-PROJECTS markers not found in README.md");

const updated = `${readme.slice(0, start + START.length)}\n${table}\n${readme.slice(end)}`;
if (updated === readme) {
  console.log("Top projects already up to date.");
} else {
  await writeFile(README, updated);
  console.log(`Updated top projects: ${repos.map((r) => r.name).join(", ")}`);
}
