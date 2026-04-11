import katex from 'katex';
import type { Point } from './geometry';
import type {
  ComponentEntity,
  DrawingEntity,
  Rotation,
  SceneData,
  WireEntity,
} from '../components/canvas/types';
import {
  LABEL_FONT_FAMILY,
  LABEL_PADDING_X,
  LABEL_PADDING_Y,
  getTextSymbolFontSize,
  hasLatexSyntax,
  measureRenderedText,
} from '../components/symbols/textMetrics';

const DEFAULT_STROKE_COLOR = '#000000';
const DEFAULT_WIRE_STROKE_WIDTH = 1;
const EXPORT_PADDING = 12;
const EXPORT_FONT_FAMILY = 'Times New Roman, Georgia, serif';
const LATEX_TOKEN_REGEX = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$|\\\((.+?)\\\)|\\\[(.+?)\\\]/g;
const ROTATED_COMPONENTS_90 = new Set<ComponentEntity['toolId']>([
  'source',
  'current-source',
  'ac-source',
  'controlled-voltage-source',
  'controlled-current-source',
  'switch',
  'n-mosfet',
  'p-mosfet',
  'npn-bjt',
  'pnp-bjt',
  'spark-gap',
  'transformer',
]);

interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface SvgExportOptions {
  title?: string;
  disableForeignObject?: boolean;
  omitTextDrawings?: boolean;
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

function getWireStrokeWidth(value: number | undefined) {
  return value && Number.isFinite(value) ? value : DEFAULT_WIRE_STROKE_WIDTH;
}

function getWireDash(value: number[] | undefined) {
  if (!Array.isArray(value) || value.length === 0) {
    return '';
  }
  return ` stroke-dasharray="${value.join(' ')}"`;
}

function rotatePoint(point: Point, rotation: Rotation) {
  switch (rotation) {
    case 90:
      return { x: -point.y, y: point.x };
    case 180:
      return { x: -point.x, y: -point.y };
    case 270:
      return { x: point.y, y: -point.x };
    default:
      return point;
  }
}

function transformPoint(point: Point, rotation: Rotation, flipped = false) {
  const local = flipped ? { x: -point.x, y: point.y } : point;
  return rotatePoint(local, rotation);
}

function transformPoints(points: Point[], rotation: Rotation, flipped = false) {
  return points.map((point) => transformPoint(point, rotation, flipped));
}

function pointsAttr(points: Point[]) {
  return points.map((point) => `${point.x},${point.y}`).join(' ');
}

function polyline(points: Point[], stroke: string, strokeWidth: number, extra = '') {
  return `<polyline points="${pointsAttr(points)}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${extra} />`;
}

function polygon(points: Point[], stroke: string, strokeWidth: number, fill: string) {
  return `<polygon points="${pointsAttr(points)}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />`;
}

function line(x1: number, y1: number, x2: number, y2: number, stroke: string, strokeWidth: number, extra = '') {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${extra} />`;
}

function circle(cx: number, cy: number, radius: number, stroke: string, strokeWidth: number, fill = 'none') {
  return `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
}

function rect(x: number, y: number, width: number, height: number, stroke: string, strokeWidth: number, fill = 'none') {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
}

function path(d: string, stroke: string, strokeWidth: number, fill = 'none') {
  return `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />`;
}

function arcPath(cx: number, cy: number, radius: number, start: Point, end: Point, sweep: 0 | 1, stroke: string, strokeWidth: number) {
  return path(
    `M ${cx + start.x} ${cy + start.y} A ${radius} ${radius} 0 0 ${sweep} ${cx + end.x} ${cy + end.y}`,
    stroke,
    strokeWidth
  );
}

function topArc(cx: number, cy: number, radius: number, stroke: string, strokeWidth: number) {
  return arcPath(cx, cy, radius, { x: -radius, y: 0 }, { x: radius, y: 0 }, 1, stroke, strokeWidth);
}

function bottomArc(cx: number, cy: number, radius: number, stroke: string, strokeWidth: number) {
  return arcPath(cx, cy, radius, { x: radius, y: 0 }, { x: -radius, y: 0 }, 1, stroke, strokeWidth);
}

function rightArc(cx: number, cy: number, radius: number, stroke: string, strokeWidth: number) {
  return arcPath(cx, cy, radius, { x: 0, y: -radius }, { x: 0, y: radius }, 1, stroke, strokeWidth);
}

function arrow(points: Point[], stroke: string, strokeWidth: number, pointerLength: number, pointerWidth: number, fill = stroke) {
  if (points.length < 2) {
    return '';
  }
  const end = points[points.length - 1];
  const prev = points[points.length - 2];
  const dx = end.x - prev.x;
  const dy = end.y - prev.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const px = -uy;
  const py = ux;
  const base = {
    x: end.x - ux * pointerLength,
    y: end.y - uy * pointerLength,
  };
  const left = {
    x: base.x + px * (pointerWidth / 2),
    y: base.y + py * (pointerWidth / 2),
  };
  const right = {
    x: base.x - px * (pointerWidth / 2),
    y: base.y - py * (pointerWidth / 2),
  };

  return `${polyline(points, stroke, strokeWidth)}${polygon([left, end, right], stroke, strokeWidth, fill)}`;
}

function componentBounds(component: ComponentEntity): Bounds {
  const isHorizontal = component.rotation % 180 === 0;
  const halfWidth = isHorizontal ? 26 : 14;
  const halfHeight = isHorizontal ? 14 : 26;
  return {
    minX: component.x - halfWidth,
    maxX: component.x + halfWidth,
    minY: component.y - halfHeight,
    maxY: component.y + halfHeight,
  };
}

function getDrawingDisplayText(drawing: DrawingEntity) {
  return drawing.toolId === 'text' ? drawing.text?.trim() || 'Text' : '';
}

function getClipboardTextFallback(content: string) {
  return content
    .replace(/\$\$([\s\S]+?)\$\$/g, '$1')
    .replace(/\$([^$]+?)\$/g, '$1')
    .replace(/\\\((.+?)\\\)/g, '$1')
    .replace(/\\\[(.+?)\\\]/g, '$1')
    .trim();
}

function drawingBounds(drawing: DrawingEntity): Bounds {
  if (drawing.toolId === 'joint' || drawing.toolId === 'port') {
    return {
      minX: drawing.x - 4,
      maxX: drawing.x + 4,
      minY: drawing.y - 4,
      maxY: drawing.y + 4,
    };
  }

  if (drawing.toolId === 'text') {
    const text = getDrawingDisplayText(drawing);
    const metrics = measureRenderedText(text, getTextSymbolFontSize(drawing.fontSize));
    const width = Math.max(24, metrics.width + LABEL_PADDING_X * 2);
    const height = Math.max(16, metrics.height + LABEL_PADDING_Y * 2);
    return {
      minX: drawing.x - width / 2,
      maxX: drawing.x + width / 2,
      minY: drawing.y - height / 2,
      maxY: drawing.y + height / 2,
    };
  }

  return {
    minX: drawing.x - 20,
    maxX: drawing.x + 20,
    minY: drawing.y - 20,
    maxY: drawing.y + 20,
  };
}

function wirePoints(wire: WireEntity) {
  return wire.vertices.map((point) => ({
    x: wire.x + point.x,
    y: wire.y + point.y,
  }));
}

function wireBounds(wire: WireEntity): Bounds {
  const points = wirePoints(wire);
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const pad = Math.max(3, getWireStrokeWidth(wire.strokeWidth));
  return {
    minX: Math.min(...xs) - pad,
    maxX: Math.max(...xs) + pad,
    minY: Math.min(...ys) - pad,
    maxY: Math.max(...ys) + pad,
  };
}

function sceneBounds(scene: SceneData): Bounds {
  const boundsList = [
    ...scene.components.map(componentBounds),
    ...scene.drawings.map(drawingBounds),
    ...scene.wires.map(wireBounds),
  ];

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

export function getSceneExportFrame(scene: SceneData) {
  const bounds = sceneBounds(scene);
  return {
    minX: bounds.minX - EXPORT_PADDING,
    minY: bounds.minY - EXPORT_PADDING,
    width: Math.max(1, bounds.maxX - bounds.minX + EXPORT_PADDING * 2),
    height: Math.max(1, bounds.maxY - bounds.minY + EXPORT_PADDING * 2),
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
  const metrics = measureRenderedText(displayContent, fontSize);
  const width = Math.max(24, metrics.width + LABEL_PADDING_X * 2);
  const height = Math.max(16, metrics.height + LABEL_PADDING_Y * 2);
  const color = getColor(drawing.strokeColor);

  return `<g transform="translate(${drawing.x} ${drawing.y}) rotate(${drawing.rotation})"><text x="0" y="0" fill="${escapeAttribute(color)}" stroke="none" font-family="${escapeAttribute(EXPORT_FONT_FAMILY)}" font-size="${fontSize}" text-anchor="middle" dominant-baseline="central">${escapeXml(displayContent)}</text></g>`;
}

function renderTextDrawing(drawing: DrawingEntity, options: SvgExportOptions) {
  if (options.disableForeignObject) {
    return renderPlainTextDrawing(drawing);
  }
  const content = getDrawingDisplayText(drawing);
  const fontSize = getTextSymbolFontSize(drawing.fontSize);
  const metrics = measureRenderedText(content, fontSize);
  const width = Math.max(24, metrics.width + LABEL_PADDING_X * 2);
  const height = Math.max(16, metrics.height + LABEL_PADDING_Y * 2);
  const color = getColor(drawing.strokeColor);
  const boxX = -width / 2;
  const boxY = -height / 2;
  const transform = `translate(${drawing.x} ${drawing.y}) rotate(${drawing.rotation})`;
  const markup = hasLatexSyntax(content)
    ? renderRichTextMarkup(content)
    : escapeXml(content);
  const borderStyle = drawing.border === true ? `border:1.2px solid ${escapeAttribute(color)};` : 'border:none;';
  return `<g transform="${transform}"><foreignObject x="${boxX}" y="${boxY}" width="${width}" height="${height}"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;display:flex;align-items:center;justify-content:center;text-align:center;white-space:nowrap;color:${escapeAttribute(color)};font-family:${escapeAttribute(EXPORT_FONT_FAMILY)};font-size:${fontSize}px;line-height:1;overflow:visible;box-sizing:border-box;${borderStyle}">${markup}</div></foreignObject></g>`;
}

function renderWire(wire: WireEntity) {
  const points = wirePoints(wire);
  return polyline(points, getColor(wire.strokeColor), getWireStrokeWidth(wire.strokeWidth), getWireDash(wire.dash));
}

function translateGroup(x: number, y: number, body: string) {
  return `<g transform="translate(${x} ${y})">${body}</g>`;
}

function transformGroup(transform: string, body: string) {
  return `<g transform="${transform}">${body}</g>`;
}

function renderBasicComponent(toolId: ComponentEntity['toolId'], stroke: string): string {
  switch (toolId) {
    case 'resistor':
      return `${polyline([{ x: -12, y: 0 }, { x: -10, y: -4 }, { x: -6, y: 4 }, { x: -2, y: -4 }, { x: 2, y: 4 }, { x: 6, y: -4 }, { x: 10, y: 4 }, { x: 12, y: 0 }], stroke, 2)}${line(-20, 0, -12, 0, stroke, 1)}${line(12, 0, 20, 0, stroke, 1)}`;
    case 'potentiometer':
      return `${renderBasicComponent('resistor', stroke)}${arrow([{ x: 0, y: -20 }, { x: 0, y: -5 }], stroke, 1, 3, 3)}`;
    case 'capacitor':
      return `${line(-2, -6, -2, 6, stroke, 2)}${line(2, -6, 2, 6, stroke, 2)}${line(-20, 0, -2, 0, stroke, 1)}${line(2, 0, 20, 0, stroke, 1)}`;
    case 'polarised-capacitor':
      return `${line(-2, -6, -2, 6, stroke, 2)}${path('M 2 -6 Q -1 0 2 6', stroke, 2)}${line(-20, 0, -2, 0, stroke, 1)}${line(0, 0, 20, 0, stroke, 1)}${line(-8, -6, -8, -2, stroke, 1.5)}${line(-10, -4, -6, -4, stroke, 1.5)}`;
    case 'variable-capacitor':
      return `${renderBasicComponent('capacitor', stroke)}${arrow([{ x: 6, y: 6 }, { x: -6, y: -6 }], stroke, 1, 3, 3)}`;
    case 'inductor':
      return `${topArc(-12, 0, 4, stroke, 2)}${topArc(-4, 0, 4, stroke, 2)}${topArc(4, 0, 4, stroke, 2)}${topArc(12, 0, 4, stroke, 2)}${line(-20, 0, -16, 0, stroke, 1)}${line(16, 0, 20, 0, stroke, 1)}`;
    case 'variable-inductor':
      return `${renderBasicComponent('inductor', stroke)}${arrow([{ x: 8, y: 6 }, { x: -8, y: -10 }], stroke, 1, 3, 3)}`;
    case 'transformer':
      return `${topArc(-12, 20, 4, stroke, 2)}${topArc(-4, 20, 4, stroke, 2)}${topArc(4, 20, 4, stroke, 2)}${topArc(12, 20, 4, stroke, 2)}${bottomArc(-12, -20, 4, stroke, 2)}${bottomArc(-4, -20, 4, stroke, 2)}${bottomArc(4, -20, 4, stroke, 2)}${bottomArc(12, -20, 4, stroke, 2)}${line(-20, 20, -16, 20, stroke, 1)}${line(16, 20, 20, 20, stroke, 1)}${line(-20, -20, -16, -20, stroke, 1)}${line(16, -20, 20, -20, stroke, 1)}${line(-16, -2, 16, -2, stroke, 2)}${line(-16, 2, 16, 2, stroke, 2)}`;
    case 'diode':
      return `${polyline([{ x: 5, y: 0 }, { x: -5, y: -6 }, { x: -5, y: 6 }, { x: 5, y: 0 }], stroke, 2)}${line(5, -6, 5, 6, stroke, 2)}${line(-20, 0, -5, 0, stroke, 1)}${line(5, 0, 20, 0, stroke, 1)}`;
    case 'zener-diode':
      return `${polyline([{ x: 5, y: 0 }, { x: -5, y: -6 }, { x: -5, y: 6 }, { x: 5, y: 0 }], stroke, 2)}${polyline([{ x: 7, y: -7 }, { x: 5, y: -5 }, { x: 5, y: 5 }, { x: 3, y: 7 }], stroke, 2)}${line(-20, 0, -5, 0, stroke, 1)}${line(5, 0, 20, 0, stroke, 1)}`;
    case 'schottky-diode':
      return `${polyline([{ x: 5, y: 0 }, { x: -5, y: -6 }, { x: -5, y: 6 }, { x: 5, y: 0 }], stroke, 2)}${polyline([{ x: 7, y: -5 }, { x: 7, y: -7 }, { x: 5, y: -7 }, { x: 5, y: 7 }, { x: 3, y: 7 }, { x: 3, y: 5 }], stroke, 2)}${line(-20, 0, -5, 0, stroke, 1)}${line(5, 0, 20, 0, stroke, 1)}`;
    case 'switch':
      return `${line(-20, 0, -12, 0, stroke, 1)}${line(12, 0, 20, 0, stroke, 1)}${line(-12, 0, 8, 8, stroke, 2)}${circle(-12, 0, 2, stroke, 2, 'white')}${circle(12, 0, 2, stroke, 2, 'white')}`;
    case 'n-mosfet':
      return `${line(-8, 8, 8, 8, stroke, 2)}${line(-6, 12, 6, 12, stroke, 2)}${line(0, 12, 0, 20, stroke, 1)}${polyline([{ x: -20, y: 0 }, { x: -6, y: 0 }, { x: -6, y: 8 }], stroke, 1)}${line(0, 0, 20, 0, stroke, 1)}${line(6, 0, 6, 8, stroke, 1)}${arrow([{ x: 0, y: 0 }, { x: 0, y: 8 }], stroke, 1, 3, 3)}`;
    case 'p-mosfet':
      return `${line(-8, 8, 8, 8, stroke, 2)}${line(-6, 12, 6, 12, stroke, 2)}${line(0, 12, 0, 20, stroke, 1)}${polyline([{ x: -20, y: 0 }, { x: -6, y: 0 }, { x: -6, y: 8 }], stroke, 1)}${polyline([{ x: 6, y: 8 }, { x: 6, y: 0 }, { x: 20, y: 0 }], stroke, 1)}${line(-6, 0, 0, 0, stroke, 1)}${arrow([{ x: 0, y: 8 }, { x: 0, y: 0 }], stroke, 1, 3, 3)}`;
    case 'npn-bjt':
      return `${line(-20, 0, -10, 0, stroke, 1)}${line(10, 0, 20, 0, stroke, 1)}${line(-10, 0, -4, 8, stroke, 2)}${line(-8, 8, 8, 8, stroke, 2)}${arrow([{ x: 4, y: 8 }, { x: 10, y: 0 }], stroke, 2, 2, 2)}${line(0, 8, 0, 20, stroke, 1)}`;
    case 'pnp-bjt':
      return `${line(-20, 0, -10, 0, stroke, 1)}${line(10, 0, 20, 0, stroke, 1)}${line(10, 0, 4, 8, stroke, 2)}${line(-8, 8, 8, 8, stroke, 2)}${arrow([{ x: -10, y: 0 }, { x: -4, y: 7 }], stroke, 2, 2, 2)}${line(0, 8, 0, 20, stroke, 1)}`;
    case 'spark-gap':
      return `${line(-20, 0, -12, 0, stroke, 1)}${line(12, 0, 20, 0, stroke, 1)}${arrow([{ x: -12, y: 0 }, { x: -2, y: 0 }], stroke, 2, 3, 3)}${arrow([{ x: 12, y: 0 }, { x: 2, y: 0 }], stroke, 2, 3, 3)}`;
    case 'ic':
      return `${polyline([{ x: -16, y: -16 }, { x: -16, y: 16 }, { x: 12, y: 0 }, { x: -16, y: -16 }], stroke, 2)}${line(-20, 0, -16, 0, stroke, 1)}${line(12, 0, 20, 0, stroke, 1)}`;
    case 'not-gate':
      return `${renderBasicComponent('ic', stroke)}${circle(14, 0, 2, stroke, 2, 'white')}`;
    case 'and-gate':
      return `${path('M -16 -16 L -4 -16 A 16 16 0 0 1 -4 16 L -16 16 Z', stroke, 2)}${line(-20, -10, -16, -10, stroke, 1)}${line(-20, 10, -16, 10, stroke, 1)}${line(12, 0, 20, 0, stroke, 1)}`;
    case 'nand-gate':
      return `${renderBasicComponent('and-gate', stroke)}${circle(14, 0, 2, stroke, 2, 'white')}${line(16, 0, 20, 0, stroke, 1)}`;
    case 'or-gate':
      return `${path('M -16 -16 Q 4 -16 12 0 Q 4 16 -16 16 Q -10 0 -16 -16', stroke, 2)}${line(-20, -10, -14, -10, stroke, 1)}${line(-20, 10, -14, 10, stroke, 1)}${line(12, 0, 20, 0, stroke, 1)}`;
    case 'nor-gate':
      return `${renderBasicComponent('or-gate', stroke)}${circle(14, 0, 2, stroke, 2, 'white')}${line(16, 0, 20, 0, stroke, 1)}`;
    case 'xor-gate':
      return `${path('M -12 -16 Q 8 -16 16 0 Q 8 16 -12 16 Q -6 0 -12 -16', stroke, 2)}${path('M -16 -16 Q -10 0 -16 16', stroke, 2)}${line(-20, -10, -14, -10, stroke, 1)}${line(-20, 10, -14, 10, stroke, 1)}${line(16, 0, 20, 0, stroke, 1)}`;
    case 'opamp':
      return `${polyline([{ x: -16, y: -16 }, { x: -16, y: 16 }, { x: 12, y: 0 }, { x: -16, y: -16 }], stroke, 2)}${line(-20, -10, -16, -10, stroke, 1)}${line(-20, 10, -16, 10, stroke, 1)}${line(12, 0, 20, 0, stroke, 1)}${line(-13, -9, -9, -9, stroke, 1)}${line(-11, -11, -11, -7, stroke, 1)}${line(-13, 9, -9, 9, stroke, 1)}`;
    case 'ground':
      return `${line(-10, -4, 10, -4, stroke, 2)}${line(-6, 0, 6, 0, stroke, 2)}${line(-2, 4, 2, 4, stroke, 2)}${line(0, -20, 0, -4, stroke, 1)}`;
    case 'v-rail':
      return `${line(0, 0, 0, 10, stroke, 1)}${line(-10, 0, 10, 0, stroke, 2)}`;
    case 'vss':
      return `${line(0, -20, 0, 0, stroke, 1)}${polyline([{ x: -10, y: 0 }, { x: 0, y: 10 }, { x: 10, y: 0 }, { x: -10, y: 0 }], stroke, 2)}`;
    case 'chassis-ground':
      return `${line(0, 0, 0, -10, stroke, 1)}${line(-10, 0, 10, 0, stroke, 2)}${line(-10, 0, -15, 8, stroke, 2)}${line(0, 0, -5, 8, stroke, 2)}${line(10, 0, 5, 8, stroke, 2)}`;
    case 'source':
      return `${circle(0, 0, 12, stroke, 2)}${line(-9, 0, -3, 0, stroke, 1)}${line(-6, -3, -6, 3, stroke, 1)}${line(6, -3, 6, 3, stroke, 1)}${line(-20, 0, -12, 0, stroke, 1)}${line(12, 0, 20, 0, stroke, 1)}`;
    case 'current-source':
      return `${circle(0, 0, 12, stroke, 2)}${arrow([{ x: 8, y: 0 }, { x: -8, y: 0 }], stroke, 1, 4, 4)}${line(-20, 0, -12, 0, stroke, 1)}${line(12, 0, 20, 0, stroke, 1)}`;
    case 'ac-source':
      return `${circle(0, 0, 12, stroke, 2)}${path('M 0 -8 C 4 -6 4 -2 0 0 C -4 2 -4 6 0 8', stroke, 1)}${line(-20, 0, -12, 0, stroke, 1)}${line(12, 0, 20, 0, stroke, 1)}`;
    case 'controlled-voltage-source':
      return `${polyline([{ x: 0, y: -12 }, { x: 12, y: 0 }, { x: 0, y: 12 }, { x: -12, y: 0 }, { x: 0, y: -12 }], stroke, 2)}${line(-8, 0, -2, 0, stroke, 1)}${line(-5, -3, -5, 3, stroke, 1)}${line(5, -3, 5, 3, stroke, 1)}${line(-20, 0, -12, 0, stroke, 1)}${line(12, 0, 20, 0, stroke, 1)}`;
    case 'controlled-current-source':
      return `${polyline([{ x: 0, y: -12 }, { x: 12, y: 0 }, { x: 0, y: 12 }, { x: -12, y: 0 }, { x: 0, y: -12 }], stroke, 2)}${arrow([{ x: 6, y: 0 }, { x: -6, y: 0 }], stroke, 1, 4, 4)}${line(-20, 0, -12, 0, stroke, 1)}${line(12, 0, 20, 0, stroke, 1)}`;
    default:
      return '';
  }
}

function renderComponent(component: ComponentEntity) {
  const stroke = getColor(component.strokeColor);
  const body = renderBasicComponent(component.toolId, stroke);
  const baseRotation = ROTATED_COMPONENTS_90.has(component.toolId)
    ? `<g transform="rotate(90)">${body}</g>`
    : body;
  const flipped = component.flipped === true
    ? `<g transform="scale(-1 1)">${baseRotation}</g>`
    : baseRotation;
  return `<g transform="translate(${component.x} ${component.y})"><g transform="rotate(${component.rotation})">${flipped}</g></g>`;
}

function renderDrawing(drawing: DrawingEntity, options: SvgExportOptions) {
  const stroke = getColor(drawing.strokeColor);
  switch (drawing.toolId) {
    case 'joint':
      return translateGroup(drawing.x, drawing.y, `<circle cx="0" cy="0" r="2" fill="${stroke}" />`);
    case 'port':
      return translateGroup(drawing.x, drawing.y, circle(0, 0, 1.5, stroke, 1, 'white'));
    case 'bridge': {
      const width = getWireStrokeWidth(drawing.strokeWidth);
      return transformGroup(
        `translate(${drawing.x} ${drawing.y}) rotate(${drawing.rotation})`,
        `${line(0, -10, 0, -3, stroke, width)}${line(0, 3, 0, 10, stroke, width)}${rightArc(0, 0, 3, stroke, width)}`
      );
    }
    case 'half-circle': {
      const width = getWireStrokeWidth(drawing.strokeWidth);
      return transformGroup(
        `translate(${drawing.x} ${drawing.y}) rotate(${drawing.rotation})`,
        rightArc(0, -5, 5, stroke, width)
      );
    }
    case 'text':
      return renderTextDrawing(drawing, options);
    case 'voltage-plus-annotation':
      return transformGroup(`translate(${drawing.x} ${drawing.y}) rotate(${drawing.rotation})`, `${line(-4, 0, 4, 0, stroke, 1.8)}${line(0, -4, 0, 4, stroke, 1.8)}`);
    case 'voltage-minus-annotation':
      return transformGroup(`translate(${drawing.x} ${drawing.y}) rotate(${drawing.rotation})`, line(-4, 0, 4, 0, stroke, 1.8));
    case 'current-annotation':
      return transformGroup(`translate(${drawing.x} ${drawing.y}) rotate(${drawing.rotation})`, arrow([{ x: -12, y: 0 }, { x: 12, y: 0 }], stroke, 1, 5, 5));
    default:
      return '';
  }
}

export function sceneToSvg(scene: SceneData, options: SvgExportOptions = {}) {
  const { minX, minY, width, height } = getSceneExportFrame(scene);
  const title = options.title ? `<title>${escapeXml(options.title)}</title>` : '';
  const body = [
    ...scene.components.map(renderComponent),
    ...scene.wires.map(renderWire),
    ...scene.drawings
      .filter((drawing) => !(options.omitTextDrawings && drawing.toolId === 'text'))
      .map((drawing) => renderDrawing(drawing, options)),
  ].join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xhtml="http://www.w3.org/1999/xhtml" viewBox="${minX} ${minY} ${width} ${height}" width="${width}" height="${height}" role="img">
${title}
<g fill="none" stroke="${DEFAULT_STROKE_COLOR}" stroke-linecap="round" stroke-linejoin="round">
${body}
</g>
</svg>`;
}
