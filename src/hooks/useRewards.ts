import { useState, useCallback, useMemo, useEffect } from 'react';
import { FamilyStore } from '../api/family';
import { Reward, RewardRequest } from '../types/family';

/** Rewards shop state: reward catalog, requests, and per-member star balances. */
export function useRewards() {
  const store = useMemo(() => new FamilyStore(), []);
  const [rewards, setRewards] = useState<Reward[]>(() => store.getRewardsSync());
  const [requests, setRequests] = useState<RewardRequest[]>(() => store.getRewardRequestsSync());
  const [earned, setEarned] = useState<Record<string, number>>({});

  const refresh = useCallback(async () => {
    const [r, q, e] = await Promise.all([
      store.getRewards(),
      store.getRewardRequests(),
      store.getStarsEarned(),
    ]);
    setRewards(r);
    setRequests(q);
    setEarned(e);
  }, [store]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Stars earned minus stars spent on approved rewards (adjustments included). */
  const getBalance = useCallback(
    (memberId: string): number => {
      const spent = requests
        .filter((r) => r.member_id === memberId && r.status === 'approved')
        .reduce((sum, r) => sum + r.cost, 0);
      return (earned[memberId] ?? 0) - spent;
    },
    [earned, requests]
  );

  const pending = useMemo(() => requests.filter((r) => r.status === 'pending'), [requests]);

  const addReward = useCallback(
    async (reward: Omit<Reward, 'id'>) => {
      await store.addReward(reward);
      await refresh();
    },
    [store, refresh]
  );

  const removeReward = useCallback(
    async (id: string) => {
      await store.removeReward(id);
      await refresh();
    },
    [store, refresh]
  );

  const requestReward = useCallback(
    async (memberId: string, reward: Reward) => {
      await store.requestReward(memberId, reward);
      await refresh();
    },
    [store, refresh]
  );

  const resolveRequest = useCallback(
    async (id: string, approve: boolean) => {
      await store.resolveRewardRequest(id, approve);
      await refresh();
    },
    [store, refresh]
  );

  return { rewards, requests, pending, getBalance, addReward, removeReward, requestReward, resolveRequest, refresh };
}
