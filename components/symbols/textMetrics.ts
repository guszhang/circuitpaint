'use client';

import katex from 'katex';

const LABEL_FONT_SIZE = 12;
const LABEL_FONT_FAMILY = 'Times New Roman, Georgia, serif';
const LABEL_PADDING_X = 6;
const LABEL_PADDING_Y = 4;
const MIN_TEXT_FONT_SIZE = 6;
const MAX_TEXT_FONT_SIZE = 48;
const LATEX_TOKEN_REGEX = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$|\\\((.+?)\\\)|\\\[(.+?)\\\]/g;
const renderedLabelMetricsCache = new Map<string, { width: number; height: number }>();

function measurePlainText(text: string, fontSize = LABEL_FONT_SIZE) {
  if (typeof document === 'undefined') {
    return { width: text.length * fontSize * 0.6, height: fontSize * 1.2 };
  }
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { width: text.length * fontSize * 0.6, height: fontSize * 1.2 };
  }
  ctx.font = `${fontSize}px ${LABEL_FONT_FAMILY}`;
  const metrics = ctx.measureText(text);
  const height =
    metrics.actualBoundingBoxAscent !== undefined && metrics.actualBoundingBoxDescent !== undefined
      ? metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
      : fontSize * 1.2;
  return { width: metrics.width, height };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderLatexTokenHtml(content: string, display: boolean) {
  if (!content.trim()) {
    return '';
  }
  try {
    const html = katex.renderToString(content, {
      displayMode: display,
      throwOnError: false,
      strict: 'ignore',
      output: 'html',
    });
    return display ? `<div class="katex-display">${html}</div>` : html;
  } catch {
    return escapeHtml(content);
  }
}

export function hasLatexSyntax(text: string) {
  return /\$[^$]+\$|\\\(.+\\\)|\\\[.+\\\]/.test(text);
}

export function getTextSymbolFontSize(fontSize: number | undefined) {
  const candidate = fontSize ?? LABEL_FONT_SIZE;
  return Math.min(MAX_TEXT_FONT_SIZE, Math.max(MIN_TEXT_FONT_SIZE, candidate));
}

export function measureRenderedText(text: string, fontSize = LABEL_FONT_SIZE) {
  if (!hasLatexSyntax(text) || typeof document === 'undefined') {
    return measurePlainText(text, fontSize);
  }

  const cacheKey = `${fontSize}::${text}`;
  const cached = renderedLabelMetricsCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const htmlParts: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  LATEX_TOKEN_REGEX.lastIndex = 0;
  while ((match = LATEX_TOKEN_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      htmlParts.push(escapeHtml(text.slice(lastIndex, match.index)));
    }
    const latexContent = match[1] ?? match[2] ?? match[3] ?? match[4] ?? '';
    const display = Boolean(match[1] || match[4]);
    htmlParts.push(renderLatexTokenHtml(latexContent, display));
    lastIndex = LATEX_TOKEN_REGEX.lastIndex;
  }
  if (lastIndex < text.length) {
    htmlParts.push(escapeHtml(text.slice(lastIndex)));
  }
  if (htmlParts.length === 0) {
    htmlParts.push(escapeHtml(text));
  }

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '-10000px';
  container.style.visibility = 'hidden';
  container.style.pointerEvents = 'none';
  container.style.display = 'inline-block';
  container.style.whiteSpace = 'nowrap';
  container.style.fontFamily = LABEL_FONT_FAMILY;
  container.style.fontSize = `${fontSize}px`;
  container.innerHTML = htmlParts.join('');

  document.body.appendChild(container);
  const rect = container.getBoundingClientRect();
  document.body.removeChild(container);

  const metrics = {
    width: rect.width || text.length * fontSize * 0.6,
    height: rect.height || fontSize * 1.2,
  };
  if (renderedLabelMetricsCache.size > 500) {
    renderedLabelMetricsCache.clear();
  }
  renderedLabelMetricsCache.set(cacheKey, metrics);
  return metrics;
}

export {
  LABEL_FONT_FAMILY,
  LABEL_FONT_SIZE,
  LABEL_PADDING_X,
  LABEL_PADDING_Y,
  MAX_TEXT_FONT_SIZE,
  MIN_TEXT_FONT_SIZE,
};
