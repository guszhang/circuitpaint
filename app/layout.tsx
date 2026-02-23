import type { Metadata } from 'next';
import '../styles/globals.css';
import 'katex/dist/katex.min.css';
import DisableContextMenu from './DisableContextMenu';

export const metadata: Metadata = {
  title: 'CircuitPaint - Schematic Editor',
  description: 'A fast circuit drawing software with SVG export functions',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <DisableContextMenu />
        {children}
      </body>
    </html>
  );
}
