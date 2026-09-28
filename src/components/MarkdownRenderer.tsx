import React, { useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Découpage en blocs (code, tableaux, listes, paragraphes, citations)
  const renderBlocks = () => {
    if (!content) return null;

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeContent: string[] = [];
    let inList = false;
    let isOrderedList = false;
    let listItems: string[] = [];
    let inTable = false;
    let tableRows: string[][] = [];
    let blockIndex = 0;

    const flushList = () => {
      if (!inList) return;
      const ListTag = isOrderedList ? 'ol' : 'ul';
      elements.push(
        <ListTag
          key={`list-${blockIndex++}`}
          className={`my-3 space-y-1.5 pl-6 text-sm leading-relaxed ${
            isOrderedList ? 'list-decimal' : 'list-disc'
          } marker:text-indigo-500 dark:marker:text-indigo-400`}
        >
          {listItems.map((item, idx) => (
            <li key={idx} className="pl-1">
              {renderInline(item)}
            </li>
          ))}
        </ListTag>
      );
      inList = false;
      listItems = [];
    };

    const flushTable = () => {
      if (!inTable) return;
      if (tableRows.length > 0) {
        const [headerRow, ...bodyRows] = tableRows;
        // Filtrer les séparateurs du style |---|---|
        const actualBody = bodyRows.filter(
          (row) => !row.every((cell) => /^[:\s-]+$/.test(cell.trim()))
        );

        elements.push(
          <div key={`table-${blockIndex++}`} className="my-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
              <thead className="bg-slate-100/80 dark:bg-slate-800">
                <tr>
                  {headerRow.map((cell, idx) => (
                    <th key={idx} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {renderInline(cell.trim())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
                {actualBody.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-4 py-2 text-slate-600 dark:text-slate-300">
                        {renderInline(cell.trim())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      inTable = false;
      tableRows = [];
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Blocs de code ```lang
      if (line.trim().startsWith('```')) {
        flushList();
        flushTable();
        if (inCodeBlock) {
          const fullCode = codeContent.join('\n');
          const currentCodeIdx = blockIndex++;
          const isCopied = copiedIndex === currentCodeIdx;
          elements.push(
            <div key={`code-${currentCodeIdx}`} className="my-3.5 rounded-xl overflow-hidden border border-slate-700/60 bg-slate-950 text-slate-100 shadow-md">
              <div className="flex items-center justify-between px-4 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] font-mono text-slate-400">
                <span>{codeLanguage || 'code'}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(fullCode, currentCodeIdx)}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  {isCopied ? (
                    <>
                      <Check size={12} className="text-emerald-400" />
                      <span className="text-emerald-400">Copié</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copier</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed text-slate-200">
                <code>{fullCode}</code>
              </pre>
            </div>
          );
          inCodeBlock = false;
          codeContent = [];
          codeLanguage = '';
        } else {
          inCodeBlock = true;
          codeLanguage = line.trim().slice(3).trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeContent.push(line);
        continue;
      }

      // Lignes de tableau Markdown | ... | ... |
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        flushList();
        inTable = true;
        const cells = line
          .trim()
          .slice(1, -1)
          .split('|');
        tableRows.push(cells);
        continue;
      } else if (inTable) {
        flushTable();
      }

      // Listes à puces / numérotées
      const unorderedMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
      const orderedMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);

      if (unorderedMatch || orderedMatch) {
        flushTable();
        const isCurrentOrdered = !!orderedMatch;
        const itemContent = unorderedMatch ? unorderedMatch[2] : orderedMatch![2];

        if (!inList) {
          inList = true;
          isOrderedList = isCurrentOrdered;
          listItems = [itemContent];
        } else {
          listItems.push(itemContent);
        }
        continue;
      } else if (inList) {
        flushList();
      }

      // Ligne vide
      if (!line.trim()) {
        continue;
      }

      // Titres Markdown
      if (line.startsWith('#### ')) {
        elements.push(
          <h5 key={`h5-${blockIndex++}`} className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 mt-3 mb-1">
            {renderInline(line.slice(5))}
          </h5>
        );
        continue;
      }
      if (line.startsWith('### ')) {
        elements.push(
          <h4 key={`h4-${blockIndex++}`} className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-4 mb-2 flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-indigo-600 dark:bg-indigo-400 rounded-full inline-block" />
            {renderInline(line.slice(4))}
          </h4>
        );
        continue;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h3 key={`h3-${blockIndex++}`} className="text-base font-bold text-slate-900 dark:text-slate-50 mt-5 mb-2 pb-1 border-b border-slate-200 dark:border-slate-800">
            {renderInline(line.slice(3))}
          </h3>
        );
        continue;
      }
      if (line.startsWith('# ')) {
        elements.push(
          <h2 key={`h2-${blockIndex++}`} className="text-lg font-bold text-slate-900 dark:text-white mt-6 mb-3">
            {renderInline(line.slice(2))}
          </h2>
        );
        continue;
      }

      // Citations blockquote
      if (line.startsWith('> ')) {
        elements.push(
          <blockquote
            key={`quote-${blockIndex++}`}
            className="my-3 pl-4 py-1 border-l-4 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-slate-700 dark:text-slate-300 text-sm italic rounded-r-lg"
          >
            {renderInline(line.slice(2))}
          </blockquote>
        );
        continue;
      }

      // Ligne horizontale
      if (line.trim() === '---' || line.trim() === '***' || line.trim() === '___') {
        elements.push(<hr key={`hr-${blockIndex++}`} className="my-4 border-slate-200 dark:border-slate-800" />);
        continue;
      }

      // Paragraphe standard
      elements.push(
        <p key={`p-${blockIndex++}`} className="my-2 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
          {renderInline(line)}
        </p>
      );
    }

    flushList();
    flushTable();

    return elements;
  };

  // Traitement inline : gras, italique, inline code, liens
  const renderInline = (text: string): React.ReactNode => {
    // Regex pour découper les fragments inline
    // Matches: `code`, **gras**, *italique*, [lien](url)
    const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
    const parts = text.split(tokenRegex);

    return parts.map((part, index) => {
      if (!part) return null;

      // Inline code `code`
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        return (
          <code
            key={index}
            className="px-1.5 py-0.5 mx-0.5 rounded-md font-mono text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      // Gras **texte**
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return (
          <strong key={index} className="font-semibold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }

      // Italique *texte*
      if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
        return (
          <em key={index} className="italic text-slate-700 dark:text-slate-300">
            {part.slice(1, -1)}
          </em>
        );
      }

      // Liens [titre](url)
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const [, title, url] = linkMatch;
        return (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            <span>{title}</span>
            <ExternalLink size={10} className="opacity-70" />
          </a>
        );
      }

      return part;
    });
  };

  return <div className={`markdown-body select-text ${className}`}>{renderBlocks()}</div>;
};

export default MarkdownRenderer;
