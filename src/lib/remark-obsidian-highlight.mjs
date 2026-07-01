const parseHighlightText = (value) => {
  const nodes = [];
  const pattern = /==(?=\S)(.+?\S)==/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(value))) {
    const [raw, highlighted] = match;

    if (!highlighted.trim()) {
      continue;
    }

    if (match.index > lastIndex) {
      nodes.push({ type: "text", value: value.slice(lastIndex, match.index) });
    }

    nodes.push({ type: "html", value: "<mark>" });
    nodes.push({ type: "text", value: highlighted });
    nodes.push({ type: "html", value: "</mark>" });
    lastIndex = match.index + raw.length;
  }

  if (!nodes.length) {
    return null;
  }

  if (lastIndex < value.length) {
    nodes.push({ type: "text", value: value.slice(lastIndex) });
  }

  return nodes;
};

const transformTextChildren = (node) => {
  if (!node || !Array.isArray(node.children)) {
    return;
  }

  const children = [];
  let changed = false;

  for (const child of node.children) {
    if (child.type === "text") {
      const parsed = parseHighlightText(child.value);
      if (parsed) {
        children.push(...parsed);
        changed = true;
        continue;
      }
    }

    transformTextChildren(child);
    children.push(child);
  }

  if (changed) {
    node.children = children;
  }
};

export default function remarkObsidianHighlight() {
  return (tree) => {
    transformTextChildren(tree);
  };
}
