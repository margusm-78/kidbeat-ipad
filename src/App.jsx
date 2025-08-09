import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'

// KidBeat - iPad Optimized Drum Machine
const STEPS = 16
const DEFAULT_BPM = 100
const TRACKS = [
  { id: 'kick',  label: 'Kick',   color: '#ef4444', type: 'kick'  },
  { id: 'snare', label: 'Snare',  color: '#3b82f6', type: 'snare' },
  { id: 'hat',   label: 'Hi-Hat', color: '#10b981', type: 'hat'   },
  { id: 'clap',  label: 'Clap',   color: '#f59e0b', type: 'clap'  },
]

function createAudioEngine() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  const master = ctx.createGain()
  master.gain.value = 0.9
  master.connect(ctx.destination)
  return { ctx, master }
}

// Audio synthesis functions (same as original)
function playKick(ctx, master, when, velocity = 1) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(150, when)
  osc.frequency.exponentialRampToValueAtTime(45, when + 0.12)
  gain.gain.setValueAtTime(0.001, when)
  gain.gain.exponentialRampToValueAtTime(velocity, when + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.001, when + 0.25)
  osc.connect(gain).connect(master)
  osc.start(when)
  osc.stop(when + 0.32)
}

function playSnare(ctx, master, when, velocity = 1, noiseBuffer) {
  const noiseSrc = ctx.createBufferSource()
  if (!noiseBuffer) {
    noiseBuffer = ctx.createBuffer(1, Math.max(1, Math.round(ctx.sampleRate * 0.2)), ctx.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  noiseSrc.buffer = noiseBuffer

  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 1000
  
  const ng = ctx.createGain()
  ng.gain.setValueAtTime(velocity * 0.7, when)
  ng.gain.exponentialRampToValueAtTime(0.001, when + 0.15)
  
  noiseSrc.connect(hp).connect(ng).connect(master)
  noiseSrc.start(when)
  noiseSrc.stop(when + 0.2)

  const osc = ctx.createOscillator()
  osc.type = 'triangle'
  const g = ctx.createGain()
  g.gain.setValueAtTime(velocity * 0.3, when)
  g.gain.exponentialRampToValueAtTime(0.001, when + 0.2)
  osc.frequency.setValueAtTime(200, when)
  osc.connect(g).connect(master)
  osc.start(when)
  osc.stop(when + 0.21)
}

function playHat(ctx, master, when, velocity = 1, noiseBuffer) {
  const noise = ctx.createBufferSource()
  if (!noiseBuffer) {
    noiseBuffer = ctx.createBuffer(1, Math.max(1, Math.round(ctx.sampleRate * 0.2)), ctx.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  noise.buffer = noiseBuffer
  
  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 6000
  
  const g = ctx.createGain()
  g.gain.setValueAtTime(velocity * 0.25, when)
  g.gain.exponentialRampToValueAtTime(0.001, when + 0.05)
  
  noise.connect(hp).connect(g).connect(master)
  noise.start(when)
  noise.stop(when + 0.05)
}

function playClap(ctx, master, when, velocity = 1, noiseBuffer) {
  const burst = (offset) => {
    const src = ctx.createBufferSource()
    if (!noiseBuffer) {
      noiseBuffer = ctx.createBuffer(1, Math.max(1, Math.round(ctx.sampleRate * 0.2)), ctx.sampleRate)
      const data = noiseBuffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    }
    src.buffer = noiseBuffer
    
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 2000
    
    const gg = ctx.createGain()
    gg.gain.setValueAtTime(velocity * 0.35, when + offset)
    gg.gain.exponentialRampToValueAtTime(0.001, when + offset + 0.12)
    
    src.connect(bp).connect(gg).connect(master)
    src.start(when + offset)
    src.stop(when + offset + 0.12)
  }
  burst(0)
  burst(0.01)
  burst(0.02)
}

function scheduleHit(ctx, master, type, when, velocity = 1, noiseBuffer) {
  switch (type) {
    case 'kick':  return playKick(ctx, master, when, velocity)
    case 'snare': return playSnare(ctx, master, when, velocity, noiseBuffer)
    case 'hat':   return playHat(ctx, master, when, velocity, noiseBuffer)
    case 'clap':  return playClap(ctx, master, when, velocity, noiseBuffer)
  }
}

async function renderToWav({ bpm, pattern, bars = 2 }) {
  const sr = 44100
  const secondsPerBeat = 60 / bpm
  const stepDur = secondsPerBeat / 4
  const totalTime = stepDur * STEPS * bars
  const oac = new OfflineAudioContext(2, Math.ceil(totalTime * sr), sr)

  const offlineNoise = oac.createBuffer(1, Math.max(1, Math.round(oac.sampleRate * 0.2)), oac.sampleRate)
  const d = offlineNoise.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1

  const schedule = (type, when) => {
    switch (type) {
      case 'kick':  playKick(oac, oac.destination, when, 1); break
      case 'snare': playSnare(oac, oac.destination, when, 1, offlineNoise); break
      case 'hat':   playHat(oac, oac.destination, when, 1, offlineNoise); break
      case 'clap':  playClap(oac, oac.destination, when, 1, offlineNoise); break
    }
  }
  
  for (let bar = 0; bar < bars; bar++) {
    for (let step = 0; step < STEPS; step++) {
      const when = bar * STEPS * stepDur + step * stepDur + 0.02
      TRACKS.forEach((t, row) => { if (pattern[row][step]) schedule(t.type, when) })
    }
  }
  
  const rendered = await oac.startRendering()
  
  // WAV file generation
  const length = rendered.length * 2 + 44
  const buffer = new ArrayBuffer(length)
  const view = new DataView(buffer)
  const writeString = (offset, str) => { 
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)) 
  }
  
  const channels = 2
  const sampleRate = rendered.sampleRate
  const samples = rendered.length
  
  writeString(0, 'RIFF')
  view.setUint32(4, 36 + samples * channels * 2, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, channels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * channels * 2, true)
  view.setUint16(32, channels * 2, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, samples * channels * 2, true)
  
  const ch0 = rendered.getChannelData(0)
  const ch1 = rendered.getChannelData(1)
  let offset = 44
  
  for (let i = 0; i < samples; i++) {
    const s0 = Math.max(-1, Math.min(1, ch0[i]))
    const s1 = Math.max(-1, Math.min(1, ch1[i]))
    view.setInt16(offset, s0 < 0 ? s0 * 0x8000 : s0 * 0x7fff, true)
    view.setInt16(offset + 2, s1 < 0 ? s1 * 0x8000 : s1 * 0x7fff, true)
    offset += 4
  }
  
  return new Blob([view], { type: 'audio/wav' })
}

// React component starts here
export default function App() {
  const [bpm, setBpm] = useState(DEFAULT_BPM)
  const [swing, setSwing] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [name, setName] = useState('My First Beat')
  const [volumes, setVolumes] = useState([1, 1, 1, 1])
  const [audioState, setAudioState] = useState('unknown')
  const [isLoading, setIsLoading] = useState(false)

  const defaultPattern = useMemo(() => TRACKS.map(() => Array(STEPS).fill(false)), [])
  const [pattern, setPattern] = useState(() => {
    const p = TRACKS.map(() => Array(STEPS).fill(false))
    p[0][0] = p[0][8] = true  // Kick on 1 and 9
    p[1][4] = p[1][12] = true // Snare on 5 and 13
    for (let i = 0; i < STEPS; i += 2) p[2][i] = true // Hi-hat on every other step
    return p
  })

  const { ctx, master } = useMemo(() => createAudioEngine(), [])
  const lookahead = 0.08
  const timerRef = useRef(null)
  const nextNoteTimeRef = useRef(0)
  const stepRef = useRef(0)

  // Shared noise buffer for performance
  const sharedNoise = useMemo(() => {
    const nb = ctx.createBuffer(1, Math.max(1, Math.round(ctx.sampleRate * 0.2)), ctx.sampleRate)
    const data = nb.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    return nb
  }, [ctx.sampleRate])

  useEffect(() => {
    const update = () => setAudioState(ctx.state)
    update()
    ctx.onstatechange = update
    return () => { 
      if (timerRef.current) window.clearInterval(timerRef.current)
      try { ctx.close() } catch {} 
    }
  }, [ctx])

  const schedule = useCallback((time, step) => {
    TRACKS.forEach((t, row) => {
      if (pattern[row][step]) scheduleHit(ctx, master, t.type, time, volumes[row], sharedNoise)
    })
  }, [ctx, master, pattern, volumes, sharedNoise])

  const nextStep = useCallback(() => {
    const secondsPerBeat = 60 / bpm
    const stepDur = secondsPerBeat / 4
    if (nextNoteTimeRef.current <= ctx.currentTime + lookahead) {
      let t = nextNoteTimeRef.current
      if (swing > 0 && (stepRef.current % 2 === 1)) {
        t += (swing / 100) * (stepDur / 3)
      }
      schedule(t, stepRef.current)
      nextNoteTimeRef.current += stepDur
      setCurrentStep(stepRef.current)
      stepRef.current = (stepRef.current + 1) % STEPS
    }
  }, [bpm, swing, schedule, ctx])

  const start = useCallback(async () => {
    setIsLoading(true)
    
    // iOS audio unlock
    const b = ctx.createBuffer(1, 1, 22050)
    const s = ctx.createBufferSource()
    s.buffer = b
    s.connect(ctx.destination)
    try { s.start(0) } catch {}
    
    if (ctx.state !== 'running') await ctx.resume()

    nextNoteTimeRef.current = ctx.currentTime + 0.05
    stepRef.current = 0
    setIsPlaying(true)
    setIsLoading(false)

    // Start first tick immediately
    nextStep()

    if (timerRef.current) window.clearInterval(timerRef.current)
    timerRef.current = window.setInterval(nextStep, 25)
  }, [ctx, nextStep])

  const stop = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current)
    timerRef.current = null
    setIsPlaying(false)
    setCurrentStep(0)
  }, [])

  const toggleCell = useCallback((row, col) => {
    setPattern(p => {
      const copy = p.map(r => r.slice())
      copy[row][col] = !copy[row][col]
      return copy
    })
  }, [])

  const setAll = useCallback((row, on) => {
    setPattern(p => {
      const copy = p.map(r => r.slice())
      copy[row] = Array(STEPS).fill(on)
      return copy
    })
  }, [])

  const randomize = useCallback(() => {
    setPattern(() => TRACKS.map((_, rIdx) => 
      Array(STEPS).fill(false).map(() => 
        Math.random() < (rIdx === 2 ? 0.6 : 0.3)
      )
    ))
  }, [])

  const clear = useCallback(() => setPattern(defaultPattern), [defaultPattern])

  // Local storage functions
  const savePattern = useCallback(() => {
    try {
      const all = JSON.parse(localStorage.getItem('kidbeat_patterns') || '{}')
      all[name] = { bpm, swing, pattern, volumes }
      localStorage.setItem('kidbeat_patterns', JSON.stringify(all))
    } catch (error) {
      console.error('Failed to save pattern:', error)
    }
  }, [name, bpm, swing, pattern, volumes])

  const loadPattern = useCallback((n) => {
    try {
      const all = JSON.parse(localStorage.getItem('kidbeat_patterns') || '{}')
      const data = all[n]
      if (data) {
        setName(n)
        setBpm(data.bpm ?? DEFAULT_BPM)
        setSwing(data.swing ?? 0)
        setPattern(data.pattern ?? defaultPattern)
        setVolumes(data.volumes ?? [1, 1, 1, 1])
      }
    } catch (error) {
      console.error('Failed to load pattern:', error)
    }
  }, [defaultPattern])

  const deletePattern = useCallback((n) => {
    try {
      const all = JSON.parse(localStorage.getItem('kidbeat_patterns') || '{}')
      delete all[n]
      localStorage.setItem('kidbeat_patterns', JSON.stringify(all))
      if (n === name) setName('My Beat')
    } catch (error) {
      console.error('Failed to delete pattern:', error)
    }
  }, [name])

  const exportWav = useCallback(async () => {
    setIsLoading(true)
    try {
      const blob = await renderToWav({ bpm, pattern, bars: 4 })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.wav'
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 2000)
    } catch (error) {
      console.error('Failed to export WAV:', error)
    } finally {
      setIsLoading(false)
    }
  }, [bpm, pattern, name])

  const savedNames = useMemo(() => {
    try {
      return Object.keys(JSON.parse(localStorage.getItem('kidbeat_patterns') || '{}'))
    } catch {
      return []
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4 safe-area-inset">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4 animate-bounce-in">
            🥁 KidBeat
          </h1>
          <p className="text-xl text-purple-200 font-medium">
            Professional Drum Machine for iPad
          </p>
          <div className="mt-2 text-sm text-purple-300">
            Audio: <span className="font-semibold">{audioState}</span>
            {isLoading && <span className="ml-2">⏳ Processing...</span>}
          </div>
        </div>

        <div className="glass-card p-6 mb-6">
          {/* Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 mb-8">
            <div className="lg:col-span-2">
              <label className="block text-white font-semibold mb-3">Beat Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="input-field text-lg"
                placeholder="Enter beat name..."
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-3">
                Tempo: {bpm} BPM
              </label>
              <input 
                type="range" 
                min="60" 
                max="160" 
                step="1" 
                value={bpm} 
                onChange={(e) => setBpm(parseInt(e.target.value))}
                className="slider w-full"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-3">
                Swing: {swing}%
              </label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="5" 
                value={swing} 
                onChange={(e) => setSwing(parseInt(e.target.value))}
                className="slider w-full"
              />
            </div>

            <div className="flex flex-col space-y-2">
              <button 
                onClick={savePattern}
                disabled={isLoading}
                className="btn btn-success"
              >
                💾 Save Beat
              </button>
              <button 
                onClick={exportWav}
                disabled={isLoading}
                className="btn btn-secondary"
              >
                {isLoading ? '⏳ Exporting...' : '📥 Export WAV'}
              </button>
            </div>

            <div className="flex flex-col space-y-2">
              <select 
                onChange={(e) => e.target.value && loadPattern(e.target.value)} 
                value=""
                className="input-field"
              >
                <option value="">Load Saved Beat</option>
                {savedNames.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <button 
                onClick={() => deletePattern(name)}
                className="btn btn-danger text-sm"
              >
                🗑️ Delete
              </button>
            </div>
          </div>

          {/* Pattern Grid */}
          <div className="bg-black/30 rounded-2xl p-6 mb-8 overflow-x-auto">
            {/* Step Numbers */}
            <div className="pattern-grid mb-4">
              <div></div>
              {Array.from({ length: STEPS }, (_, i) => (
                <div 
                  key={i} 
                  className={`text-center text-white text-sm font-${i % 4 === 0 ? 'bold' : 'medium'} py-2`}
                >
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Track Rows */}
            {TRACKS.map((track, row) => (
              <div key={track.id} className="pattern-grid mb-4">
                {/* Track Controls */}
                <div className="track-controls">
                  <div className="flex items-center mb-3">
                    <div 
                      className="w-4 h-4 rounded-full mr-3 shadow-lg" 
                      style={{ backgroundColor: track.color }}
                    />
                    <span className="text-white font-semibold text-lg">
                      {track.label}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-white text-sm">Vol</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.1" 
                      value={volumes[row]} 
                      onChange={(e) => {
                        const val = parseFloat(e.target.value)
                        setVolumes(v => {
                          const newVols = [...v]
                          newVols[row] = val
                          return newVols
                        })
                      }}
                      className="volume-slider"
                    />
                    <span className="text-white text-xs w-8">
                      {Math.round(volumes[row] * 100)}
                    </span>
                  </div>
                  
                  <div className="flex space-x-1">
                    <button 
                      onClick={() => setAll(row, true)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors"
                    >
                      All
                    </button>
                    <button 
                      onClick={() => setAll(row, false)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors"
                    >
                      None
                    </button>
                  </div>
                </div>

                {/* Step Buttons */}
                {Array.from({ length: STEPS }, (_, col) => {
                  const active = pattern[row][col]
                  const isNow = isPlaying && col === currentStep
                  
                  return (
                    <button
                      key={col}
                      onClick={() => toggleCell(row, col)}
                      className={`
                        step-button border-2 transition-all duration-200
                        ${active 
                          ? 'step-button-active shadow-lg' 
                          : 'bg-white/10 border-white/30 hover:bg-white/20'
                        }
                        ${isNow ? 'step-button-current animate-current-step' : ''}
                        ${col % 4 === 0 ? 'border-white/50' : ''}
                      `}
                      style={{ 
                        backgroundColor: active ? track.color : undefined,
                        borderColor: active ? track.color : undefined,
                      }}
                      aria-label={`${track.label} step ${col + 1}${active ? ' active' : ''}`}
                    >
                      {isNow && <span className="text-white font-bold text-xs">●</span>}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Transport Controls */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            {!isPlaying ? (
              <button 
                onClick={start}
                disabled={isLoading}
                className="btn btn-primary text-2xl px-8 py-4 text-xl font-bold"
              >
                {isLoading ? '🔄 Starting...' : '▶️ Play'}
              </button>
            ) : (
              <button 
                onClick={stop}
                className="btn btn-danger text-2xl px-8 py-4 text-xl font-bold animate-beat"
              >
                ⏹ Stop
              </button>
            )}
            
            <button 
              onClick={randomize}
              disabled={isLoading}
              className="btn btn-secondary text-lg px-6 py-3"
            >
              🎲 Surprise Beat
            </button>
            
            <button 
              onClick={clear}
              disabled={isLoading}
              className="btn btn-ghost text-lg px-6 py-3"
            >
              🧽 Clear All
            </button>
          </div>

          {/* Help Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="glass-card p-4">
              <h3 className="text-white font-bold text-lg mb-3 flex items-center">
                <span className="mr-2">📱</span>
                iPad Tips
              </h3>
              <ul className="text-purple-200 text-sm space-y-2">
                <li>• Tap <strong>Share → Add to Home Screen</strong> to install</li>
                <li>• Use landscape mode for best experience</li>
                <li>• Adjust volume sliders for each track</li>
                <li>• Save your beats - they stay on your device</li>
              </ul>
            </div>
            
            <div className="glass-card p-4">
              <h3 className="text-white font-bold text-lg mb-3 flex items-center">
                <span className="mr-2">🎵</span>
                How to Use
              </h3>
              <ul className="text-purple-200 text-sm space-y-2">
                <li>• Tap grid squares to create patterns</li>
                <li>• Use <strong>All/None</strong> buttons for quick edits</li>
                <li>• Adjust tempo (60-160 BPM) and swing</li>
                <li>• Export your beats as WAV files</li>
              </ul>
            </div>
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between text-purple-200 text-sm">
            <div className="flex items-center space-x-4">
              <span>🔊 Audio: {audioState}</span>
              <span>🎯 Step: {currentStep + 1}/{STEPS}</span>
              <span>💾 Saved: {savedNames.length}</span>
            </div>
            <div className="text-right">
              <div>Privacy-friendly • No uploads</div>
              <div className="text-xs opacity-70">All audio generated on-device</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-purple-300 text-sm">
          <p className="mb-2">
            Made with ❤️ for mobile music creators
          </p>
          <p className="opacity-70">
            Open source • Built with React & Web Audio API
          </p>
        </div>
      </div>
    </div>
  )
}