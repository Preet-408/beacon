import { useState, useEffect } from 'react';
import { loadData, saveData } from '../api/beacon-store';
import { NOTIFY_KEY } from '../api/notify';
import { Check, X, Plus, Trash2 } from 'lucide-react';
import { useRewards } from '../hooks/useRewards';
import { useFamily } from '../hooks/useFamily';
import { STAR_CURRENCY } from '../types/family';

/** Rewards shop: kids spend stars, parents approve. */
export function RewardsView() {
  const { members } = useFamily();
  const { rewards, pending, getBalance, getWeekly, history, addReward, removeReward, requestReward, resolveRequest } = useRewards();
  const [memberId, setMemberId] = useState<string>('');
  const [name, setName] = useState('');
  const [cost, setCost] = useState(20);

  // Parent PIN: a deterrent so kids can't approve their own requests (not real security).
  const [pin, setPin] = useState<string>('');
  useEffect(() => {
    loadData<string>('beacon_parent_pin', '').then(setPin);
  }, []);
  const guard = (action: () => void) => {
    if (pin) {
      const entered = window.prompt('Parent PIN');
      if (entered !== pin) return;
    }
    action();
  };
  const changePin = () => {
    if (pin && window.prompt('Current parent PIN') !== pin) return;
    const next = window.prompt('New parent PIN (leave empty to remove)') ?? null;
    if (next === null) return;
    setPin(next.trim());
    saveData('beacon_parent_pin', next.trim());
  };

  const setNotify = async () => {
    const current = await loadData<string>(NOTIFY_KEY, '');
    const next = window.prompt('HA notify service for push alerts (e.g. mobile_app_preets_iphone). Empty = off.', current);
    if (next !== null) saveData(NOTIFY_KEY, next.trim());
  };

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
                <button aria-label="Approve" onClick={() => guard(() => resolveRequest(r.id, true))}><Check size={18} /></button>
                <button aria-label="Deny" onClick={() => guard(() => resolveRequest(r.id, false))}><X size={18} /></button>
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
                <button className="rewards-del" aria-label={`Delete ${r.name}`} onClick={() => guard(() => removeReward(r.id))}>
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
        {rewards.length === 0 && <div className="chores-empty">No rewards yet. Add one below.</div>}
      </section>

      <section className="rewards-section">
        <h3>This week</h3>
        <div className="rewards-grid">
          {people.map((m) => {
            const w = getWeekly(m.id);
            return (
              <div key={m.id} className="rewards-card">
                <div className="rewards-card-name">{m.name}</div>
                <div className="rewards-card-cost">{w.chores} chores done</div>
                <div className="rewards-card-cost">+{w.earned} {STAR_CURRENCY} earned, −{w.spent} spent</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rewards-section">
        <h3>History</h3>
        {history.length === 0 && <div className="chores-empty">Nothing yet.</div>}
        {history.map((h, i) => (
          <div key={i} className="rewards-row">
            <span>{nameOf(h.member_id)}: {h.text}</span>
            <strong>{h.stars > 0 ? '+' : ''}{h.stars} {STAR_CURRENCY}</strong>
          </div>
        ))}
      </section>

      <section className="rewards-section">
        <h3>Add a reward</h3>
        <button type="button" className="rewards-ask" onClick={setNotify} style={{ marginBottom: 8, marginRight: 8 }}>
          Push alerts
        </button>
        <button type="button" className="rewards-ask" onClick={changePin} style={{ marginBottom: 8 }}>
          {pin ? 'Change parent PIN' : 'Set parent PIN'}
        </button>
        <form
          className="rewards-add"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || cost <= 0) return;
            guard(() => {
              addReward({ name: name.trim(), cost, icon: '🎁' });
              setName('');
            });
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
