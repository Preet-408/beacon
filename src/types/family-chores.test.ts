import { describe, it, expect } from 'vitest';
import { isChoreAssignedTo, isChoreOverdue, Chore } from './family';

const base: Chore = { id: 'c', name: 'Dishes', assigned_to: ['a', 'b'], frequency: 'daily', value_cents: 100 };

describe('isChoreAssignedTo', () => {
  it('assigns to everyone listed when not rotating', () => {
    expect(isChoreAssignedTo(base, 'a')).toBe(true);
    expect(isChoreAssignedTo(base, 'b')).toBe(true);
    expect(isChoreAssignedTo(base, 'z')).toBe(false);
  });

  it('rotates between assignees week to week, one at a time', () => {
    const chore = { ...base, rotate_weekly: true };
    const w1 = new Date('2026-11-10T12:00:00Z');
    const w2 = new Date('2026-11-17T12:00:00Z');
    const a1 = isChoreAssignedTo(chore, 'a', w1);
    expect(isChoreAssignedTo(chore, 'b', w1)).toBe(!a1);
    expect(isChoreAssignedTo(chore, 'a', w2)).toBe(!a1);
  });
});

describe('isChoreOverdue', () => {
  const chore = { ...base, due_time: '17:00' };
  it('flags undone chores after the due time', () => {
    expect(isChoreOverdue(chore, false, new Date(2026, 10, 14, 18, 0))).toBe(true);
    expect(isChoreOverdue(chore, false, new Date(2026, 10, 14, 16, 0))).toBe(false);
  });
  it('never flags done chores or chores without a due time', () => {
    expect(isChoreOverdue(chore, true, new Date(2026, 10, 14, 18, 0))).toBe(false);
    expect(isChoreOverdue(base, false, new Date(2026, 10, 14, 18, 0))).toBe(false);
  });
});
