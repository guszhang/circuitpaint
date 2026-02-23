'use client';

import { Fragment, useMemo } from 'react';
import type { ReactNode } from 'react';
import katex from 'katex';

interface LatexProps {
  children?: ReactNode;
}

type Token = { type: 'text'; value: string } | { type: 'latex'; value: string; display: boolean };

const TOKEN_REGEX = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$|\\\((.+?)\\\)|\\\[(.+?)\\\]/g;

function tokenize(value: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  TOKEN_REGEX.lastIndex = 0;
  // eslint-disable-next-line no-cond-assign
  while ((match = TOKEN_REGEX.exec(value)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: value.slice(lastIndex, match.index) });
    }
    const latexContent = match[1] ?? match[2] ?? match[3] ?? match[4] ?? '';
    const display = Boolean(match[1] || match[4]);
    tokens.push({ type: 'latex', value: latexContent, display });
    lastIndex = TOKEN_REGEX.lastIndex;
  }
  if (lastIndex < value.length) {
    tokens.push({ type: 'text', value: value.slice(lastIndex) });
  }
  return tokens.length ? tokens : [{ type: 'text', value }];
}

function renderLatex(content: string, display: boolean): string | null {
  if (!content.trim()) {
    return null;
  }
  try {
    return katex.renderToString(content, {
      displayMode: display,
      throwOnError: false,
      strict: 'ignore',
      output: 'html',
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Failed to render LaTeX "%s"', content, error);
    }
    return null;
  }
}

export default function Latex({ children }: LatexProps) {
  const raw = typeof children === 'string' ? children : children == null ? '' : String(children);
  const segments = useMemo(() => tokenize(raw), [raw]);

  if (!raw) {
    return null;
  }

  return (
    <>
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <Fragment key={index}>{segment.value}</Fragment>;
        }
        const html = renderLatex(segment.value, segment.display);
        if (!html) {
          return <Fragment key={index}>{segment.value}</Fragment>;
        }
        const Element = segment.display ? 'div' : 'span';
        const className = segment.display ? 'katex-display' : undefined;
        return <Element key={index} className={className} dangerouslySetInnerHTML={{ __html: html }} />;
      })}
    </>
  );
}
