import { useRef, useEffect, useState, useCallback } from 'react'

interface SignatureCanvasProps {
  onSignatureChange: (dataUrl: string | null) => void
  width?: number
  height?: number
  className?: string
}

export function SignatureCanvas({
  onSignatureChange,
  width = 350,
  height = 200,
  className = '',
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  // Use ref to track signature state for callbacks (avoids stale closure issue)
  const hasSignatureRef = useRef(false)

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set up canvas for high DPI displays
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    // Set drawing styles
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Fill with white background
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, width, height)
  }, [width, height])

  const getCoordinates = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()

    if ('touches' in e) {
      // Touch event
      const touch = e.touches[0]
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      }
    } else {
      // Mouse event
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }
  }, [])

  const startDrawing = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    const coords = getCoordinates(e)
    if (!coords) return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

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

    const dpr = window.devicePixelRatio || 1
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr)
    hasSignatureRef.current = false
    setHasSignature(false)
    onSignatureChange(null)
  }, [onSignatureChange])

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          className="touch-none cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-gray-400 text-lg">Signez ici</span>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={clearSignature}
        className="mt-2 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100"
      >
        Effacer
      </button>
    </div>
  )
}
