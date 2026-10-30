import React from 'react';

/**
 * Serialises a react-konva element tree (the same symbol components rendered on
 * the canvas) into SVG markup, so exports always match what is drawn on screen.
 *
 * Supported primitives: Group, Line, Arrow, Arc, Rect, Circle and Shape (via a
 * recording canvas context for `sceneFunc`). Invisible nodes (opacity 0, e.g.
 * hit areas) are skipped.
 */

export interface SvgBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface KonvaSvgResult {
  markup: string;
  bounds: SvgBounds | null;
}

type Matrix = [number, number, number, number, number, number];
type Props = Record<string, any>;

const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];
const ARC_SAMPLES = 24;
const CURVE_SAMPLES = 12;

function multiply(m: Matrix, n: Matrix): Matrix {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ];
}

function applyMatrix(m: Matrix, x: number, y: number) {
  return { x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] };
}

function num(value: number) {
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 1e4) / 1e4);
}

function escapeAttribute(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function nodeTransform(props: Props) {
  const x = props.x ?? 0;
  const y = props.y ?? 0;
  const rotation = props.rotation ?? 0;
  const scaleX = props.scaleX ?? 1;
  const scaleY = props.scaleY ?? 1;
  const offsetX = props.offsetX ?? 0;
  const offsetY = props.offsetY ?? 0;

  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  let matrix: Matrix = [cos * scaleX, sin * scaleX, -sin * scaleY, cos * scaleY, x, y];
  if (offsetX || offsetY) {
    matrix = multiply(matrix, [1, 0, 0, 1, -offsetX, -offsetY]);
  }

  const parts: string[] = [];
  if (x || y) parts.push(`translate(${num(x)} ${num(y)})`);
  if (rotation) parts.push(`rotate(${num(rotation)})`);
  if (scaleX !== 1 || scaleY !== 1) parts.push(`scale(${num(scaleX)} ${num(scaleY)})`);
  if (offsetX || offsetY) parts.push(`translate(${num(-offsetX)} ${num(-offsetY)})`);

  return { matrix, attr: parts.length ? ` transform="${parts.join(' ')}"` : '' };
}

function isVisible(props: Props) {
  return props.visible !== false && (props.opacity ?? 1) > 0;
}

function paintAttributes(props: Props, options: { forceFill?: string; noDash?: boolean } = {}) {
  const stroke = props.strokeEnabled === false ? undefined : props.stroke;
  const strokeWidth = props.strokeWidth ?? 1;
  const hasStroke = Boolean(stroke) && strokeWidth > 0;
  const rawFill = options.forceFill ?? (props.fillEnabled === false ? undefined : props.fill);
  const fill = rawFill === 'transparent' ? undefined : rawFill;

  let attrs = ` fill="${fill ? escapeAttribute(fill) : 'none'}"`;
  if (hasStroke) {
    attrs += ` stroke="${escapeAttribute(stroke)}" stroke-width="${num(strokeWidth)}"`;
    attrs += ` stroke-linecap="${props.lineCap ?? 'butt'}" stroke-linejoin="${props.lineJoin ?? 'miter'}"`;
    if (!options.noDash && props.dashEnabled !== false && Array.isArray(props.dash) && props.dash.length > 0) {
      attrs += ` stroke-dasharray="${props.dash.map(num).join(' ')}"`;
    }
  } else {
    attrs += ' stroke="none"';
  }
  if (props.opacity !== undefined && props.opacity !== 1) {
    attrs += ` opacity="${num(props.opacity)}"`;
  }
  return { attrs, strokePad: hasStroke ? strokeWidth / 2 : 0, painted: hasStroke || Boolean(fill) };
}

class BoundsAccumulator {
  bounds: SvgBounds | null = null;

  add(matrix: Matrix, points: Array<{ x: number; y: number }>, pad: number) {
    for (const point of points) {
      const p = applyMatrix(matrix, point.x, point.y);
      if (!this.bounds) {
        this.bounds = { minX: p.x - pad, maxX: p.x + pad, minY: p.y - pad, maxY: p.y + pad };
        continue;
      }
      this.bounds.minX = Math.min(this.bounds.minX, p.x - pad);
      this.bounds.maxX = Math.max(this.bounds.maxX, p.x + pad);
      this.bounds.minY = Math.min(this.bounds.minY, p.y - pad);
      this.bounds.maxY = Math.max(this.bounds.maxY, p.y + pad);
    }
  }
}

/** Records Canvas 2D path calls from a Konva `sceneFunc` as SVG path data. */
class PathRecorder {
  segments: string[] = [];
  samples: Array<{ x: number; y: number }> = [];
  paints: Array<{ d: string; fill: boolean; stroke: boolean }> = [];
  private current: { x: number; y: number } | null = null;
  private start: { x: number; y: number } | null = null;

  beginPath() {
    this.segments = [];
    this.current = null;
    this.start = null;
  }

  moveTo(x: number, y: number) {
    this.segments.push(`M ${num(x)} ${num(y)}`);
    this.current = { x, y };
    this.start = { x, y };
    this.samples.push({ x, y });
  }

  lineTo(x: number, y: number) {
    if (!this.current) {
      this.moveTo(x, y);
      return;
    }
    this.segments.push(`L ${num(x)} ${num(y)}`);
    this.current = { x, y };
    this.samples.push({ x, y });
  }

  quadraticCurveTo(cx: number, cy: number, x: number, y: number) {
    const from = this.current ?? { x: cx, y: cy };
    if (!this.current) this.moveTo(cx, cy);
    this.segments.push(`Q ${num(cx)} ${num(cy)} ${num(x)} ${num(y)}`);
    for (let i = 1; i <= CURVE_SAMPLES; i += 1) {
      const t = i / CURVE_SAMPLES;
      const mt = 1 - t;
      this.samples.push({
        x: mt * mt * from.x + 2 * mt * t * cx + t * t * x,
        y: mt * mt * from.y + 2 * mt * t * cy + t * t * y,
      });
    }
    this.current = { x, y };
  }

  bezierCurveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number) {
    const from = this.current ?? { x: c1x, y: c1y };
    if (!this.current) this.moveTo(c1x, c1y);
    this.segments.push(`C ${num(c1x)} ${num(c1y)} ${num(c2x)} ${num(c2y)} ${num(x)} ${num(y)}`);
    for (let i = 1; i <= CURVE_SAMPLES; i += 1) {
      const t = i / CURVE_SAMPLES;
      const mt = 1 - t;
      this.samples.push({
        x: mt * mt * mt * from.x + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t * t * t * x,
        y: mt * mt * mt * from.y + 3 * mt * mt * t * c1y + 3 * mt * t * t * c2y + t * t * t * y,
      });
    }
    this.current = { x, y };
  }

  arc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number, counterclockwise = false) {
    const startPoint = { x: cx + radius * Math.cos(startAngle), y: cy + radius * Math.sin(startAngle) };
    if (this.current) {
      this.lineTo(startPoint.x, startPoint.y);
    } else {
      this.moveTo(startPoint.x, startPoint.y);
    }

    // Normalise the sweep the same way Canvas 2D does.
    const fullTurn = Math.PI * 2;
    let sweep = endAngle - startAngle;
    if (!counterclockwise) {
      if (sweep >= fullTurn) sweep = fullTurn;
      else sweep = ((sweep % fullTurn) + fullTurn) % fullTurn;
    } else {
      if (-sweep >= fullTurn) sweep = -fullTurn;
      else sweep = -((((-sweep) % fullTurn) + fullTurn) % fullTurn);
    }
    if (radius <= 0 || sweep === 0) {
      return;
    }

    // SVG cannot draw a full circle with one arc command; split into halves.
    const steps = Math.abs(sweep) >= fullTurn - 1e-9 ? 2 : 1;
    const sweepFlag = sweep > 0 ? 1 : 0;
    for (let i = 1; i <= steps; i += 1) {
      const angle = startAngle + (sweep * i) / steps;
      const largeArc = Math.abs(sweep / steps) > Math.PI ? 1 : 0;
      const end = { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
      this.segments.push(`A ${num(radius)} ${num(radius)} 0 ${largeArc} ${sweepFlag} ${num(end.x)} ${num(end.y)}`);
      this.current = end;
    }
    for (let i = 1; i <= ARC_SAMPLES; i += 1) {
      const angle = startAngle + (sweep * i) / ARC_SAMPLES;
      this.samples.push({ x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) });
    }
  }

  rect(x: number, y: number, width: number, height: number) {
    this.moveTo(x, y);
    this.lineTo(x + width, y);
    this.lineTo(x + width, y + height);
    this.lineTo(x, y + height);
    this.closePath();
  }

  closePath() {
    this.segments.push('Z');
    if (this.start) this.current = { ...this.start };
  }

  private emit(fill: boolean, stroke: boolean) {
    if (this.segments.length > 0) {
      this.paints.push({ d: this.segments.join(' '), fill, stroke });
    }
  }

  strokeShape() {
    this.emit(false, true);
  }

  fillShape() {
    this.emit(true, false);
  }

  fillStrokeShape() {
    this.emit(true, true);
  }

  // Canvas state calls are no-ops for path recording.
  save() {}
  restore() {}
  setAttr() {}
}

function flatPoints(points: number[] | undefined) {
  const result: Array<{ x: number; y: number }> = [];
  if (!Array.isArray(points)) return result;
  for (let i = 0; i + 1 < points.length; i += 2) {
    result.push({ x: points[i], y: points[i + 1] });
  }
  return result;
}

function pointsAttr(points: Array<{ x: number; y: number }>) {
  return points.map((point) => `${num(point.x)},${num(point.y)}`).join(' ');
}

function renderLine(props: Props, matrix: Matrix, acc: BoundsAccumulator) {
  const points = flatPoints(props.points);
  if (points.length < 2) return '';
  const paint = paintAttributes(props, { forceFill: props.closed ? props.fill : undefined });
  acc.add(matrix, points, paint.strokePad);
  const tag = props.closed ? 'polygon' : 'polyline';
  const fillAttrs = props.closed ? paint.attrs : paint.attrs.replace(/ fill="[^"]*"/, ' fill="none"');
  return `<${tag} points="${pointsAttr(points)}"${fillAttrs} />`;
}

function arrowHead(tip: { x: number; y: number }, from: { x: number; y: number }, length: number, width: number) {
  const angle = Math.atan2(tip.y - from.y, tip.x - from.x);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const local = [
    { x: 0, y: 0 },
    { x: -length, y: width / 2 },
    { x: -length, y: -width / 2 },
  ];
  return local.map((p) => ({ x: tip.x + p.x * cos - p.y * sin, y: tip.y + p.x * sin + p.y * cos }));
}

function renderArrow(props: Props, matrix: Matrix, acc: BoundsAccumulator) {
  const points = flatPoints(props.points);
  if (points.length < 2) return '';
  const length = props.pointerLength ?? 10;
  const width = props.pointerWidth ?? 10;
  let markup = renderLine({ ...props, closed: false }, matrix, acc);
  const headPaint = paintAttributes(props, { noDash: true });
  const heads: Array<Array<{ x: number; y: number }>> = [];
  if (props.pointerAtEnding !== false) {
    heads.push(arrowHead(points[points.length - 1], points[points.length - 2], length, width));
  }
  if (props.pointerAtBeginning === true) {
    heads.push(arrowHead(points[0], points[1], length, width));
  }
  for (const head of heads) {
    acc.add(matrix, head, headPaint.strokePad);
    markup += `<polygon points="${pointsAttr(head)}"${headPaint.attrs} />`;
  }
  return markup;
}

function renderRecordedShape(props: Props, matrix: Matrix, acc: BoundsAccumulator, draw: (ctx: PathRecorder) => void) {
  const recorder = new PathRecorder();
  draw(recorder);
  const paint = paintAttributes(props);
  acc.add(matrix, recorder.samples, paint.strokePad);
  return recorder.paints
    .map(({ d, fill, stroke }) => {
      const attrs = paintAttributes({
        ...props,
        fill: fill ? props.fill : undefined,
        stroke: stroke ? props.stroke : undefined,
      }).attrs;
      return `<path d="${d}"${attrs} />`;
    })
    .join('');
}

function renderArc(props: Props, matrix: Matrix, acc: BoundsAccumulator) {
  const angle = ((props.angle ?? 0) * Math.PI) / 180;
  const clockwise = props.clockwise === true;
  const inner = props.innerRadius ?? 0;
  const outer = props.outerRadius ?? 0;
  // Konva draws an Arc as a closed ring segment. With equal radii that is a
  // single stroked arc traced out and back, so emit the arc only.
  if (inner === outer) {
    return renderRecordedShape(props, matrix, acc, (ctx) => {
      ctx.beginPath();
      ctx.arc(0, 0, outer, 0, angle, clockwise);
      ctx.fillStrokeShape();
    });
  }
  return renderRecordedShape(props, matrix, acc, (ctx) => {
    ctx.beginPath();
    ctx.arc(0, 0, outer, 0, angle, clockwise);
    ctx.arc(0, 0, inner, angle, 0, !clockwise);
    ctx.closePath();
    ctx.fillStrokeShape();
  });
}

function renderRect(props: Props, matrix: Matrix, acc: BoundsAccumulator) {
  const width = props.width ?? 0;
  const height = props.height ?? 0;
  const paint = paintAttributes(props);
  if (!paint.painted) return '';
  acc.add(
    matrix,
    [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height },
    ],
    paint.strokePad
  );
  const radius = typeof props.cornerRadius === 'number' && props.cornerRadius > 0
    ? ` rx="${num(props.cornerRadius)}"`
    : '';
  return `<rect x="0" y="0" width="${num(width)}" height="${num(height)}"${radius}${paint.attrs} />`;
}

function renderCircle(props: Props, matrix: Matrix, acc: BoundsAccumulator) {
  const radius = props.radius ?? 0;
  const paint = paintAttributes(props);
  if (!paint.painted) return '';
  acc.add(
    matrix,
    [
      { x: -radius, y: -radius },
      { x: radius, y: radius },
    ],
    paint.strokePad
  );
  return `<circle cx="0" cy="0" r="${num(radius)}"${paint.attrs} />`;
}

function renderNode(node: React.ReactNode, parent: Matrix, acc: BoundsAccumulator): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map((child) => renderNode(child, parent, acc)).join('');
  if (!React.isValidElement(node)) return '';

  const element = node as React.ReactElement<Props>;
  const props = element.props ?? {};

  if (element.type === React.Fragment) {
    return renderNode(props.children, parent, acc);
  }

  if (typeof element.type === 'function') {
    const Component = element.type as (props: Props) => React.ReactNode;
    return renderNode(Component(props), parent, acc);
  }

  if (!isVisible(props)) return '';

  const { matrix: local, attr } = nodeTransform(props);
  const matrix = multiply(parent, local);
  // Opacity is applied on the wrapping group so it covers every painted part.
  const shapeProps = { ...props, opacity: undefined };
  const groupOpacity = props.opacity !== undefined && props.opacity !== 1 ? ` opacity="${num(props.opacity)}"` : '';
  const wrap = (body: string) => (body ? `<g${attr}${groupOpacity}>${body}</g>` : '');

  switch (element.type) {
    case 'Group':
      return wrap(renderNode(props.children, matrix, acc));
    case 'Line':
      return wrap(renderLine(shapeProps, matrix, acc));
    case 'Arrow':
      return wrap(renderArrow(shapeProps, matrix, acc));
    case 'Arc':
      return wrap(renderArc(shapeProps, matrix, acc));
    case 'Rect':
      return wrap(renderRect(shapeProps, matrix, acc));
    case 'Circle':
      return wrap(renderCircle(shapeProps, matrix, acc));
    case 'Shape':
      if (typeof props.sceneFunc !== 'function') return '';
      return wrap(
        renderRecordedShape(shapeProps, matrix, acc, (ctx) => props.sceneFunc(ctx, shapeProps))
      );
    default:
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`konvaToSvg: unsupported node type "${String(element.type)}" skipped`);
      }
      return '';
  }
}

export function konvaElementToSvg(element: React.ReactNode): KonvaSvgResult {
  const acc = new BoundsAccumulator();
  const markup = renderNode(element, IDENTITY, acc);
  return { markup, bounds: acc.bounds };
}
