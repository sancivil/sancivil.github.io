/** Underlines every "Made in Italy" phrase (EN / AR / KU) with the Italian tricolour. */
const PHRASE = /(Made in Italy|صُنعت? في إيطاليا|صنعت? في إيطاليا|صناعة إيطالية|دروستکراوی ئیتاڵیا)/;
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
