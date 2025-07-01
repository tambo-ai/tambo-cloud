/**
 * Generates contextual information based on the current page URL
 * This context is appended to user messages but hidden from the UI
 */
export function generatePageContext(): string {
  if (typeof window === "undefined") return "";

  const pathname = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);

  // Parse the URL to determine the page context
  const contextParts: string[] = [];

  // Dashboard pages
  if (pathname === "/dashboard") {
    contextParts.push(
      "[[__TAMBO_PAGE_CONTEXT__: User is on the main dashboard viewing their projects]]",
    );
  } else if (pathname.match(/^\/dashboard\/[^/]+$/)) {
    const projectId = pathname.split("/")[2];
    contextParts.push(
      `[[__TAMBO_PAGE_CONTEXT__: User is viewing project details page for project ID: ${projectId}]]`,
    );

    // Check for specific tabs or sections
    const tab = searchParams.get("tab");
    if (tab) {
      contextParts.push(
        `[[__TAMBO_TAB_CONTEXT__: Currently viewing the ${tab} tab]]`,
      );
    }
  } else if (pathname.match(/^\/dashboard\/[^/]+\/observability$/)) {
    const projectId = pathname.split("/")[2];
    contextParts.push(
      `[[__TAMBO_PAGE_CONTEXT__: User is on the observability page for project ID: ${projectId}, viewing thread analytics and logs]]`,
    );
  } else if (pathname.match(/^\/dashboard\/[^/]+\/settings$/)) {
    const projectId = pathname.split("/")[2];
    contextParts.push(
      `[[__TAMBO_PAGE_CONTEXT__: User is on the project settings page for project ID: ${projectId}]]`,
    );
  }

  // Authentication pages
  else if (pathname === "/login") {
    contextParts.push("[[__TAMBO_PAGE_CONTEXT__: User is on the login page]]");
  } else if (pathname === "/cli-auth") {
    contextParts.push(
      "[[__TAMBO_PAGE_CONTEXT__: User is in the CLI authentication flow]]",
    );
  } else if (pathname === "/oauth/callback") {
    contextParts.push(
      "[[__TAMBO_PAGE_CONTEXT__: User is in the OAuth callback flow]]",
    );
  }

  // Documentation pages
  else if (pathname.startsWith("/docs")) {
    const docPath = pathname.replace("/docs", "");
    contextParts.push(
      `[[__TAMBO_PAGE_CONTEXT__: User is reading documentation at: ${docPath || "homepage"}]]`,
    );
  }

  // Marketing/Landing pages
  else if (pathname === "/") {
    contextParts.push(
      "[[__TAMBO_PAGE_CONTEXT__: User is on the landing page]]",
    );
  } else if (pathname === "/blog") {
    contextParts.push("[[__TAMBO_PAGE_CONTEXT__: User is browsing the blog]]");
  } else if (pathname.startsWith("/blog/")) {
    const postSlug = pathname.split("/")[2];
    contextParts.push(
      `[[__TAMBO_PAGE_CONTEXT__: User is reading blog post: ${postSlug}]]`,
    );
  }

  // Feature pages
  else if (pathname === "/demo") {
    contextParts.push("[[__TAMBO_PAGE_CONTEXT__: User is on the demo page]]");
  } else if (pathname === "/subscribe") {
    contextParts.push(
      "[[__TAMBO_PAGE_CONTEXT__: User is on the subscription page]]",
    );
  } else if (pathname === "/analytics") {
    contextParts.push("[[__TAMBO_PAGE_CONTEXT__: User is viewing analytics]]");
  } else if (pathname === "/mcp") {
    contextParts.push(
      "[[__TAMBO_PAGE_CONTEXT__: User is on the MCP (Model Context Protocol) page]]",
    );
  } else if (pathname === "/slack") {
    contextParts.push(
      "[[__TAMBO_PAGE_CONTEXT__: User is on the Slack integration page]]",
    );
  }

  // Internal pages
  else if (pathname.startsWith("/internal/smoketest")) {
    contextParts.push(
      "[[__TAMBO_PAGE_CONTEXT__: User is on internal smoke test page]]",
    );
  }

  // Redirect pages
  else if (pathname === "/start") {
    contextParts.push(
      "[[__TAMBO_PAGE_CONTEXT__: User is on the start redirect page]]",
    );
  } else if (pathname === "/slack-waitlist") {
    contextParts.push(
      "[[__TAMBO_PAGE_CONTEXT__: User is on the Slack waitlist redirect page]]",
    );
  }

  // Add any query parameters that might be relevant
  if (searchParams.has("error")) {
    contextParts.push(
      `[[__TAMBO_ERROR_STATE__: ${searchParams.get("error")}]]`,
    );
  }

  return contextParts.length > 0 ? "\n\n" + contextParts.join("\n") : "";
}

/**
 * Appends page context to a user message
 * The context is added at the end to avoid interfering with the main query
 */
export function appendPageContext(userMessage: string): string {
  const context = generatePageContext();
  return userMessage + context;
}
