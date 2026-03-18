'use client'

interface Props {
  onClose: () => void
}

const APP_URL = 'https://todo-app-eta-fawn-15.vercel.app'

export default function QrModal({ onClose }: Props) {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(APP_URL)}&bgcolor=ffffff&color=0d9488&margin=10`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-2xl shadow-xl p-6 w-72 flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between w-full">
          <h2 className="text-sm font-bold text-teal-700">アプリのQRコード</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 text-xs"
          >
            ✕
          </button>
        </div>

        <div className="border-2 border-teal-100 rounded-xl p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrSrc}
            alt="QR Code"
            width={200}
            height={200}
            className="rounded-lg"
          />
        </div>

        <div className="text-center space-y-1">
          <p className="text-xs font-semibold text-slate-600">スキャンしてアクセス</p>
          <p className="text-[10px] text-slate-400 break-all">{APP_URL}</p>
        </div>

        <button
          onClick={() => window.open(APP_URL, '_blank')}
          className="w-full py-2 bg-teal-600 text-white text-xs font-bold rounded-lg hover:bg-teal-700 transition-colors"
        >
          URLを開く
        </button>
      </div>
    </div>
  )
}
