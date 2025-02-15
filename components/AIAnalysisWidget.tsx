"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AIAnalysisWidgetProps {
  onClose: () => void
  tokenAddress: string
}

const AIAnalysisWidget: React.FC<AIAnalysisWidgetProps> = ({ onClose, tokenAddress }) => {
  const [position, setPosition] = useState({ x: 140, y: 140 })
  const [isDragging, setIsDragging] = useState(false)
  const [analysis, setAnalysis] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userPrompt, setUserPrompt] = useState<string>("")
  const [retryCount, setRetryCount] = useState(0)

  const fetchAIAnalysis = async (prompt = "") => {
    let timeoutId: NodeJS.Timeout
    try {
      setIsLoading(true)
      setError(null)

      if (!tokenAddress) {
        throw new Error("No token address provided")
      }

      const response = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tokenAddress, prompt }),
      })

      if (!response.ok) {
        if (response.status === 500) {
          throw new Error("Internal server error. Please try again later.")
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `API Error: ${response.status}`)
      }

      const data = await response.json()

      setAnalysis(data.analysis)
      setRetryCount(0) // Reset retry count on success
    } catch (err) {
      console.error("Fetch error:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch AI analysis")

      if (retryCount < 3) {
        setRetryCount((prev) => prev + 1)
        timeoutId = setTimeout(() => fetchAIAnalysis(prompt), 1000 * (retryCount + 1))
      }
    } finally {
      setIsLoading(false)
      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
      }
    }
  }

  useEffect(() => {
    console.log("AIAnalysisWidget useEffect triggered")
    console.log("tokenAddress:", tokenAddress)
    console.log("retryCount:", retryCount)
    let mounted = true
    let timeoutId: NodeJS.Timeout

    const fetchData = async () => {
      try {
        if (!mounted) return
        setIsLoading(true)
        setError(null)

        if (!tokenAddress) {
          throw new Error("No token address provided")
        }

        const response = await fetch("/api/ai-analysis", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tokenAddress, prompt: "" }),
        })

        if (!mounted) return

        if (!response.ok) {
          if (response.status === 500) {
            throw new Error("Internal server error. Please try again later.")
          }
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `API Error: ${response.status}`)
        }

        const data = await response.json()

        if (mounted) {
          setAnalysis(data.analysis)
          setRetryCount(0) // Reset retry count on success
        }
      } catch (err) {
        if (!mounted) return
        console.error("Fetch error:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch AI analysis")

        // Implement retry logic with cleanup
        if (retryCount < 3) {
          setRetryCount((prev) => prev + 1)
          timeoutId = setTimeout(() => fetchData(), 1000 * (retryCount + 1))
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    if (tokenAddress) {
      fetchData()
    } else {
      setError("No token address provided")
      setIsLoading(false)
    }

    // Cleanup function
    return () => {
      mounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [tokenAddress, retryCount])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    const rect = e.currentTarget.getBoundingClientRect()
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const newX = e.clientX - position.x
    const newY = e.clientY - position.y
    e.currentTarget.style.left = `${newX}px`
    e.currentTarget.style.top = `${newY}px`
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setRetryCount(0) // Reset retry count for new submissions
    fetchAIAnalysis(userPrompt)
  }

  return (
    <div
      className="fixed bg-gray-900/90 backdrop-blur-sm rounded-xl p-6 shadow-lg cursor-grab active:cursor-grabbing z-50"
      style={{ left: "140px", top: "140px", width: "400px", maxHeight: "80vh", overflowY: "auto" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-semibold">AI Analysis</h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-gray-800">
          <X className="h-4 w-4 text-gray-400" />
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          <span className="ml-2 text-white">Analyzing token data...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
            <div>
              <p className="text-red-500">{error}</p>
              {retryCount < 3 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full border-red-500/50 hover:bg-red-500/10"
                  onClick={() => {
                    setRetryCount(0)
                    fetchAIAnalysis(userPrompt)
                  }}
                >
                  Retry Analysis
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {analysis && !isLoading && (
        <div className="space-y-4">
          <div className="text-gray-300 whitespace-pre-wrap">{analysis}</div>

          <form onSubmit={handlePromptSubmit} className="mt-4">
            <Input
              type="text"
              placeholder="Ask a question about the analysis..."
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              className="w-full bg-gray-800/50 border-2 border-[#9945FF] text-white mb-2"
            />
            <Button type="submit" className="w-full bg-[#9945FF] hover:bg-[#7a3ac4] text-white" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Submit Question"
              )}
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}

export default AIAnalysisWidget

