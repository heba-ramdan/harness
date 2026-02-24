import { tool } from "@anthropic-ai/claude-agent-sdk";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import TurndownService from "turndown";
import { z } from "zod";

const turndown = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });

const webSearch = tool(
  "web_search",
  "Search the web for current information — markets, competitors, trends, news, research. Returns top results with titles, URLs, and descriptions.",
  {
    query: z.string().describe("Search query"),
    count: z.number().optional().describe("Number of results to return (default 5, max 20)"),
  },
  async ({ query, count = 5 }) => {
    const apiKey = process.env.BRAVE_API_KEY;
    if (!apiKey) {
      return {
        content: [{ type: "text" as const, text: "BRAVE_API_KEY not set. Cannot perform web search." }],
      };
    }

    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.set("q", query);
    url.searchParams.set("count", String(Math.min(count, 20)));

    const res = await fetch(url.toString(), {
      headers: { "X-Subscription-Token": apiKey, Accept: "application/json" },
    });

    if (!res.ok) {
      return {
        content: [{ type: "text" as const, text: `Search failed: ${res.status} ${res.statusText}` }],
      };
    }

    const data = (await res.json()) as {
      web?: { results?: Array<{ title: string; url: string; description: string }> };
    };
    const results = data.web?.results ?? [];

    if (results.length === 0) {
      return { content: [{ type: "text" as const, text: `No results found for: ${query}` }] };
    }

    const formatted = results.map((r, i) => `${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.description}`).join("\n\n");

    return { content: [{ type: "text" as const, text: formatted }] };
  },
  { annotations: { readOnlyHint: true, openWorldHint: true } },
);

const webFetch = tool(
  "web_fetch",
  "Fetch a URL and extract its content as clean markdown. Strips navigation, ads, and chrome. Use for reading articles, reports, documentation, or any web page.",
  {
    url: z.string().url().describe("URL to fetch"),
  },
  async ({ url }) => {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "MastersOfAI-Harness/0.1.0",
      },
    });

    if (!res.ok) {
      return {
        content: [{ type: "text" as const, text: `Fetch failed: ${res.status} ${res.statusText}` }],
      };
    }

    const html = await res.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    let markdown: string;
    if (article?.content) {
      markdown = `# ${article.title}\n\n${turndown.turndown(article.content)}`;
    } else {
      markdown = turndown.turndown(html);
    }

    // Truncate to ~50k chars to avoid overwhelming context
    if (markdown.length > 50000) {
      markdown = `${markdown.slice(0, 50000)}\n\n---\n*[Content truncated at 50,000 characters]*`;
    }

    return { content: [{ type: "text" as const, text: markdown }] };
  },
  { annotations: { readOnlyHint: true, openWorldHint: true } },
);

export const webTools = [webSearch, webFetch];
