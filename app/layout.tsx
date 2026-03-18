import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '業務管理システム | 行政書士法人榊原・箭内事務所',
  description: '取引先依頼のTODO管理システム',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-slate-50 text-slate-800 font-sans">{children}</body>
    </html>
  )
}
