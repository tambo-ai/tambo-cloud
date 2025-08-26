export const CODE_INDICATORS = [
  /^import\s+/m,
  /^function\s+/m,
  /^class\s+/m,
  /^const\s+/m,
  /^let\s+/m,
  /^var\s+/m,
  /[{}[\]();]/,
  /^\s*\/\//m,
  /^\s*\/\*/m,
  /=>/,
  /^export\s+/m,
];

export const MDX_STYLES = {
  // Typography
  paragraph: "mb-6 leading-relaxed text-gray-700",
  h1: "text-4xl font-bold mb-8 mt-12 text-gray-900 border-b border-gray-200 pb-4",
  h2: "text-3xl font-bold mb-6 mt-10 text-gray-900",
  h3: "text-2xl font-semibold mb-4 mt-8 text-gray-900",
  h4: "text-xl font-semibold mb-3 mt-6 text-gray-900",

  // Lists
  ul: "list-disc pl-6 mb-6 text-gray-700 flex flex-col gap-2",
  ol: "list-decimal pl-6 mb-6 text-gray-700 flex flex-col gap-2",
  li: "leading-relaxed",

  // Others
  blockquote:
    "border-l-4 border-blue-500 bg-blue-50 pl-6 py-4 my-6 italic text-gray-800 rounded-r-lg",
  link: "font-medium rounded hover:bg-blue-50 underline transition-colors inline-flex items-center",
  hr: "my-4 border-gray-300",
  inlineCode: "bg-gray-100 px-2 py-1 rounded text-sm font-mono text-pink-600",

  // Tables
  tableWrapper: "overflow-x-auto my-6 rounded-lg border border-gray-200",
  table: "min-w-full divide-y divide-gray-200",
  th: "px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
  td: "px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-t border-gray-200",

  // Code blocks
  codeContainer:
    "relative border border-gray-200 rounded-lg bg-gray-50 max-w-full text-sm mt-6 mb-6 overflow-hidden",
  codeHeader:
    "flex items-center justify-between gap-4 rounded-t-lg bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 border-b border-gray-200",
  codeScrollArea: "overflow-x-auto bg-gray-50",

  // Images
  imageContainer: "my-8",
  image: "w-full rounded-lg shadow-lg",
  imageCaption: "text-center text-sm text-gray-500 mt-2 italic",
} as const;
