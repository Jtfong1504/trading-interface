"use client"

import type React from "react"

import { useState } from "react"
import { Download, Settings, Search, BarChart2, Brain, Mail, BookOpen, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import TokenDataWidget from "./TokenDataWidget"
import SearchHistoryWidget from "./SearchHistoryWidget"
import AIAnalysisWidget from "./AIAnalysisWidget"

export default function TradingInterface() {
  const [inputValue, setInputValue] = useState("")
  const [iframeSrc, setIframeSrc] = useState(
    "https://www.gmgn.cc/kline/sol/ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82?theme=dark",
  )
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [showSearchHistory, setShowSearchHistory] = useState(false)
  const [showTokenData, setShowTokenData] = useState(false)
  const [showAIAnalysis, setShowAIAnalysis] = useState(false)
  const [tokenData, setTokenData] = useState(null)

  const isValidSolanaAddress = (address: string) => {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
  }

  const handleUpdateChart = async () => {
    const address = inputValue.trim()
    if (!isValidSolanaAddress(address)) {
      alert("⚠️ Please enter a valid Solana contract address!")
      return
    }

    try {
      // Fetch token data from DexScreener
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`)
      const data = await response.json()

      if (!response.ok || !data.pairs || data.pairs.length === 0) {
        throw new Error("No trading pairs found for this token")
      }

      // Update token data
      setTokenData(data.pairs[0])
      setShowTokenData(true)

      // Update chart
      setIframeSrc(`https://www.gmgn.cc/kline/sol/${encodeURIComponent(address)}?theme=dark`)

      // Update search history
      const history = JSON.parse(localStorage.getItem("searchHistory") || "[]")
      const updatedHistory = [address, ...history.filter((item: string) => item !== address)].slice(0, 5)
      localStorage.setItem("searchHistory", JSON.stringify(updatedHistory))
    } catch (error) {
      console.error("Error fetching token data:", error)
      alert("Failed to fetch token data. Please try again.")
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    const chartContainer = e.currentTarget as HTMLDivElement
    const rect = chartContainer.getBoundingClientRect()
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return

    const chartContainer = e.currentTarget as HTMLDivElement
    const newX = e.clientX - position.x
    const newY = e.clientY - position.y

    chartContainer.style.left = `${newX}px`
    chartContainer.style.top = `${newY}px`
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-950">
      {/* Left Sidebar */}
      <div className="fixed left-0 top-0 h-full w-20 bg-gray-900/50 backdrop-blur-sm border-r border-gray-800 flex flex-col items-center py-6 gap-8">
      <Button variant="ghost" className="w-12 h-12 rounded-xl">
  <Download className="w-5 h-5 text-white" />
</Button>
<Button variant="ghost" className="w-12 h-12 rounded-xl" onClick={() => setShowAIAnalysis(true)}>
  <Brain className="w-5 h-5 text-purple-400" />
</Button>
<Button variant="ghost" className="w-12 h-12 rounded-xl">
  <BarChart2 className="w-5 h-5 text-white" />
</Button>
<Button variant="ghost" className="w-12 h-12 rounded-xl" onClick={() => setShowSearchHistory(!showSearchHistory)}>
  <Search className="w-5 h-5 text-purple-400" />
</Button>

      </div>

      {/* Right Sidebar */}
      <div className="fixed right-0 top-0 h-full w-20 bg-gray-900/50 backdrop-blur-sm border-l border-gray-800 flex flex-col items-center py-6 gap-8">
        <Button variant="ghost" className="w-12 h-12 rounded-xl">
          <User className="w-5 h-5" />
        </Button>
        <Button variant="ghost" className="w-12 h-12 rounded-xl">
          <Settings className="w-5 h-5" />
        </Button>
        <Button variant="ghost" className="w-12 h-12 rounded-xl">
          <BookOpen className="w-5 h-5" />
        </Button>
        <Button variant="ghost" className="w-12 h-12 rounded-xl">
          <Mail className="w-5 h-5" />
        </Button>
      </div>

      <main className="ml-20 mr-20 p-6">
        <div className="max-w-3xl mx-auto">
          <div
            className="bg-gray-900/70 backdrop-blur-sm rounded-xl p-6 absolute cursor-grab active:cursor-grabbing"
            style={{ position: "absolute" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div className="flex gap-4 mb-6">
              <Input
                placeholder="Enter Solana Contract Address (e.g., DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263)"
                className="flex-1 bg-gray-800/50 border-2 border-[#9945FF] text-white"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <Button className="bg-[#9945FF] hover:bg-[#7a3ac4] text-white" onClick={handleUpdateChart}>
                Load Chart
              </Button>
            </div>

            <iframe
              src={iframeSrc}
              className="w-[500px] h-[500px] rounded-xl border-none shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
            />
          </div>
        </div>
      </main>

      {showSearchHistory && (
        <SearchHistoryWidget
          onClose={() => setShowSearchHistory(false)}
          onSelectSearch={(address) => {
            setInputValue(address)
            handleUpdateChart()
            setShowSearchHistory(false)
          }}
        />
      )}

      {showTokenData && tokenData && (
        <TokenDataWidget onClose={() => setShowTokenData(false)} tokenAddress={inputValue} tokenData={tokenData} />
      )}

      {showAIAnalysis && inputValue && (
        <AIAnalysisWidget onClose={() => setShowAIAnalysis(false)} tokenAddress={inputValue} />
      )}

      {/* Footer */}
      <footer className="fixed bottom-0 left-20 right-20 p-4 flex items-center text-sm text-gray-400">
  <div>© 2025 · Solacle · Licensing</div>
</footer>

    </div>
  )
}

