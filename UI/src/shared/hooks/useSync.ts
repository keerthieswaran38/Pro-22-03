import { useQuery } from '@tanstack/react-query';
import { getEvents, getParticipants, getCoupons, getLeaderboard, getContent } from '../utils/storage';

export const useEvents = (options = {}) => {
  return useQuery({
    queryKey: ['events'],
    queryFn: () => getEvents(),
    refetchInterval: 5000,
    ...options
  });
};

export const useParticipants = (options = {}) => {
  return useQuery({
    queryKey: ['participants'],
    queryFn: () => getParticipants(),
    refetchInterval: 5000,
    ...options
  });
};

export const useCoupons = (options = {}) => {
  return useQuery({
    queryKey: ['coupons'],
    queryFn: () => getCoupons(),
    refetchInterval: 5000,
    ...options
  });
};

export const useLeaderboard = (options = {}) => {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => getLeaderboard(),
    refetchInterval: 5000,
    ...options
  });
};

export const useCMSContent = (options = {}) => {
  return useQuery({
    queryKey: ['content'],
    queryFn: () => getContent(),
    refetchInterval: 5000,
    ...options
  });
};
