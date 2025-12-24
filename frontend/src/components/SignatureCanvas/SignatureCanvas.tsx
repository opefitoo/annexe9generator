import { useRef, useEffect, useState, useCallback } from 'react'

interface SignatureCanvasProps {
  onSignatureChange: (dataUrl: string | null) => void
  className?: string
}

export function SignatureCanvas({
  onSignatureChange,
  className = '',
}: SignatureCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [dimensions, setDimensions] = useState({ width: 320, height: 180 })
  // Use ref to track signature state for callbacks (avoids stale closure issue)
  const hasSignatureRef = useRef(false)

  // Calculate responsive dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        // Full width of container, with aspect ratio ~16:9 for comfortable signing
        const width = Math.min(containerWidth, 600)
        const height = Math.max(160, Math.min(220, width * 0.45))
        setDimensions({ width, height })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = dimensions

    // Set up canvas for high DPI displays
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    // Set drawing styles - thicker line for mobile
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Fill with white background
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, width, height)

    // Draw a subtle signature line
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(20, height - 30)
    ctx.lineTo(width - 20, height - 30)
    ctx.stroke()

    // Reset stroke style for signature
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 2.5
  }, [dimensions])

  const getCoordinates = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    const scaleX = dimensions.width / rect.width
    const scaleY = dimensions.height / rect.height

    if ('touches' in e) {
      // Touch event
      const touch = e.touches[0]
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      }
    } else {
      // Mouse event
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      }
    }
  }, [dimensions])

  const startDrawing = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    const coords = getCoordinates(e)
    if (!coords) return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

    // Reset stroke style in case it changed
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 2.5

    ctx.beginPath()
    ctx.moveTo(coords.x, coords.y)
    setIsDrawing(true)
  }, [getCoordinates])

  const draw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return
    e.preventDefault()

    const coords = getCoordinates(e)
    if (!coords) return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

    ctx.lineTo(coords.x, coords.y)
    ctx.stroke()
    hasSignatureRef.current = true
    setHasSignature(true)
  }, [isDrawing, getCoordinates])

  const stopDrawing = useCallback(() => {
    if (isDrawing && hasSignatureRef.current) {
      const canvas = canvasRef.current
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png')
        onSignatureChange(dataUrl)
      }
    }
    setIsDrawing(false)
  }, [isDrawing, onSignatureChange])

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return

    const { width, height } = dimensions
    const dpr = window.devicePixelRatio || 1

    // Clear and redraw background
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr)

    // Redraw signature line
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(20, height - 30)
    ctx.lineTo(width - 20, height - 30)
    ctx.stroke()

    // Reset stroke style
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 2.5

    hasSignatureRef.current = false
    setHasSignature(false)
    onSignatureChange(null)
  }, [onSignatureChange, dimensions])

  return (
    <div ref={containerRef} className={`flex flex-col w-full ${className}`}>
      <div className="relative border-2 border-gray-300 rounded-xl overflow-hidden bg-white shadow-inner">
        <canvas
          ref={canvasRef}
          className="touch-none cursor-crosshair w-full"
          style={{ touchAction: 'none' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span className="text-gray-400 text-base">Signez ici</span>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={clearSignature}
        className="mt-3 px-4 py-3 text-base text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center justify-center"
      >
        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Effacer la signature
      </button>
    </div>
  )
}
