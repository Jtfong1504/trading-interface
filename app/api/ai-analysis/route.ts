import { NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? "",
});

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OpenAI API key not configured");
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  try {
    // Parse request body
    const body = await req.json() as { tokenAddress: string; prompt?: string };

    if (!body.tokenAddress) {
      return NextResponse.json(
        { error: "Token address is required" },
        { status: 400 }
      );
    }

    // Fetch token data from DexScreener API
    let dexScreenerData;
    try {
      const dexScreenerResponse = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${body.tokenAddress}`
      );

      if (!dexScreenerResponse.ok) {
        console.error(`DexScreener API Error: ${dexScreenerResponse.status}`);
        return NextResponse.json(
          { error: `DexScreener API Error: ${dexScreenerResponse.status}` },
          { status: 500 }
        );
      }

      dexScreenerData = await dexScreenerResponse.json();
      if (!dexScreenerData.pairs || dexScreenerData.pairs.length === 0) {
        return NextResponse.json(
          { error: "No trading pairs found for this token" },
          { status: 404 }
        );
      }
    } catch (error) {
      console.error("DexScreener API Error:", error);
      return NextResponse.json(
        { error: "Failed to fetch token data from DexScreener" },
        { status: 500 }
      );
    }

    // Format token data for analysis
    const pair = dexScreenerData.pairs[0];
    const tokenData = {
      token: pair.baseToken?.symbol ?? "Unknown",
      price: pair.priceUsd ?? "N/A",
      volume24h: pair.volume?.h24 ?? "N/A",
      liquidity: pair.liquidity?.usd ?? "N/A",
      priceChange24h: pair.priceChange?.h24 ?? "N/A",
      marketCap: pair.marketCap ?? "N/A",
      dex: pair.dexId ?? "Unknown",
    };

    // Analysis prompt
    const systemPrompt = `You are an expert cryptocurrency analyst. Analyze the following token data and provide insights about:
1. Price action and volatility
2. Trading volume and liquidity
3. Market sentiment based on metrics
4. Potential risks and opportunities
5. Key metrics comparison to market standards

Keep the analysis concise, factual, and focused on the data provided.`;

    const userPrompt = body.prompt || "Please provide a comprehensive analysis of this token's current market status.";

    // Generate analysis with OpenAI
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Here is the token data to analyze:
${JSON.stringify(tokenData, null, 2)}

${userPrompt}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      return NextResponse.json({
        analysis: completion.choices[0]?.message?.content ?? "No analysis generated.",
        tokenData,
      });
    } catch (error) {
      console.error("OpenAI API Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("General Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
