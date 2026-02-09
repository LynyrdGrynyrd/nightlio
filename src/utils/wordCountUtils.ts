/**
 * Strip markdown syntax to get plain text for word counting.
 */
export function stripMarkdown(md: string): string {
  let text = md;
  // Remove headings
  text = text.replace(/^#{1,6}\s+/gm, '');
  // Remove images
  text = text.replace(/!\[.*?\]\(.*?\)/g, '');
  // Remove links but keep link text
  text = text.replace(/\[([^\]]*)\]\(.*?\)/g, '$1');
  // Remove bold/italic markers
  text = text.replace(/(\*{1,3}|_{1,3})(.*?)\1/g, '$2');
  // Remove strikethrough
  text = text.replace(/~~(.*?)~~/g, '$1');
  // Remove inline code
  text = text.replace(/`([^`]*)`/g, '$1');
  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, '');
  // Remove blockquotes
  text = text.replace(/^>\s+/gm, '');
  // Remove horizontal rules
  text = text.replace(/^[-*_]{3,}\s*$/gm, '');
  // Remove list markers
  text = text.replace(/^[\s]*[-*+]\s+/gm, '');
  text = text.replace(/^[\s]*\d+\.\s+/gm, '');
  // Remove table pipes
  text = text.replace(/\|/g, ' ');
  // Remove URLs
  text = text.replace(/https?:\/\/\S+/g, '');
  return text;
}

/**
 * Count words in markdown content (strips syntax first).
 */
export function countWords(md: string): number {
  const text = stripMarkdown(md);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  return words.length;
}

/**
 * Format word count for display.
 */
export function formatWordCount(count: number): string {
  if (count === 1) return '1 word';
  return `${count} words`;
}
