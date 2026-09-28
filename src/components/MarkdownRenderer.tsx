import React, { useState } from 'react';
import { Check, Copy, ExternalLink, Info, AlertTriangle, Lightbulb } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  // Découpage en blocs (code, tableaux, listes, citations, titres, paragraphes)
  const renderBlocks = () => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // 1. Fenced Code Block: ```lang ... ```
      if (line.trim().startsWith('```')) {
        const lang = line.trim().slice(3).trim() || 'code';
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        i++; // skip closing ```
        const codeText = codeLines.join('\n');
        elements.push(<CodeBlock key={`code-${i}`} code={codeText} language={lang} />);
        continue;
      }

      // 2. Tableaux Markdown: lignes commençant par |
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          tableLines.push(lines[i]);
          i++;
        }
        elements.push(<TableBlock key={`table-${i}`} lines={tableLines} />);
        continue;
      }

      // 3. Blockquotes & Callouts: > texte
      if (line.trim().startsWith('>')) {
        const quoteLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('>')) {
          quoteLines.push(lines[i].replace(/^>\s?/, ''));
          i++;
        }
        elements.push(<CalloutBlock key={`quote-${i}`} text={quoteLines.join('\n')} />);
        continue;
      }

      // 4. Titres (Headings)
      if (line.startsWith('#')) {
        const match = line.match(/^(#{1,4})\s+(.+)$/);
        if (match) {
          const level = match[1].length;
          const text = match[2];
          elements.push(<HeadingBlock key={`heading-${i}`} level={level} text={text} />);
          i++;
          continue;
        }
      }

      // 5. Ligne de séparation horizontale: --- ou ***
      if (line.trim() === '---' || line.trim() === '***' || line.trim() === '___') {
        elements.push(<hr key={`hr-${i}`} className="my-4 border-gray-200 dark:border-gray-700" />);
        i++;
        continue;
      }

      // 6. Listes à puces (- item ou * item)
      if (line.match(/^(\s*)[-*]\s+(.+)$/)) {
        const listItems: string[] = [];
        while (i < lines.length && lines[i].match(/^(\s*)[-*]\s+(.+)$/)) {
          const m = lines[i].match(/^(\s*)[-*]\s+(.+)$/);
          if (m) listItems.push(m[2]);
          i++;
        }
        elements.push(
          <ul key={`ul-${i}`} className="space-y-1.5 my-2.5 pl-1">
            {listItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm leading-relaxed text-gray-800">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-600 mt-2 shrink-0" />
                <span className="flex-1">{renderInline(item)}</span>
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // 7. Listes numérotées (1. item)
      if (line.match(/^(\s*)\d+\.\s+(.+)$/)) {
        const listItems: string[] = [];
        while (i < lines.length && lines[i].match(/^(\s*)\d+\.\s+(.+)$/)) {
          const m = lines[i].match(/^(\s*)\d+\.\s+(.+)$/);
          if (m) listItems.push(m[2]);
          i++;
        }
        elements.push(
          <ol key={`ol-${i}`} className="space-y-2 my-2.5 pl-1">
            {listItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm leading-relaxed text-gray-800">
                <span className="w-5 h-5 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="flex-1">{renderInline(item)}</span>
              </li>
            ))}
          </ol>
        );
        continue;
      }

      // 8. Ligne vide
      if (!line.trim()) {
        i++;
        continue;
      }

      // 9. Paragraphe régulier
      const paraLines: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim() &&
        !lines[i].trim().startsWith('```') &&
        !lines[i].trim().startsWith('|') &&
        !lines[i].trim().startsWith('>') &&
        !lines[i].startsWith('#') &&
        !lines[i].match(/^(\s*)[-*]\s+/) &&
        !lines[i].match(/^(\s*)\d+\.\s+/) &&
        lines[i].trim() !== '---'
      ) {
        paraLines.push(lines[i]);
        i++;
      }
      if (paraLines.length > 0) {
        elements.push(
          <p key={`p-${i}`} className="text-sm leading-relaxed text-gray-800 my-2">
            {renderInline(paraLines.join(' '))}
          </p>
        );
      }
    }

    return elements;
  };

  return <div className="markdown-body space-y-1 font-sans">{renderBlocks()}</div>;
};

// Composant Code Block avec bouton Copier
const CodeBlock: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-slate-700/60 shadow-sm bg-slate-900 text-slate-100">
      <div className="px-3.5 py-1.5 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between text-xs text-slate-300 font-mono">
        <span className="uppercase font-semibold text-[11px] tracking-wider text-primary-300">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs"
          title="Copier le code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copié !</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copier</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 text-xs font-mono leading-relaxed overflow-x-auto text-slate-100 selection:bg-primary-600">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// Composant Tableau Markdown
const TableBlock: React.FC<{ lines: string[] }> = ({ lines }) => {
  if (lines.length < 2) return null;

  const parseRow = (line: string) => {
    return line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());
  };

  const headers = parseRow(lines[0]);
  // Déterminer s'il y a une ligne de séparation standard |---|---|
  const hasDivider = lines.length > 1 && lines[1].includes('-');
  const bodyRows = (hasDivider ? lines.slice(2) : lines.slice(1)).map(parseRow);

  return (
    <div className="my-3.5 overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
      <table className="w-full text-xs text-left border-collapse">
        <thead className="bg-primary-50/80 text-primary-900 font-semibold border-b border-primary-100 uppercase tracking-wider text-[11px]">
          <tr>
            {headers.map((h, idx) => (
              <th key={idx} className="px-3.5 py-2.5">
                {renderInline(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {bodyRows.map((row, rIdx) => (
            <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-3.5 py-2 text-gray-700">
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Composant En-têtes (Headings)
const HeadingBlock: React.FC<{ level: number; text: string }> = ({ level, text }) => {
  const content = renderInline(text);
  switch (level) {
    case 1:
      return (
        <h1 className="text-base sm:text-lg font-bold text-gray-900 mt-4 mb-2 pb-1.5 border-b border-gray-100 flex items-center gap-2">
          {content}
        </h1>
      );
    case 2:
      return (
        <h2 className="text-sm sm:text-base font-bold text-primary-800 mt-3.5 mb-1.5 flex items-center gap-2">
          {content}
        </h2>
      );
    case 3:
      return (
        <h3 className="text-sm font-semibold text-gray-800 mt-3 mb-1">
          {content}
        </h3>
      );
    default:
      return (
        <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mt-2 mb-1">
          {content}
        </h4>
      );
  }
};

// Composant Encadrés (Callouts & Quotes)
const CalloutBlock: React.FC<{ text: string }> = ({ text }) => {
  let isTip = false;
  let isWarning = false;
  let cleanText = text;

  if (text.includes('[!NOTE]') || text.includes('[!INFO]')) {
    cleanText = text.replace(/\[!(NOTE|INFO)\]\s?/, '');
  } else if (text.includes('[!TIP]') || text.includes('[!ASTUCE]')) {
    isTip = true;
    cleanText = text.replace(/\[!(TIP|ASTUCE)\]\s?/, '');
  } else if (text.includes('[!WARNING]') || text.includes('[!ATTENTION]')) {
    isWarning = true;
    cleanText = text.replace(/\[!(WARNING|ATTENTION)\]\s?/, '');
  }

  let bgClass = 'bg-primary-50/70 border-primary-500 text-primary-950';
  let Icon = Info;
  let iconClass = 'text-primary-600';

  if (isTip) {
    bgClass = 'bg-amber-50/80 border-amber-500 text-amber-950';
    Icon = Lightbulb;
    iconClass = 'text-amber-600';
  } else if (isWarning) {
    bgClass = 'bg-rose-50/80 border-rose-500 text-rose-950';
    Icon = AlertTriangle;
    iconClass = 'text-rose-600';
  }

  return (
    <div className={`my-3 p-3.5 rounded-r-xl rounded-l-sm border-l-4 shadow-xs text-xs sm:text-sm leading-relaxed flex items-start gap-2.5 ${bgClass}`}>
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconClass}`} />
      <div className="flex-1 whitespace-pre-wrap">{renderInline(cleanText.trim())}</div>
    </div>
  );
};

// Fonction de rendu des éléments Inline (Gras, Italique, Liens, Code en ligne)
function renderInline(text: string): React.ReactNode {
  if (!text) return null;

  // Regex pour détecter les patterns inline :
  // 1. Code en ligne `...`
  // 2. Liens [label](url)
  // 3. Gras **...**
  // 4. Italique *...*
  const pattern = /(`[^`]+`)|(\[[^\]]+\]\([^)]+\))|(\*\*[^*]+\*\*)|(\*[^*]+\*)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    // Texte brut avant le match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    // Inline Code
    if (token.startsWith('`') && token.endsWith('`')) {
      const codeContent = token.slice(1, -1);
      parts.push(
        <code
          key={`code-${match.index}`}
          className="px-1.5 py-0.5 rounded-md bg-primary-50 text-primary-700 font-mono text-[11px] font-semibold border border-primary-200/60"
        >
          {codeContent}
        </code>
      );
    }
    // Lien [text](url)
    else if (token.startsWith('[') && token.includes('](') && token.endsWith(')')) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        parts.push(
          <a
            key={`link-${match.index}`}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-800 underline font-medium inline-flex items-center gap-0.5"
          >
            <span>{linkMatch[1]}</span>
            <ExternalLink className="w-3 h-3 inline shrink-0" />
          </a>
        );
      } else {
        parts.push(token);
      }
    }
    // Gras **text**
    else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={`bold-${match.index}`} className="font-semibold text-gray-900">
          {token.slice(2, -2)}
        </strong>
      );
    }
    // Italique *text*
    else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={`italic-${match.index}`} className="italic text-gray-700">
          {token.slice(1, -1)}
        </em>
      );
    } else {
      parts.push(token);
    }

    lastIndex = pattern.lastIndex;
  }

  // Reste du texte
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}

export default MarkdownRenderer;
