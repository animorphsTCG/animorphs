
import { UserProfile } from "@/types/admin";

export interface UserStats {
  totalUsers: number;
  paidUsers: number;
  musicSubscribers: number;
}

export const calculateUserStats = (users: UserProfile[]): UserStats => {
  return {
    totalUsers: users.length,
    paidUsers: 0, // This will be updated when we have the payment status
    musicSubscribers: users.filter(user => user.music_unlocked).length
  };
};
