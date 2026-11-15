import { useState, useCallback, useMemo, useEffect } from 'react';
import { FamilyStore } from '../api/family';
import { Reward, RewardRequest, Chore, ChoreCompletion } from '../types/family';
import { notifyParents } from '../api/notify';
import { localDayKey } from '../api/date-keys';

/** Rewards shop state: reward catalog, requests, and per-member star balances. */
export function useRewards() {
  const store = useMemo(() => new FamilyStore(), []);
  const [rewards, setRewards] = useState<Reward[]>(() => store.getRewardsSync());
  const [requests, setRequests] = useState<RewardRequest[]>(() => store.getRewardRequestsSync());
  const [earned, setEarned] = useState<Record<string, number>>({});
  const [completions, setCompletions] = useState<ChoreCompletion[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);

  const refresh = useCallback(async () => {
    const [r, q, e, comps, ch] = await Promise.all([
      store.getRewards(),
      store.getRewardRequests(),
      store.getStarsEarned(),
      store.getCompletions(),
      store.getChores(),
    ]);
    setCompletions(comps);
    setChores(ch);
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

  /** Stars earned this week (since Sunday) and stars spent this week, per member. */
  const getWeekly = useCallback(
    (memberId: string): { earned: number; spent: number; chores: number } => {
      const now = new Date();
      const start = localDayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()));
      const value = new Map(chores.map((c) => [c.id, c.value_cents]));
      let cents = 0;
      let count = 0;
      for (const c of completions) {
        if (c.member_id !== memberId || localDayKey(c.completed_at) < start) continue;
        cents += value.get(c.chore_id) ?? 0;
        count += 1;
      }
      const spent = requests
        .filter((r) => r.member_id === memberId && r.status === 'approved' && r.resolved_at && localDayKey(r.resolved_at) >= start)
        .reduce((sum, r) => sum + r.cost, 0);
      return { earned: Math.round(cents / 100), spent, chores: count };
    },
    [completions, chores, requests]
  );

  /** Recent activity (earned + spent), newest first. */
  const history = useMemo(() => {
    const name = new Map(chores.map((c) => [c.id, c.name]));
    const value = new Map(chores.map((c) => [c.id, c.value_cents]));
    const items: { at: string; member_id: string; text: string; stars: number }[] = [];
    for (const c of completions) {
      const v = Math.round((value.get(c.chore_id) ?? 0) / 100);
      if (v > 0) items.push({ at: c.completed_at, member_id: c.member_id, text: name.get(c.chore_id) ?? 'Chore', stars: v });
    }
    for (const r of requests) {
      if (r.status === 'approved') items.push({ at: r.resolved_at ?? r.requested_at, member_id: r.member_id, text: r.reward_name, stars: -r.cost });
    }
    return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 25);
  }, [completions, chores, requests]);

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
      const req = await store.requestReward(memberId, reward);
      await refresh();
      const name = (await store.getMembers()).find((m) => m.id === memberId)?.name ?? 'A kid';
      if (req.status === 'pending') {
        notifyParents('Reward request', `${name} wants "${reward.name}" (${reward.cost} ⭐)`);
      }
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

  return { rewards, requests, pending, getBalance, getWeekly, history, addReward, removeReward, requestReward, resolveRequest, refresh };
}
