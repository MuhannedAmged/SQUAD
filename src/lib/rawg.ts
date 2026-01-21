const RAWG_API_KEY = process.env.RAWG_API_KEY;

export async function searchRAWG(query: string) {
  if (!query) return [];

  try {
    const response = await fetch(
      `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(
        query
      )}&page_size=8&tags=7,31`
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("RAWG API Error:", error);
      return [];
    }

    const data = await response.json();

    return (data.results || []).map((game: any) => ({
      id: game.id,
      name: game.name,
      cover_url: game.background_image || null,
      rating: game.rating,
      released: game.released,
    }));
  } catch (error) {
    console.error("RAWG Fetch Error:", error);
    return [];
  }
}
