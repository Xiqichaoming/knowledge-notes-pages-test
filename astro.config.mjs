import { defineConfig } from "astro/config";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkObsidianHighlight from "./src/lib/remark-obsidian-highlight.mjs";

export default defineConfig({
  site: "https://Xiqichaoming.github.io",
  base: "/knowledge-notes",
  output: "static",
  markdown: {
    remarkPlugins: [remarkMath, remarkObsidianHighlight],
    rehypePlugins: [rehypeKatex]
  }
});
