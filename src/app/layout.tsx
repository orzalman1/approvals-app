import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'מערכת אישורים',
  description: 'מערכת לניהול ואישור בקשות',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className="h-full">
      <body className="min-h-full bg-gray-50 font-sans antialiased">{children}</body>
    </html>
  )
}
