'use client'

import { useState } from 'react'

export default function GoogleReview() {
  const [show, setShow] = useState(false)

  // Deine Google Place ID hier einfügen!
  const reviewLink = "https://search.google.com/local/writereview?placeid=DEINE_PLACE_ID"

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!show ? (
        <button
          onClick={() => setShow(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transition-all transform hover:scale-105"
        >
          <span>⭐</span>
          <span>Bewerte uns</span>
        </button>
      ) : (
        <div className="bg-amber-900/95 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-amber-500/30 max-w-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-white font-bold text-lg">⭐ Gefällt dir Habesha Dama?</h3>
            <button onClick={() => setShow(false)} className="text-amber-300">✕</button>
          </div>
          <p className="text-amber-200 mb-4">
            Hilf uns mit einer 5-Sterne-Bewertung auf Google! 
            Das motiviert uns und hilft anderen, das Spiel zu finden.
          </p>
          <div className="flex gap-3">
            <a
              href={reviewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-center font-medium transition-all"
              onClick={() => setShow(false)}
            >
              ⭐ Jetzt bewerten
            </a>
            <button
              onClick={() => setShow(false)}
              className="px-4 py-2 bg-amber-800 hover:bg-amber-700 text-white rounded-lg transition-all"
            >
              Später
            </button>
          </div>
        </div>
      )}
    </div>
  )
}