'use client'
import { useEffect } from 'react'

interface Props {
  message: string
  type?: 'success' | 'error' | 'info'
  onClose: () => void
}

export default function Toast({ message, type = 'success', onClose }: Props) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const styles = {
    success: 'bg-teal-600 text-white',
    error:   'bg-red-500 text-white',
    info:    'bg-slate-700 text-white',
  }

  const icons = { success: '✓', error: '✕', info: 'ℹ' }

  return (
    <div className={`toast fixed bottom-20 right-4 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold ${styles[type]}`}>
      <span className="text-base">{icons[type]}</span>
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 text-xs">✕</button>
    </div>
  )
}
