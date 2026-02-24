'use client'

import { useState } from 'react'
import type { Position, Player, Stein } from '@/lib/game/types'
import { istGueltigerZug, kannFressen, hatWeitereFresszuege } from '@/lib/game/logic'

interface DamaBoardProps {
  brett: Stein[][]
  setBrett: (brett: Stein[][]) => void
  meinSpieler: Player | null
  aktuellerSpieler: Player
  spielBeendet: boolean
  onZug: (von: Position, nach: Position) => void
}

export default function DamaBoard({ 
  brett,
  setBrett,
  meinSpieler, 
  aktuellerSpieler, 
  spielBeendet,
  onZug 
}: DamaBoardProps) {
  const [selectedPos, setSelectedPos] = useState<Position | null>(null)

  const handleFeldKlick = (row: number, col: number) => {
    if ((row + col) % 2 === 0) return
    if (!meinSpieler || meinSpieler !== aktuellerSpieler || spielBeendet) return
    
    const stein = brett[row][col]
    
    if (selectedPos) {
      const von = selectedPos
      const nach = { row, col }
      const ausgewaehlterStein = brett[von.row][von.col]
      
      if (!ausgewaehlterStein) return
      
      const istFressen = kannFressen(brett, von, nach, meinSpieler, ausgewaehlterStein.istKoenig)
      const istNormalerZug = istGueltigerZug(brett, von, nach, meinSpieler, ausgewaehlterStein.istKoenig)
      
      if (istFressen || istNormalerZug) {
        onZug(von, nach)
        
        if (istFressen && hatWeitereFresszuege(brett, nach, meinSpieler, ausgewaehlterStein.istKoenig)) {
          setSelectedPos(nach)
        } else {
          setSelectedPos(null)
        }
      } else {
        if (stein && stein.spieler === meinSpieler) {
          setSelectedPos({ row, col })
        } else {
          alert('Ungültiger Zug!')
          setSelectedPos(null)
        }
      }
    } else if (stein && stein.spieler === meinSpieler) {
      setSelectedPos({ row, col })
    }
  }

  const istDunklesFeld = (row: number, col: number) => (row + col) % 2 !== 0

  return (
   <div className="relative w-full max-w-[1000px] mx-auto">
      {/* 🟢 EXTRA AMPEL ÜBER DEM BRETT 🟢 */}
      <div className="mb-4 text-center">
        <div className="inline-flex items-center gap-3 bg-black/30 backdrop-blur-sm px-6 py-3 rounded-full border border-amber-500/30">
          <span className="text-amber-300">Aktueller Zug:</span>
          <div className="flex items-center gap-2">
            <span className={`w-4 h-4 rounded-full ${
              aktuellerSpieler === 'schwarz' ? 'bg-gray-900' : 'bg-white'
            } border-2 border-amber-500`} />
            <span className={`text-xl font-bold ${
              aktuellerSpieler === 'schwarz' ? 'text-white' : 'text-gray-200'
            }`}>
              {aktuellerSpieler === 'schwarz' ? 'SCHWARZ' : 'WEISS'}
            </span>
            {aktuellerSpieler === meinSpieler && (
              <span className="ml-2 text-green-400 animate-pulse text-2xl">●</span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-amber-950 p-4 rounded-2xl shadow-2xl">
        <div className="grid grid-cols-8 gap-0 aspect-square w-full">
          {brett.map((reihe, rowIndex) => 
            reihe.map((stein, colIndex) => {
              const istDunkel = istDunklesFeld(rowIndex, colIndex)
              const istSelektiert = selectedPos?.row === rowIndex && selectedPos?.col === colIndex
              
              let bgColor = istDunkel 
                ? 'bg-gradient-to-br from-amber-950 to-amber-900' 
                : 'bg-gradient-to-br from-amber-100 to-amber-50'
              
              if (istSelektiert) {
                bgColor = 'bg-gradient-to-br from-blue-600 to-blue-500'
              }
              
              // 🟢 AMPEL: Kann dieser Stein bewegt werden? (nur wenn du dran bist UND es dein Stein ist)
              const kannBewegtWerden = meinSpieler === aktuellerSpieler && stein?.spieler === meinSpieler
              
        // Stein viel kleiner machen, damit er ins Feld passt
              const steinSize = 'w-[90%] h-[90%]'  // Perfekte Größe
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`
                    ${bgColor}
                    flex items-center justify-center
                    cursor-pointer transition-all duration-200
                    hover:brightness-110 hover:scale-[1.02] hover:z-10
                    border border-amber-950/50
                    ${meinSpieler !== aktuellerSpieler ? 'opacity-90' : ''}
                    ${spielBeendet ? 'opacity-50 pointer-events-none' : ''}
                    relative aspect-square
                  `}
                  onClick={() => handleFeldKlick(rowIndex, colIndex)}
                >
                  {stein && (
                    <div className={`
                      stein
                      ${stein.spieler === 'schwarz' 
                        ? 'bg-gradient-to-br from-gray-800 to-black border-2 border-gray-600' 
                        : 'bg-gradient-to-br from-gray-100 to-white border-2 border-gray-400'
                      }
                      ${steinSize}
                      rounded-full
                      shadow-lg
                      /* 🟢 GRÜNER RING wenn du diesen Stein bewegen KANNST */
                      ${kannBewegtWerden ? 'ring-4 ring-green-400 ring-offset-2 ring-offset-amber-800 animate-pulse' : ''}
                      ${stein.istKoenig ? 'ring-2 ring-yellow-400' : ''}
                      flex items-center justify-center
                      transition-all duration-200
                      hover:scale-105
                    `}>
                      {stein.istKoenig && (
                        <span className="text-yellow-400 text-xs md:text-3xl drop-shadow-2xl">👑</span>
                      )}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}