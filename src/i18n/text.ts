/** Keeps a time range on one line: word joiners (U+2060) around the dash stop a line break there. */
export const keep = (s: string) => s.replaceAll('–', '\u2060–\u2060');

/** Keeps a time range or figure in left-to-right order inside Arabic/Kurdish text (U+2066 … U+2069). */
export const ltr = (s: string) => `\u2066${keep(s)}\u2069`;
