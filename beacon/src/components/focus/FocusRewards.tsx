import { Reward, RewardRequest, STAR_CURRENCY } from '../../types/family';

interface FocusRewardsProps {
  rewards: Reward[];
  pending: RewardRequest[];
  balance: number;
  memberId: string;
  onAsk: (reward: Reward) => void;
}

/** Kid-facing shop: see balance, ask for a reward. Approval happens in the parent view. */
export function FocusRewards({ rewards, pending, balance, memberId, onAsk }: FocusRewardsProps) {
  return (
    <section className="focus-card">
      <header className="focus-card-header">
        <h2 className="focus-card-title">Rewards</h2>
        <span className="focus-card-count">{balance} {STAR_CURRENCY}</span>
      </header>
      <ul className="focus-checklist">
        {rewards.map((r) => {
          const asked = pending.some((p) => p.member_id === memberId && p.reward_id === r.id);
          const can = balance >= r.cost && !asked;
          return (
            <li key={r.id}>
              <button
                type="button"
                className="focus-check-row"
                disabled={!can}
                style={can ? undefined : { opacity: 0.55 }}
                onClick={() => onAsk(r)}
              >
                <span className="focus-check-label">
                  <span className="focus-check-icon">{r.icon ?? '🎁'}</span>
                  {r.name}
                </span>
                <span className="focus-check-value">
                  {asked ? 'Asked ✓' : `${r.cost} ${STAR_CURRENCY}`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {rewards.length === 0 && <div className="focus-empty">No rewards yet.</div>}
    </section>
  );
}
