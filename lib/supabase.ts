import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client — cookie-based sessions, works with Next.js App Router middleware
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export interface Post {
  id: string;
  created_at: string;
  username: string;
  country: string;
  caption: string | null;
  image_url: string | null;
  flame_count?: number;
  mascots?: string[];
}

export interface Comment {
  id: string;
  post_id: string;
  username: string;
  country: string;
  comment_text: string;
  created_at: string;
}

export interface Profile {
  id: string;
  username: string;
  country: string | null;
  avatar_url: string | null;
  supporter_points: number;
  tournament_points: number;
  rank: string;
  created_at: string;
  equipped_name_color: string | null;
  equipped_border: string | null;
  equipped_badge: string | null;
  equipped_card_bg: string | null;
  equipped_mascots: string[] | null; // max 3 mascot IDs
  post_mascot_slots: number;
  equipped_post_mascots: string[] | null;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  points_awarded: number;
  unlocked_at: string;
}

export interface DailyVote {
  id: string;
  voter_id: string;
  vote_date: string;
  first_pick: string;
  second_pick: string;
  third_pick: string;
  created_at: string;
}

export interface CommentatorPost {
  id: string;
  commentator_id: "jeroen" | "sierd" | "fabrizio";
  message: string;
  created_at: string;
  triggered_by: string | null;
}

export interface CommentatorConfig {
  id: "jeroen" | "sierd" | "fabrizio";
  avatar_url: string | null;
}

export type FanPersonality = "sarcastic" | "hype" | "toxic" | "funny" | "tactical" | "chill" | "chaotic";

export interface FanPersona {
  id: string;
  name: string;
  avatar_url: string | null;
  personality: FanPersonality;
  active: boolean;
  created_at: string;
}
