import React from 'react';
import katex from 'katex';
import { Group } from 'react-konva';
import type {
  DrawingEntity,
  SceneData,
} from '../components/canvas/types';
import {
  ComponentGlyph,
  DEFAULT_STROKE_COLOR,
  DrawingGlyph,
  WireStroke,
  getDrawingDisplayText,
} from '../components/canvas/glyphs';
import {
  getTextSymbolFontSize,
  getTextBoxSize,
  hasLatexSyntax,
} from '../components/symbols/textMetrics';
import { konvaElementToSvg, type SvgBounds } from './konvaSvg';

const EXPORT_PADDING = 12;
const EXPORT_FONT_FAMILY = 'Times New Roman, Georgia, serif';
const LATEX_TOKEN_REGEX = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$|\\\((.+?)\\\)|\\\[(.+?)\\\]/g;

type Bounds = SvgBounds;

interface SvgExportOptions {
  title?: string;
  disableForeignObject?: boolean;
  omitTextDrawings?: boolean;
}

interface RenderedEntity {
  markup: string;
  bounds: Bounds | null;
}

type Token = { type: 'text'; value: string } | { type: 'latex'; value: string; display: boolean };

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value: string) {
  return escapeXml(value);
}

function getColor(color: string | undefined) {
  return color ?? DEFAULT_STROKE_COLOR;
}

function rect(x: number, y: number, width: number, height: number, stroke: string, strokeWidth: number, fill = 'none') {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
}

function getTextBorderStrokeWidth(drawing: DrawingEntity) {
  return drawing.borderStrokeWidth && Number.isFinite(drawing.borderStrokeWidth)
    ? drawing.borderStrokeWidth
    : 1;
}

function getClipboardTextFallback(content: string) {
  return content
    .replace(/\$\$([\s\S]+?)\$\$/g, '$1')
    .replace(/\$([^$]+?)\$/g, '$1')
    .replace(/\\\((.+?)\\\)/g, '$1')
    .replace(/\\\[(.+?)\\\]/g, '$1')
    .trim();
}

function getDrawingTextBoxSize(drawing: DrawingEntity) {
  const content = getTextBoxSize(getDrawingDisplayText(drawing), drawing.fontSize);
  if (!drawing.border) {
    return content;
  }
  return {
    width: drawing.borderWidth && drawing.borderWidth > 0 ? drawing.borderWidth : content.width,
    height: drawing.borderHeight && drawing.borderHeight > 0 ? drawing.borderHeight : content.height,
  };
}

function textDrawingBounds(drawing: DrawingEntity): Bounds {
  const box = getDrawingTextBoxSize(drawing);
  const width = drawing.rotation % 180 === 0 ? box.width : box.height;
  const height = drawing.rotation % 180 === 0 ? box.height : box.width;
  const borderPad = drawing.border ? getTextBorderStrokeWidth(drawing) / 2 : 0;
  return {
    minX: drawing.x - width / 2 - borderPad,
    maxX: drawing.x + width / 2 + borderPad,
    minY: drawing.y - height / 2 - borderPad,
    maxY: drawing.y + height / 2 + borderPad,
  };
}

function tokenizeLatex(value: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  LATEX_TOKEN_REGEX.lastIndex = 0;
  while ((match = LATEX_TOKEN_REGEX.exec(value)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: value.slice(lastIndex, match.index) });
    }
    tokens.push({
      type: 'latex',
      value: match[1] ?? match[2] ?? match[3] ?? match[4] ?? '',
      display: Boolean(match[1] || match[4]),
    });
    lastIndex = LATEX_TOKEN_REGEX.lastIndex;
  }
  if (lastIndex < value.length) {
    tokens.push({ type: 'text', value: value.slice(lastIndex) });
  }
  return tokens.length ? tokens : [{ type: 'text', value }];
}

function renderMathMl(content: string, display: boolean) {
  if (!content.trim()) {
    return escapeXml(content);
  }
  try {
    return katex.renderToString(content, {
      displayMode: display,
      output: 'mathml',
      throwOnError: false,
      strict: 'ignore',
    });
  } catch {
    return `<span>${escapeXml(content)}</span>`;
  }
}

function renderRichTextMarkup(content: string) {
  return tokenizeLatex(content)
    .map((token) => {
      if (token.type === 'text') {
        return `<span>${escapeXml(token.value)}</span>`;
      }
      return renderMathMl(token.value, token.display);
    })
    .join('');
}

function renderPlainTextDrawing(drawing: DrawingEntity) {
  const content = getDrawingDisplayText(drawing);
  const displayContent = hasLatexSyntax(content)
    ? getClipboardTextFallback(content) || content
    : content;
  const fontSize = getTextSymbolFontSize(drawing.fontSize);
  const { width, height } = getDrawingTextBoxSize(drawing);
  const color = getColor(drawing.strokeColor);
  const border = drawing.border
    ? rect(-width / 2, -height / 2, width, height, color, getTextBorderStrokeWidth(drawing))
    : '';

  return `<g transform="translate(${drawing.x} ${drawing.y}) rotate(${drawing.rotation})">${border}<text x="0" y="0" fill="${escapeAttribute(color)}" stroke="none" font-family="${escapeAttribute(EXPORT_FONT_FAMILY)}" font-size="${fontSize}" text-anchor="middle" dominant-baseline="central">${escapeXml(displayContent)}</text></g>`;
}

function renderTextDrawing(drawing: DrawingEntity, options: SvgExportOptions) {
  if (options.disableForeignObject) {
    return renderPlainTextDrawing(drawing);
  }
  const content = getDrawingDisplayText(drawing);
  const fontSize = getTextSymbolFontSize(drawing.fontSize);
  const { width, height } = getDrawingTextBoxSize(drawing);
  const color = getColor(drawing.strokeColor);
  const boxX = -width / 2;
  const boxY = -height / 2;
  const transform = `translate(${drawing.x} ${drawing.y}) rotate(${drawing.rotation})`;
  const markup = hasLatexSyntax(content)
    ? renderRichTextMarkup(content)
    : escapeXml(content);
  const borderStyle = drawing.border === true
    ? `border:${getTextBorderStrokeWidth(drawing)}px solid ${escapeAttribute(color)};`
    : 'border:none;';
  return `<g transform="${transform}"><foreignObject x="${boxX}" y="${boxY}" width="${width}" height="${height}"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;display:flex;align-items:center;justify-content:center;text-align:center;white-space:nowrap;color:${escapeAttribute(color)};font-family:${escapeAttribute(EXPORT_FONT_FAMILY)};font-size:${fontSize}px;line-height:1;overflow:visible;box-sizing:border-box;${borderStyle}">${markup}</div></foreignObject></g>`;
}

// Components, wires and graphical drawings are exported from the very same
// glyph elements the canvas renders, so the copy always matches the screen.
function renderGlyph(element: React.ReactElement): RenderedEntity {
  return konvaElementToSvg(element);
}

function renderTextEntity(drawing: DrawingEntity, options: SvgExportOptions): RenderedEntity {
  return {
    markup: options.omitTextDrawings ? '' : renderTextDrawing(drawing, options),
    bounds: textDrawingBounds(drawing),
  };
}

function renderSceneEntities(scene: SceneData, options: SvgExportOptions): RenderedEntity[] {
  return [
    ...scene.components.map((component) =>
      renderGlyph(
        React.createElement(ComponentGlyph, {
          toolId: component.toolId,
          x: component.x,
          y: component.y,
          rotation: component.rotation,
          flipped: component.flipped === true,
          strokeColor: component.strokeColor ?? DEFAULT_STROKE_COLOR,
          isSelected: false,
          listening: false,
        })
      )
    ),
    ...scene.wires.map((wire) =>
      renderGlyph(
        React.createElement(Group, { x: wire.x, y: wire.y }, React.createElement(WireStroke, { wire }))
      )
    ),
    ...scene.drawings.map((drawing) =>
      drawing.toolId === 'text'
        ? renderTextEntity(drawing, options)
        : renderGlyph(
            React.createElement(DrawingGlyph, {
              drawing,
              strokeColor: drawing.strokeColor ?? DEFAULT_STROKE_COLOR,
              isSelected: false,
              listening: false,
            })
          )
    ),
  ];
}

function entitiesBounds(entities: RenderedEntity[]): Bounds {
  const boundsList = entities
    .map((entity) => entity.bounds)
    .filter((bounds): bounds is Bounds => bounds !== null);

  if (boundsList.length === 0) {
    return { minX: -32, minY: -32, maxX: 32, maxY: 32 };
  }

  return boundsList.reduce(
    (acc, bounds) => ({
      minX: Math.min(acc.minX, bounds.minX),
      maxX: Math.max(acc.maxX, bounds.maxX),
      minY: Math.min(acc.minY, bounds.minY),
      maxY: Math.max(acc.maxY, bounds.maxY),
    }),
    boundsList[0]
  );
}

function exportFrame(bounds: Bounds) {
  return {
    minX: bounds.minX - EXPORT_PADDING,
    minY: bounds.minY - EXPORT_PADDING,
    width: Math.max(1, bounds.maxX - bounds.minX + EXPORT_PADDING * 2),
    height: Math.max(1, bounds.maxY - bounds.minY + EXPORT_PADDING * 2),
  };
}

export function getSceneExportFrame(scene: SceneData) {
  return exportFrame(entitiesBounds(renderSceneEntities(scene, { omitTextDrawings: true })));
}

export function sceneToSvg(scene: SceneData, options: SvgExportOptions = {}) {
  const entities = renderSceneEntities(scene, options);
  const { minX, minY, width, height } = exportFrame(entitiesBounds(entities));
  const title = options.title ? `<title>${escapeXml(options.title)}</title>` : '';
  const body = entities.map((entity) => entity.markup).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xhtml="http://www.w3.org/1999/xhtml" viewBox="${minX} ${minY} ${width} ${height}" width="${width}" height="${height}" role="img">
${title}
${body}
</svg>`;
}
