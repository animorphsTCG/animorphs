
import { supabase } from "@/integrations/supabase/client";
import { AnimorphCard } from "@/types";

export async function fetchAnimorphCards(limit: number = 1000, offset: number = 0): Promise<AnimorphCard[]> {
  try {
    const { data, error } = await supabase
      .from("animorph_cards")
      .select("*")
      .order('card_number', { ascending: true })
      .range(offset, offset + limit - 1);
      
    if (error) {
      console.error("Error fetching animorph cards:", error);
      throw error;
    }
    
    if (!data) {
      console.warn("No cards found or null data returned");
      return [];
    }
    
    // Even if data is empty (data.length === 0), we return an empty array instead of throwing an error
    return data as AnimorphCard[];
  } catch (error) {
    console.error("Error fetching animorph cards:", error);
    throw error; // Re-throwing to allow components to handle the error
  }
}

export async function getRandomDeck(size: number = 10, excludeCardIds: number[] = []): Promise<AnimorphCard[]> {
  try {
    let query = supabase
      .from("animorph_cards")
      .select("*");
      
    if (excludeCardIds.length > 0) {
      query = query.not('id', 'in', `(${excludeCardIds.join(',')})`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error getting random deck:", error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.warn("No cards found for random deck");
      return [];
    }
    
    // Shuffle and slice to get random subset
    return (data as AnimorphCard[])
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(size, data.length)); // Make sure we don't try to slice more than available
  } catch (error) {
    console.error("Error getting random deck:", error);
    throw error; // Re-throwing to allow components to handle the error
  }
}

export async function fetchCardsByType(type: string, limit: number = 5): Promise<AnimorphCard[]> {
  try {
    const { data, error } = await supabase
      .from("animorph_cards")
      .select("*")
      .eq("animorph_type", type)
      .limit(limit);
      
    if (error) {
      console.error(`Error fetching ${type} cards:`, error);
      throw error;
    }
    
    return data as AnimorphCard[] || [];
  } catch (error) {
    console.error(`Error fetching ${type} cards:`, error);
    throw error; // Re-throwing to allow components to handle the error
  }
}

export async function fetchCardById(id: number): Promise<AnimorphCard | null> {
  try {
    const { data, error } = await supabase
      .from("animorph_cards")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.warn(`No card found with id: ${id}`);
        return null;
      }
      console.error(`Error fetching card with id ${id}:`, error);
      throw error;
    }
    
    return data as AnimorphCard;
  } catch (error) {
    console.error(`Error fetching card with id ${id}:`, error);
    throw error; // Re-throwing to allow components to handle the error
  }
}
