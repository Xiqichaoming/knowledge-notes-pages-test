import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const workspaceRoot = "D:/Desktop/CodeProjects/Notes";
const sourceRoot = path.join(workspaceRoot, "知识仓库");
const publishRoot = path.join(workspaceRoot, "notes-publish");
const siteRoot = path.join(workspaceRoot, "notes-site");
const publicBase = "/knowledge-notes";
const configPath = path.join(publishRoot, "manifest", "publish.config.json");
const publishNotesDir = path.join(publishRoot, "notes");
const publishAssetsDir = path.join(publishRoot, "assets");
const siteNotesDir = path.join(siteRoot, "src", "content", "notes");
const siteAssetsDir = path.join(siteRoot, "public", "assets");

const imagePattern = /!\[\[([^\]]+)\]\]/g;
const wikiLinkPattern = /\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g;
const codeFencePattern = /^```([A-Za-z][A-Za-z0-9#+-]*)([^\n\r]*)$/gm;

const ensureDir = async (dirPath) => {
  await fs.mkdir(dirPath, { recursive: true });
};

const emptyDir = async (dirPath) => {
  await fs.rm(dirPath, { recursive: true, force: true });
  await ensureDir(dirPath);
};

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const categoryLabelMap = {
  ai: "AI Notes",
  python: "Python Notes",
  rust: "Rust Notes"
};

const loadConfig = async () => {
  const raw = await fs.readFile(configPath, "utf8");
  return JSON.parse(raw);
};

const findAttachment = async (noteDir, attachmentName) => {
  const directCandidate = path.join(noteDir, "附件", attachmentName);
  try {
    await fs.access(directCandidate);
    return directCandidate;
  } catch {}

  const siblingEntries = await fs.readdir(noteDir, { withFileTypes: true });
  for (const entry of siblingEntries) {
    if (!entry.isDirectory()) continue;
    if (!entry.name.includes("附件")) continue;
    const candidate = path.join(noteDir, entry.name, attachmentName);
    try {
      await fs.access(candidate);
      return candidate;
    } catch {}
  }

  return null;
};

const copyAsset = async (sourcePath, assetName) => {
  const targetPath = path.join(publishAssetsDir, assetName);
  await ensureDir(path.dirname(targetPath));
  await fs.copyFile(sourcePath, targetPath);
  await fs.copyFile(sourcePath, path.join(siteAssetsDir, assetName));
  return `/assets/${encodeURIComponent(assetName)}`;
};

const buildLookup = (selectedNotes) => {
  const map = new Map();
  for (const note of selectedNotes) {
    const sourceBase = path.basename(note.source, ".md");
    map.set(sourceBase, note.slug);
    map.set(note.title, note.slug);
  }
  return map;
};

const normalizeDisplayMathLines = (value) => {
  let inCodeFence = false;
  return value
    .split(/\r?\n/)
    .map((line) => {
      if (line.trimStart().startsWith("```")) {
        inCodeFence = !inCodeFence;
        return line;
      }
      if (inCodeFence) return line;

      const match = line.match(/^([ \t]*)\$\$([^\n\r]+?)\$\$[ \t]*$/);
      if (!match) return line;

      const [, indent, formula] = match;
      const trimmedFormula = formula.trim();
      if (!trimmedFormula) return line;
      return `${indent}$$\n${indent}${trimmedFormula}\n${indent}$$`;
    })
    .join("\n");
};

const normalizeBody = async (body, noteDir, linkLookup, missingRefs) => {
  let output = body;

  output = normalizeDisplayMathLines(output);

  const imageMatches = [...body.matchAll(imagePattern)];
  for (const match of imageMatches) {
    const fileName = match[1].trim();
    const assetPath = await findAttachment(noteDir, fileName);
    if (!assetPath) {
      missingRefs.push({ type: "asset", value: fileName });
      output = output.replace(match[0], `![Missing asset: ${fileName}]()`);
      continue;
    }
    await copyAsset(assetPath, fileName);
    output = output.replace(
      match[0],
      `![${fileName}](${publicBase}/assets/${encodeURIComponent(fileName)})`
    );
  }

  output = output.replace(wikiLinkPattern, (_, target, anchor, label) => {
    const trimmedTarget = target.trim();
    const targetSlug = linkLookup.get(trimmedTarget);
    const linkLabel = (label || trimmedTarget).trim();
    if (!targetSlug) {
      missingRefs.push({ type: "link", value: trimmedTarget });
      return linkLabel;
    }
    const hash = anchor ? `#${slugify(anchor)}` : "";
    return `[${linkLabel}](${publicBase}/notes/${targetSlug}/${hash})`;
  });

  output = output.replace(codeFencePattern, (_, language, rest) => `\`\`\`${language.toLowerCase()}${rest}`);

  return output;
};

const frontmatterFor = (note) => ({
  title: note.title,
  slug: note.slug,
  summary: note.summary,
  category: note.category,
  categoryLabel: categoryLabelMap[note.category] ?? note.category,
  tags: note.tags,
  updated: new Date().toISOString().slice(0, 10),
  source: note.source,
  draft: false
});

const toFrontmatterString = (data) => {
  const lines = ["---"];
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.map((item) => JSON.stringify(item)).join(", ")}]`);
      continue;
    }
    lines.push(`${key}: ${JSON.stringify(value)}`);
  }
  lines.push("---", "");
  return lines.join("\n");
};

const main = async () => {
  const config = await loadConfig();
  await emptyDir(publishNotesDir);
  await emptyDir(publishAssetsDir);
  await emptyDir(siteNotesDir);
  await emptyDir(siteAssetsDir);

  const linkLookup = buildLookup(config.selectedNotes);
  const manifest = [];

  for (const note of config.selectedNotes) {
    const sourcePath = path.join(sourceRoot, note.source);
    const raw = await fs.readFile(sourcePath, "utf8");
    const parsed = matter(raw);
    const missingRefs = [];
    const normalizedBody = await normalizeBody(
      parsed.content,
      path.dirname(sourcePath),
      linkLookup,
      missingRefs
    );
    const output = `${toFrontmatterString(frontmatterFor(note))}${normalizedBody.trim()}\n`;
    const publishPath = path.join(publishNotesDir, `${note.slug}.md`);
    const sitePath = path.join(siteNotesDir, `${note.slug}.md`);

    await fs.writeFile(publishPath, output, "utf8");
    await fs.writeFile(sitePath, output, "utf8");

    manifest.push({
      slug: note.slug,
      title: note.title,
      source: note.source,
      missingRefs
    });
  }

  await fs.writeFile(
    path.join(publishRoot, "manifest", "last-run.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        noteCount: manifest.length,
        notes: manifest
      },
      null,
      2
    ),
    "utf8"
  );
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
