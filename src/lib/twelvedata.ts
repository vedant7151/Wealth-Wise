export async function getStockPrice(symbol: string): Promise<number | null> {
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) {
    console.error("TWELVEDATA_API_KEY is not set.");
    return null;
  }

  try {
    const url = `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${apiKey}`;
    const response = await fetch(url, { next: { revalidate: 60 } });
    if (!response.ok) return null;
    const data = await response.json();
    if (data.status === "error") return null;
    return parseFloat(data.price);
  } catch (error) {
    return null;
  }
}

export async function getStockProfile(symbol: string) {
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://api.twelvedata.com/profile?symbol=${symbol}&apikey=${apiKey}`;
    const response = await fetch(url, { next: { revalidate: 86400 } }); // Cache 1 day
    if (!response.ok) return null;
    const data = await response.json();
    if (data.status === "error") return null;
    return {
      name: data.name,
      symbol: data.symbol,
      sector: data.sector,
      description: data.description,
    };
  } catch (error) {
    return null;
  }
}

export async function getStockTimeSeries(symbol: string) {
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) return [];

  try {
    const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&outputsize=30&apikey=${apiKey}`;
    const response = await fetch(url, { next: { revalidate: 3600 } }); // Cache 1 hour
    if (!response.ok) return [];
    const data = await response.json();
    if (data.status === "error" || !data.values) return [];

    // Map to a chart-friendly format, reversed to show chronological order
    return data.values.reverse().map((item: any) => ({
      date: item.datetime,
      price: parseFloat(item.close),
    }));
  } catch (error) {
    return [];
  }
}

export async function getBatchQuotes(symbols: string[]) {
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey || symbols.length === 0) return {};

  try {
    const symbolsString = symbols.join(',');
    const url = `https://api.twelvedata.com/price?symbol=${symbolsString}&apikey=${apiKey}`;
    const response = await fetch(url, { next: { revalidate: 60 } });
    if (!response.ok) return {};
    const data = await response.json();

    if (data.status === "error") return {};

    const prices: Record<string, number> = {};
    if (symbols.length === 1) {
      prices[symbols[0]] = parseFloat(data.price);
    } else {
      for (const sym of symbols) {
        if (data[sym] && data[sym].price) {
          prices[sym] = parseFloat(data[sym].price);
        }
      }
    }
    return prices;
  } catch (error) {
    return {};
  }
}

export async function getExploreStocks() {
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) return [];

  try {
    const url = `https://api.twelvedata.com/stocks?exchange=NASDAQ&apikey=${apiKey}`;
    const response = await fetch(url, { next: { revalidate: 86400 } });
    if (!response.ok) return [];

    const data = await response.json();
    if (data.status === "error" || !data.data) return [];

    // Filter out rows without a name or symbol, and return all entries
    return data.data
      .filter((s: any) => s.name && s.symbol)
      .map((stock: any) => ({
        symbol: stock.symbol,
        name: stock.name,
        description: `${stock.type || "Stock"} \u2022 ${stock.country || "US"} \u2022 ${stock.currency || "USD"}`,
      }));
  } catch (error) {
    return [];
  }
}

