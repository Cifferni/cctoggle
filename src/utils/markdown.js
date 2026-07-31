import { marked } from "marked";

// Configure marked options
marked.setOptions({
  gfm: true,        // Enable GitHub Flavored Markdown
  breaks: true,     // Convert line breaks to <br>
});

export function renderMarkdown(content) {
  if (!content) return "";
  try {
    return marked(content);
  } catch (e) {
    console.error("Markdown parse error:", e);
    return content;
  }
}
