"use client"

import type React from "react"
import { X, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState, useEffect, useRef } from "react"

interface TokenDataWidgetProps {
  onClose: () => void
  tokenAddress: string
  tokenData: {
    baseToken: {
      symbol: string
      name: string
    }
    priceUsd: number
    volume: {
      h24: number
    }
    liquidity: {
      usd: number
    }
    priceChange: {
      h24: number
    }
    marketCap: number
  }
}

const formatNumber = (num: number, prefix = "") => {
  if (!num && num !== 0) return `${prefix}0`

  if (num >= 1000000) {
    return `${prefix}${(num / 1000000).toFixed(1)}M`
  }

  if (num >= 1000) {
    return `${prefix}${(num / 1000).toFixed(1)}K`
  }

  return `${prefix}${num.toFixed(2)}`
}

const calculateScore = (value: number, maxValue: number) => {
  return Math.min(Math.round((value / maxValue) * 100), 100)
}

const TokenDataWidget: React.FC<TokenDataWidgetProps> = ({ onClose, tokenAddress, tokenData }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const initialMousePosition = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const dx = e.clientX - initialMousePosition.current.x
      const dy = e.clientY - initialMousePosition.current.y

      requestAnimationFrame(() => {
        setPosition((prevPosition) => ({
          x: prevPosition.x + dx,
          y: prevPosition.y + dy,
        }))
      })

      initialMousePosition.current = { x: e.clientX, y: e.clientY }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    initialMousePosition.current = { x: e.clientX, y: e.clientY }
  }

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(tokenAddress)
  }

  if (!tokenData) return null

  const volumeScore = calculateScore(tokenData.volume.h24, 10000000) // Example threshold
  const marketCapScore = calculateScore(tokenData.marketCap, 100000000) // Example threshold

  return (
    <div
      ref={ref}
      className="fixed bg-gray-900/90 backdrop-blur-sm rounded-xl p-6 shadow-lg z-50 text-white cursor-grab active:cursor-grabbing"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: isDragging ? "none" : "transform 0.3s ease-out",
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">{tokenData.baseToken.symbol}</h2>
            <span className="text-gray-400">/ SOL</span>
          </div>
          <div className="text-xs text-gray-400 mt-1 font-mono flex items-center">
            {tokenAddress.slice(0, 20)}...
            <Button variant="ghost" size="sm" onClick={handleCopyAddress} className="ml-2 p-0">
              <Copy className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
          <div className="text-sm text-gray-300 mt-1">{tokenData.baseToken.name}</div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-gray-800">
          <X className="h-4 w-4 text-gray-400" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Market Cap</div>
          <div className="text-xl font-bold">{formatNumber(tokenData.marketCap, "$")}</div>
          <div className="text-xs text-gray-500">Score: {marketCapScore}/100</div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Price Trend</div>
          <div className={cn("text-xl font-bold", tokenData.priceChange.h24 >= 0 ? "text-green-500" : "text-red-500")}>
            {tokenData.priceChange.h24 >= 0 ? "Up" : "Down"}
          </div>
          <div className="text-xs text-gray-500">{tokenData.priceChange.h24.toFixed(2)}%</div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Liquidity</div>
          <div className="text-xl font-bold">{formatNumber(tokenData.liquidity.usd, "$")}</div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">24h Volume</div>
          <div className="text-xl font-bold">{formatNumber(tokenData.volume.h24, "$")}</div>
          <div className="text-xs text-gray-500">Score: {volumeScore}/100</div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">Market Assessment</h3>
        <div className="bg-gray-800/30 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Price Trend</span>
            <span className={cn(tokenData.priceChange.h24 >= 0 ? "text-green-400" : "text-red-400")}>
              {tokenData.priceChange.h24 >= 0 ? "Up" : "Down"} ({tokenData.priceChange.h24.toFixed(2)}%)
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Liquidity</span>
            <span className="text-blue-400">{formatNumber(tokenData.liquidity.usd, "$")}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Trading Volume (24h)</span>
            <span className="text-purple-400">{formatNumber(tokenData.volume.h24, "$")}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Market Cap</span>
            <span className="text-green-400">{formatNumber(tokenData.marketCap, "$")}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TokenDataWidget

