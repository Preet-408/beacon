import { useState } from 'react';
import { Check, X, Plus, Trash2 } from 'lucide-react';
import { useRewards } from '../hooks/useRewards';
import { useFamily } from '../hooks/useFamily';
import { STAR_CURRENCY } from '../types/family';

/** Rewards shop: kids spend stars, parents approve. */
export function RewardsView() {
  const { members } = useFamily();
  const { rewards, pending, getBalance, addReward, removeReward, requestReward, resolveRequest } = useRewards();
  const [memberId, setMemberId] = useState<string>('');
  const [name, setName] = useState('');
  const [cost, setCost] = useState(20);

  const kids = members.filter((m) => m.role !== 'parent');
  const people = kids.length > 0 ? kids : members;
  const active = people.find((m) => m.id === memberId) ?? people[0];
  const balance = active ? getBalance(active.id) : 0;
  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? '?';

  return (
    <div className="rewards-view">
      <h2 className="rewards-title">Rewards {STAR_CURRENCY}</h2>

      <div className="rewards-members">
        {people.map((m) => (
          <button
            key={m.id}
            className={`rewards-member${active?.id === m.id ? ' rewards-member--active' : ''}`}
            onClick={() => setMemberId(m.id)}
          >
            {m.name} <strong>{getBalance(m.id)} {STAR_CURRENCY}</strong>
          </button>
        ))}
      </div>

      {pending.length > 0 && (
        <section className="rewards-section">
          <h3>Waiting for approval</h3>
          {pending.map((r) => (
            <div key={r.id} className="rewards-row">
              <span>{nameOf(r.member_id)} wants <strong>{r.reward_name}</strong> ({r.cost} {STAR_CURRENCY})</span>
              <span className="rewards-actions">
                <button aria-label="Approve" onClick={() => resolveRequest(r.id, true)}><Check size={18} /></button>
                <button aria-label="Deny" onClick={() => resolveRequest(r.id, false)}><X size={18} /></button>
              </span>
            </div>
          ))}
        </section>
      )}

      <section className="rewards-section">
        <h3>{active ? `${active.name}'s shop` : 'Shop'}</h3>
        <div className="rewards-grid">
          {rewards.map((r) => {
            const affordable = balance >= r.cost;
            const asked = pending.some((p) => p.member_id === active?.id && p.reward_id === r.id);
            return (
              <div key={r.id} className="rewards-card">
                <div className="rewards-card-name">{r.icon ?? '🎁'} {r.name}</div>
                <div className="rewards-card-cost">{r.cost} {STAR_CURRENCY}</div>
                <button
                  className="rewards-ask"
                  disabled={!active || !affordable || asked}
                  onClick={() => active && requestReward(active.id, r)}
                >
                  {asked ? 'Asked' : affordable ? 'Ask' : `Need ${r.cost - balance} more`}
                </button>
                <button className="rewards-del" aria-label={`Delete ${r.name}`} onClick={() => removeReward(r.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
        {rewards.length === 0 && <div className="chores-empty">No rewards yet. Add one below.</div>}
      </section>

      <section className="rewards-section">
        <h3>Add a reward</h3>
        <form
          className="rewards-add"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || cost <= 0) return;
            addReward({ name: name.trim(), cost, icon: '🎁' });
            setName('');
          }}
        >
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Reward name" />
          <input type="number" min={1} value={cost} onChange={(e) => setCost(Number(e.target.value))} />
          <button type="submit"><Plus size={16} /> Add</button>
        </form>
      </section>
    </div>
  );
}
