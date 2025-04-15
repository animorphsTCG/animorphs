
export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  name: string;
  surname: string;
  age: number;
  gender: string | null;
  country: string | null;
  music_unlocked: boolean;
  has_paid?: boolean;
  created_at: string;
  date_of_birth?: string;
}
