import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export interface MathMarkdownProps {
  content: string;
  className?: string;
  inline?: boolean;
  prose?: boolean;
}

/**
 * Normalizes math string content:
 * - Fixes control character escape artifacts from JSON (e.g. \x0crac -> \frac, \t + imes -> \times)
 * - Converts LaTeX brackets \[ ... \] and \( ... \) to $$ and $
 * - Intelligently wraps standalone math expressions (options like \frac{19}{4}) into $...$
 * - Wraps ONLY raw LaTeX fragments outside $...$ in mixed text, preserving normal Vietnamese sentences
 * - Strips any stray or corrupted lone $ signs outside paired blocks to prevent $$ parse errors
 */
export function normalizeMathContent(text: string): string {
  if (!text) return '';
  let res = text;

  // 1. Fix unescaped control character artifacts from JSON
  res = res.replace(/\x0crac/g, '\\frac');
  res = res.replace(/\x0c/g, '\\f');
  // Tab (\t) followed by LaTeX token names missing leading 't'
  res = res.replace(/\t(imes|ext|heta|an|o|op|iny|riangle)/g, '\\t$1');
  res = res.replace(/\t/g, ' ');
  res = res.replace(/\x08/g, '\\b');

  // 2. Normalize display \[ ... \] and inline \( ... \) delimiters to $$ and $
  res = res.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');
  res = res.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');

  // Check if string contains Vietnamese or natural language words
  const cleanForWordCheck = res.replace(
    /\\(frac|sqrt|times|div|pm|cdot|text|dots|le|ge|neq|approx|sum|int|partial|alpha|beta|pi|degree)/g,
    ''
  );
  const hasWords = /[a-zA-ZàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]{3,}/i.test(
    cleanForWordCheck
  );

  // 3. Case A: Standalone math expression without natural words (e.g. options: "\frac{19}{4}", "7 \frac{1}{4}")
  if (!res.includes('$') && !hasWords) {
    const hasLatex = /\\(frac|sqrt|times|div|pm|cdot|text|dots|le|ge|neq|approx|sum|int|partial|alpha|beta|pi|degree)/.test(
      res
    );
    if (hasLatex) {
      return `$${res.trim()}$`;
    }
  }

  // 4. Case B: Mixed content. Split by existing valid paired math blocks ($$...$$ and $...$)
  const mathBlockRegex = /(\$\$[\s\S]*?\$\$|\$[^\$]+?\$)/g;
  const parts = res.split(mathBlockRegex);

  for (let i = 0; i < parts.length; i += 2) {
    let segment = parts[i];
    if (!segment) continue;

    // Remove any lone/stray $ outside of valid pairs to prevent accidental $$ or parse errors
    segment = segment.replace(/\$/g, '');

    // Wrap unwrapped fractions (including optional mixed number integer, e.g. "5 \frac{1}{2}")
    segment = segment.replace(/(\b\d+\s+)?\\frac\{[^{}]+\}\{[^{}]+\}/g, (m) => `$${m.trim()}$`);

    // Wrap unwrapped \sqrt{...}
    segment = segment.replace(/\\sqrt\{[^{}]+\}/g, (m) => `$${m.trim()}$`);

    // Wrap unwrapped standalone \times or \div
    segment = segment.replace(/\\(times|div)/g, (m) => `$${m}$`);

    parts[i] = segment;
  }

  return parts.join('');
}

export const MathMarkdown: React.FC<MathMarkdownProps> = ({
  content,
  className = '',
  inline = false,
  prose,
}) => {
  if (!content) return null;

  const normalized = useMemo(() => normalizeMathContent(content), [content]);
  const useProse = prose !== undefined ? prose : !inline;

  const components = useMemo(() => {
    if (inline) {
      return {
        p: ({ children }: { children?: React.ReactNode }) => <span className="inline">{children}</span>,
      };
    }
    if (!useProse) {
      return {
        p: ({ children }: { children?: React.ReactNode }) => <span className="block m-0">{children}</span>,
      };
    }
    return undefined;
  }, [inline, useProse]);

  const rehypePlugins = useMemo(
    () => [[rehypeKatex, { throwOnError: false, strict: false }]] as any,
    []
  );

  if (inline) {
    return (
      <span className={`math-markdown-content inline ${className}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
          rehypePlugins={rehypePlugins}
          components={components}
        >
          {normalized}
        </ReactMarkdown>
      </span>
    );
  }

  const proseClasses = useProse
    ? 'prose prose-sm max-w-none text-on-surface prose-headings:text-on-surface prose-strong:text-on-surface prose-a:text-primary prose-code:text-primary prose-code:bg-surface-container/60 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-pre:bg-surface-container-high prose-pre:text-on-surface'
    : '';

  return (
    <div
      className={`math-markdown-content overflow-x-auto leading-relaxed ${proseClasses} ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
};
