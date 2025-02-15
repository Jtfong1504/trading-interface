import { NextResponse } from "next/server"
import OpenAI from "openai"

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
})

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OpenAI API key not configured")
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
  }

  try {
    const { tokenAddress, prompt } = await req.json()

    if (!tokenAddress) {
      return NextResponse.json({ error: "Token address is required" }, { status: 400 })
    }

    // Fetch token data from DexScreener API
    let dexScreenerData
    try {
      const dexScreenerResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`)
      dexScreenerData = await dexScreenerResponse.json()

      if (!dexScreenerResponse.ok) {
        throw new Error(`DexScreener API Error: ${dexScreenerResponse.status}`)
      }

      if (!dexScreenerData.pairs || dexScreenerData.pairs.length === 0) {
        throw new Error("No trading pairs found for this token")
      }
    } catch (error) {
      console.error("DexScreener API Error:", error)
      return NextResponse.json({ error: "Failed to fetch token data from DexScreener" }, { status: 500 })
    }

    // Format token data for analysis
    const tokenData = {
      token: dexScreenerData.pairs[0].baseToken.symbol,
      price: dexScreenerData.pairs[0].priceUsd,
      volume24h: dexScreenerData.pairs[0].volume.h24,
      liquidity: dexScreenerData.pairs[0].liquidity.usd,
      priceChange24h: dexScreenerData.pairs[0].priceChange.h24,
      marketCap: dexScreenerData.pairs[0].marketCap,
      dex: dexScreenerData.pairs[0].dexId,
    }

    // Create a more focused analysis prompt
    const systemPrompt = `You are an expert cryptocurrency analyst. Analyze the following token data and provide insights about:
1. Price action and volatility
2. Trading volume and liquidity
3. Market sentiment based on metrics
4. Potential risks and opportunities
5. Key metrics comparison to market standards

Keep the analysis concise, factual, and focused on the data provided.`

    const userPrompt = prompt || "Please provide a comprehensive analysis of this token's current market status."

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Here is the token data to analyze:
${JSON.stringify(tokenData, null, 2)}

${userPrompt}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      })

      return NextResponse.json({
        analysis: completion.choices[0].message.content,
        tokenData, // Include token data in response for reference
      })
    } catch (error: any) {
      console.error("OpenAI API Error:", error)
      return NextResponse.json({ error: error.message || "Failed to generate AI analysis" }, { status: 500 })
    }
  } catch (error) {
    console.error("General Error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}


