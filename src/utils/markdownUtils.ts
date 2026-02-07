/**
 * Utilities for parsing and processing markdown content
 */

export interface TitleBody {
  title: string;
  body: string;
}

/**
 * Strip markdown formatting from text for plain-text previews
 * Removes code blocks, images, links, headings, lists, and inline formatting
 */
export const stripMarkdown = (text: string = ''): string => {
  return text
    .replace(/`{1,3}[^`]*`{1,3}/g, ' ')     // code blocks
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')  // images
    .replace(/\[(.*?)\]\([^)]*\)/g, '$1')   // links (keep text)
    .replace(/^#{1,6}\s+/gm, '')            // headings
    .replace(/^[>\-+*]\s+/gm, '')           // blockquotes and lists
    .replace(/[*_~`>#[\]()]/g, ' ')         // inline formatting
    .replace(/\s+/g, ' ')                    // normalize whitespace
    .trim();
};

/**
 * Split markdown content into a title and body
 * Handles multiple formats:
 * - Markdown headings (# Title)
 * - Multi-line content (first line as title)
 * - Single-line content (split at first space)
 */
export const splitTitleBody = (content: string = ''): TitleBody => {
  const text = (content || '').replace(/\r\n/g, '\n').trim();
  if (!text) return { title: '', body: '' };

  const lines = text.split('\n');
  const first = (lines[0] || '').trim();

  // Check for markdown heading
  const heading = first.match(/^#{1,6}\s+(.+?)\s*$/);
  if (heading) {
    return { title: heading[1].trim(), body: lines.slice(1).join('\n').trim() };
  }

  // Multi-line: first line as title, rest as body
  if (lines.length > 1) {
    return { title: first, body: lines.slice(1).join('\n').trim() };
  }

  // Single line: split at first space
  const idx = first.indexOf(' ');
  if (idx > 0) {
    return { title: first.slice(0, idx).trim(), body: first.slice(idx + 1).trim() };
  }

  // Single word only
  return { title: first, body: '' };
};

/**
 * Generate a preview excerpt from markdown content
 * @param content - Markdown content
 * @param maxLength - Maximum length of the excerpt
 */
export const generateExcerpt = (content: string, maxLength: number = 420): string => {
  const { body } = splitTitleBody(content);
  return stripMarkdown(body).slice(0, maxLength);
};

/**
 * Generate a title from markdown content
 * @param content - Markdown content
 * @param maxLength - Maximum length of the title
 */
export const generateTitle = (content: string, maxLength: number = 80): string => {
  const { title } = splitTitleBody(content);
  return stripMarkdown(title).slice(0, maxLength);
};
