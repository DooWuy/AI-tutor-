import { Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkBreaks from 'remark-breaks';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';

function collapseLatexCommands(body: string) {
  return body.replace(/\\\\(?=[A-Za-z])/g, '\\');
}

function consumeLatex(text: string, start: number) {
  let index = start + 1;
  while (index < text.length && /[A-Za-z]/.test(text[index])) index += 1;
  while (index < text.length && (text[index] === '{' || text[index] === '[' || text[index] === '^' || text[index] === '_')) {
    if (text[index] === '^' || text[index] === '_') {
      index += 1;
      if (text[index] === '\\') {
        index = consumeLatex(text, index);
        continue;
      }
      if (text[index] !== '{' && text[index] !== '[') {
        if (index < text.length) index += 1;
        continue;
      }
    }
    const open = text[index];
    const close = open === '{' ? '}' : ']';
    index += 1;
    let depth = 1;
    while (index < text.length && depth > 0) {
      if (text[index] === '\\') {
        index += 2;
        continue;
      }
      if (text[index] === open) depth += 1;
      else if (text[index] === close) depth -= 1;
      index += 1;
    }
  }
  return index;
}

function wrapBareCommands(text: string) {
  let result = '';
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '\\' && /[A-Za-z]/.test(text[index + 1] || '')) {
      const end = consumeLatex(text, index);
      result += `$${text.slice(index, end)}$`;
      index = end - 1;
    } else {
      result += text[index];
    }
  }
  return result;
}

function wrapBareLatex(text: string) {
  const pattern = /\$\$[\s\S]*?\$\$|(?<!\$)\$[^$\n]+?\$(?!\$)/g;
  let result = '';
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    result += wrapBareCommands(text.slice(last, index));
    result += match[0];
    last = index + match[0].length;
  }
  return result + wrapBareCommands(text.slice(last));
}

/** Turn common math delimiters into the `$` / `$$` form KaTeX reads. */
export function prepareMathSource(input: string) {
  let text = input.replace(/\r\n/g, '\n');
  // Auto-heal corrupted LaTeX form feeds or arrow artifacts from unescaped JSON
  text = text.replace(/[\x0c\u000c]rac/g, '\\frac');
  text = text.replace(/⬆rac/g, '\\frac');
  text = text.replace(/(?<=\s|^)x\s*\n?\s*eq\s*(?=[-0-9a-zA-Z])/g, 'x \\neq ');
  text = text.replace(/\bxeq\s*(?=[-0-9a-zA-Z])/g, 'x \\neq ');

  // Convert all \frac → \dfrac so fractions render at display-style size
  // (full-height numerator/denominator, no clipping of superscripts like ^2)
  // We match \frac that is NOT already preceded by 'd' or 't' (dfrac/tfrac)
  text = text.replace(/\\(?:frac)(?![a-zA-Z])/g, '\\dfrac');

  const withDelimiters = text
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, body: string) => `$$${collapseLatexCommands(body)}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, body: string) => `$${collapseLatexCommands(body)}$`);
  const collapsed = withDelimiters
    .replace(/\$\$([\s\S]*?)\$\$/g, (_, body: string) => `$$${collapseLatexCommands(body)}$$`)
    .replace(/(?<!\$)\$([^$\n]+?)\$(?!\$)/g, (_, body: string) => `$${collapseLatexCommands(body)}$`);
  return wrapBareLatex(collapsed);
}

export function MathText({
  text,
  className = '',
}: {
  text?: string | null;
  className?: string;
}) {
  const source = prepareMathSource(text || '');
  if (!source.trim()) return null;
  return (
    <div className={`math-text max-w-none text-on-surface [&_p]:my-0 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkBreaks]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: 'ignore' }]]}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}

export type ReadableChoice = {
  key?: string | null;
  text?: string | null;
  correct?: boolean;
};

export function QuestionView({
  stem,
  choices = [],
  correctText,
  explanation,
  showSolution = true,
}: {
  stem: string;
  choices?: ReadableChoice[];
  correctText?: string | null;
  explanation?: string | null;
  showSolution?: boolean;
}) {
  const rows = choices.filter((choice) => (choice.text || '').trim() || (choice.key || '').trim());
  const marked = rows.some((choice) => choice.correct);
  return (
    <div className="question-frame space-y-3">
      <MathText text={stem} className="font-medium" />
      {rows.length > 0 ? (
        <ul className="space-y-1.5">
          {rows.map((choice, index) => {
            const keyText = choice.key || String.fromCharCode(65 + index);
            const prefix = keyText.endsWith('.') ? keyText : `${keyText}.`;
            return (
              <li
                key={`${choice.key || 'choice'}-${index}`}
                className={`answer-frame flex items-center justify-between gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  choice.correct
                    ? 'bg-primary-fixed ring-1 ring-primary/25 font-medium'
                    : 'bg-surface-container/60'
                }`}
              >
                <div className="flex items-baseline gap-2 min-w-0 flex-1">
                  <span
                    className={`shrink-0 font-semibold ${
                      choice.correct ? 'text-primary' : 'text-on-surface'
                    }`}
                  >
                    {prefix}
                  </span>
                  <MathText text={choice.text} className="min-w-0 [&_p]:inline" />
                </div>
                {choice.correct ? (
                  <span
                    className="shrink-0 text-primary flex items-center justify-center"
                    title="Đáp án đúng"
                    aria-label="Đáp án đúng"
                  >
                    <Check className="size-4 stroke-[2.5]" />
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
      {!marked && correctText ? (
        <div className="answer-frame flex items-center justify-between gap-3 rounded-lg bg-primary-fixed px-3 py-1.5 text-sm ring-1 ring-primary/25 font-medium">
          <div className="flex items-baseline gap-2 min-w-0 flex-1">
            <span className="shrink-0 font-semibold text-primary">Đáp án:</span>
            <MathText text={correctText} className="min-w-0 [&_p]:inline" />
          </div>
          <span
            className="shrink-0 text-primary flex items-center justify-center"
            title="Đáp án đúng"
            aria-label="Đáp án đúng"
          >
            <Check className="size-4 stroke-[2.5]" />
          </span>
        </div>
      ) : null}
      {showSolution && explanation ? (
        <details className="text-sm">
          <summary className="cursor-pointer font-semibold text-on-surface">Lời giải</summary>
          <MathText text={explanation} className="mt-1 text-on-surface-variant" />
        </details>
      ) : null}
    </div>
  );
}
