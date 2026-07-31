import type { Plugin } from "vite";

const SOURCE = "src/assets/homelast-logo.webp";

/**
 * Injects a <link rel="preload" as="image"> for the LCP logo into index.html.
 * In dev it points at the source path; in build it resolves the hashed
 * filename emitted by Rollup so the preload always matches the real asset.
 */
export function preloadLogo(): Plugin {
  return {
    name: "preload-logo",
    enforce: "post",
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        let href = `/${SOURCE}`;

        if (ctx.bundle) {
          const match = Object.values(ctx.bundle).find(
            (chunk) =>
              chunk.type === "asset" &&
              typeof chunk.originalFileName === "string" &&
              chunk.originalFileName.replace(/\\/g, "/").endsWith(SOURCE),
          );
          if (match) href = `/${match.fileName}`;
        }

        // Avoid duplicating an existing preload for the same resource.
        if (html.includes(`rel="preload"`) && html.includes(href)) return html;

        return {
          html,
          tags: [
            {
              tag: "link",
              attrs: {
                rel: "preload",
                as: "image",
                href,
                type: "image/webp",
                fetchpriority: "high",
              },
              injectTo: "head-prepend",
            },
          ],
        };
      },
    },
  };
}
