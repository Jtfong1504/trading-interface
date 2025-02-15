"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SearchHistoryWidgetProps {
  onClose: () => void
  onSelectSearch: (address: string) => void
}

const SearchHistoryWidget: React.FC<SearchHistoryWidgetProps> = ({ onClose, onSelectSearch }) => {
  const [position, setPosition] = useState({ x: 100, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem("searchHistory") || "[]")
    setSearchHistory(history)
  }, [])

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

  return (
    <div
      className="absolute bg-gray-900/90 backdrop-blur-sm rounded-xl p-4 w-64 shadow-lg cursor-grab active:cursor-grabbing"
      style={{ left: "100px", top: "100px" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-semibold">Recent Searches</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4 text-gray-400" />
        </Button>
      </div>
      <ul className="space-y-2">
        {searchHistory.map((address, index) => (
          <li key={index}>
            <Button
              variant="ghost"
              className="w-full text-left text-gray-300 hover:text-white hover:bg-gray-800"
              onClick={() => onSelectSearch(address)}
            >
              {address.slice(0, 20)}...
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default SearchHistoryWidget

