"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AIAnalysisWidgetProps {
  onClose: () => void;
  tokenAddress: string;
}

const AIAnalysisWidget: React.FC<AIAnalysisWidgetProps> = ({
  onClose,
  tokenAddress,
}) => {
  const [analysis, setAnalysis] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPrompt, setUserPrompt] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);

  // -- Position & Draggable State --
  // Default to bottom-right area of viewport. Adjust to your preference.
  const [position, setPosition] = useState({ x: 1000, y: 500 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement | null>(null);

  // -- DRAG HANDLERS --
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only start drag if user clicked on the header (or entire widget).
    // If you only want the header to be draggable, attach this to the header div.
    setIsDragging(true);

    // Calculate offset so the widget doesn't "jump" to cursor top-left corner
    if (widgetRef.current) {
      const rect = widgetRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();

    // Move the widget based on mouse position minus the offset
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    // If user drags out of the browser window, stop dragging
    if (isDragging) {
      setIsDragging(false);
    }
  };

  // -- FETCHING DATA --
  const fetchAIAnalysis = async (prompt = "") => {
    let timeoutId: NodeJS.Timeout;
    try {
      setIsLoading(true);
      setError(null);

      if (!tokenAddress) {
        throw new Error("No token address provided");
      }

      const response = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tokenAddress, prompt }),
      });

      if (!response.ok) {
        if (response.status === 500) {
          throw new Error("Internal server error. Please try again later.");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      setRetryCount(0);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch AI analysis"
      );

      // Simple retry logic
      if (retryCount < 3) {
        setRetryCount((prev) => prev + 1);
        timeoutId = setTimeout(() => fetchAIAnalysis(prompt), 1000 * (retryCount + 1));
      }
    } finally {
      setIsLoading(false);
      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    }
  };

  // Initial load
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const fetchData = async () => {
      try {
        if (!mounted) return;
        setIsLoading(true);
        setError(null);

        if (!tokenAddress) {
          throw new Error("No token address provided");
        }

        const response = await fetch("/api/ai-analysis", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tokenAddress, prompt: "" }),
        });

        if (!mounted) return;

        if (!response.ok) {
          if (response.status === 500) {
            throw new Error("Internal server error. Please try again later.");
          }
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `API Error: ${response.status}`);
        }

        const data = await response.json();
        if (mounted) {
          setAnalysis(data.analysis);
          setRetryCount(0);
        }
      } catch (err) {
        if (!mounted) return;
        console.error("Fetch error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch AI analysis"
        );

        if (retryCount < 3) {
          setRetryCount((prev) => prev + 1);
          timeoutId = setTimeout(() => fetchData(), 1000 * (retryCount + 1));
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    if (tokenAddress) {
      fetchData();
    } else {
      setError("No token address provided");
      setIsLoading(false);
    }

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [tokenAddress, retryCount]);

  // Handle user questions
  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRetryCount(0);
    fetchAIAnalysis(userPrompt);
  };

  return (
    <div
      ref={widgetRef}
      // Use absolute/fixed positioning with left/top from state
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        width: "350px",
        zIndex: 9999,
      }}
      className="bg-gray-900/90 backdrop-blur-sm rounded-xl max-h-[75vh]
                 flex flex-col border border-gray-700 shadow-lg"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* HEADER */}
      <div className="flex justify-between items-center p-4 border-b border-gray-700 cursor-grab active:cursor-grabbing">
        <h3 className="text-white font-semibold">AI Analysis</h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-gray-800">
          <X className="h-4 w-4 text-gray-400" />
        </Button>
      </div>

      {/* MAIN CHAT SCROLL AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoading && !analysis && !error && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
            <span className="ml-2 text-white">Analyzing token data...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <div className="text-red-500 text-sm">
                {error}
                {retryCount < 3 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full border-red-500/50 hover:bg-red-500/10"
                    onClick={() => {
                      setRetryCount(0);
                      fetchAIAnalysis(userPrompt);
                    }}
                  >
                    Retry Analysis
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AI's Response Bubble */}
        {!isLoading && analysis && (
          <div className="flex flex-col items-start">
            <div className="bg-gray-800 text-gray-100 p-3 rounded-lg rounded-tl-none max-w-xs mb-2 whitespace-pre-wrap">
              {analysis}
            </div>
          </div>
        )}
      </div>

      {/* USER INPUT */}
      <form onSubmit={handlePromptSubmit} className="p-4 border-t border-gray-700 bg-gray-800/60">
        <Input
          type="text"
          placeholder="Ask a question about the analysis..."
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          className="bg-gray-800/50 text-white mb-2 border border-gray-700"
        />
        <Button
          type="submit"
          className="w-full bg-[#9945FF] hover:bg-[#7a3ac4] text-white"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Send"
          )}
        </Button>
      </form>
    </div>
  );
};

export default AIAnalysisWidget;
