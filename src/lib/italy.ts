/**
  Underlines every "Made in Italy" claim with the Italian tricolour, in its canonical phrasings (src/i18n/GLOSSARY.md):
  "Made in Italy"; صُنع في إيطاليا (صُنعت), المصنوعة في إيطاليا and صناعة إيطالية; دروستکراوی ئیتاڵیا. Only whole
  words count, so مصنع في إيطاليا ("a factory in Italy") is no claim; a conjunction joined to the first word or a
  suffix joined to the last stays under the line with it (والمصنوعة في إيطاليا, دروستکراوی ئیتاڵیاوە).
*/
const PHRASE =
  /(?<![\p{L}\p{M}])((?:[Mm]ade in Italy|[وف]?(?:صُ?نعت? في إيطاليا|(?:ال)?مصنوعة في إيطاليا|صناعة إيطالية)|دروستکراوی ئیتاڵیا)[\p{L}\p{M}]*)/u;
const SKIP = new Set(['SCRIPT', 'STYLE', 'TITLE', 'TEXTAREA', 'OPTION', 'svg', 'SVG']);

function mark(root: ParentNode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || SKIP.has(parent.tagName) || parent.closest('.mii, svg, [contenteditable]')) return NodeFilter.FILTER_REJECT;
      return PHRASE.test(node.nodeValue ?? '') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  for (const node of nodes) {
    const parts = (node.nodeValue ?? '').split(PHRASE);
    const frag = document.createDocumentFragment();
    parts.forEach((part, i) => {
      if (!part) return;
      if (i % 2 === 1) {
        const span = document.createElement('span');
        span.className = 'mii';
        span.textContent = part;
        frag.append(span);
      } else {
        frag.append(part);
      }
    });
    node.replaceWith(frag);
  }
}

mark(document.body);
