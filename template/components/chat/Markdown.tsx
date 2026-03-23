import { type ReactNode } from "react";

function parseLine(line: string): ReactNode {
  // Bold
  let parts = line.split(/\*\*(.+?)\*\*/g);
  if (parts.length > 1) {
    return parts.map((part, i) =>
      i % 2 === 1 ? <strong key={i}>{part}</strong> : part
    );
  }

  // Inline code
  parts = line.split(/`(.+?)`/g);
  if (parts.length > 1) {
    return parts.map((part, i) =>
      i % 2 === 1 ? (
        <code
          key={i}
          className="bg-bg-tertiary text-accent px-1 py-0.5 rounded text-xs"
        >
          {part}
        </code>
      ) : (
        part
      )
    );
  }

  return line;
}

export function Markdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <pre
          key={elements.length}
          className="bg-bg-tertiary border border-border rounded-lg p-3 my-2 overflow-x-auto"
        >
          <code className="text-xs text-text-primary">{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    // Heading
    if (line.startsWith("### ")) {
      elements.push(
        <p key={elements.length} className="font-semibold text-sm mt-2 mb-1">
          {line.slice(4)}
        </p>
      );
      i++;
      continue;
    }

    if (line.startsWith("## ")) {
      elements.push(
        <p key={elements.length} className="font-semibold mt-2 mb-1">
          {line.slice(3)}
        </p>
      );
      i++;
      continue;
    }

    // Bullet list
    if (line.match(/^[-*] /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*] /)) {
        items.push(lines[i].replace(/^[-*] /, ""));
        i++;
      }
      elements.push(
        <ul key={elements.length} className="list-disc list-inside space-y-0.5 my-1">
          {items.map((item, j) => (
            <li key={j} className="text-sm">
              {parseLine(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (line.match(/^\d+\. /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        items.push(lines[i].replace(/^\d+\. /, ""));
        i++;
      }
      elements.push(
        <ol key={elements.length} className="list-decimal list-inside space-y-0.5 my-1">
          {items.map((item, j) => (
            <li key={j} className="text-sm">
              {parseLine(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={elements.length} className="text-sm">
        {parseLine(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-1">{elements}</div>;
}
