const AI_URL = import.meta.env.VITE_AI_URL as string;

export const getRecommendations = async (userId: string, limit = 10): Promise<any[]> => {
  try {
    const response = await fetch(`${AI_URL}/recommendations/${userId}?limit=${limit}`);
    const data = await response.json();
    return data.recommendations ?? [];
  } catch (error) {
    console.error('Recommendations error:', error);
    return [];
  }
};

export const visualSearch = async (imageFile: File): Promise<any | null> => {
  try {
    const formData = new FormData();
    formData.append('file', imageFile);
    const response = await fetch(`${AI_URL}/visual-search`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Visual search error:', error);
    return null;
  }
};
