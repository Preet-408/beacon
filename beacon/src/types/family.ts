export interface FamilyMember {
  id: string;
  name: string;
  avatar: string; // emoji or image URL
  color: string; // hex color
  pin?: string; // 4-6 digit PIN
  role: 'parent' | 'child';
  calendar_entity?: string; // HA calendar entity_id (primary calendar)
  /** Additional HA calendar entity_ids linked to this member (e.g. a
   *  kid's sports team calendar), so their events group under this member
   *  too instead of falling into the "Other" bucket. `calendar_entity`
   *  remains the primary/back-compat single-calendar field. */
  additional_calendar_entities?: string[];
}

export interface Chore {
  id: string;
  name: string;
  assigned_to: string[]; // member IDs
  frequency: 'daily' | 'weekly' | 'once';
  value_cents: number;
  icon?: string; // emoji
  /** When true, only one assignee is responsible each week, rotating in order. */
  rotate_weekly?: boolean;
  /** Optional due time, 'HH:MM' (24h). Overdue chores are flagged in kid mode. */
  due_time?: string;
}

export interface ChoreCompletion {
  chore_id: string;
  member_id: string;
  completed_at: string; // ISO date string for serialization
  verified_by?: string; // member ID of verifying parent
}

export interface Streak {
  member_id: string;
  current: number;
  longest: number;
  last_completed: string; // ISO date string
}

export interface Routine {
  id: string;
  name: string;
  member_id: string;
  tasks: RoutineTask[];
  time_of_day: 'morning' | 'afternoon' | 'evening';
}

export interface RoutineTask {
  id: string;
  name: string;
  order: number;
}

/** A member checking off one routine task on one day (mirrors ChoreCompletion) */
export interface RoutineTaskCompletion {
  routine_id: string;
  task_id: string;
  member_id: string;
  completed_at: string; // ISO date string for serialization
}

/** A reward kids can spend stars on (e.g. "Pick the movie" for 15 stars). */
export interface Reward {
  id: string;
  name: string;
  cost: number; // in stars
  icon?: string; // emoji
}

/**
 * A kid asking for a reward, a parent's decision on it, or a manual balance
 * adjustment. Balance = stars earned from chores - sum of `cost` over
 * 'approved' entries. An adjustment is an 'approved' entry with kind
 * 'adjustment'; a negative cost adds stars (e.g. carrying a balance over).
 */
export interface RewardRequest {
  id: string;
  member_id: string;
  reward_id: string;
  reward_name: string;
  cost: number;
  status: 'pending' | 'approved' | 'denied';
  kind?: 'adjustment';
  requested_at: string;
  resolved_at?: string;
}

/** Earnings for a member over a time period */
export interface MemberEarnings {
  member_id: string;
  total_cents: number;
  chore_count: number;
}

/** Non-monetary "star" unit, selectable alongside currency symbols in
 *  Settings → Chores → Rewards for families that prefer points over money. */
export const STAR_CURRENCY = '\u2b50';

/** Format a chore's value_cents for display, honoring the star-currency
 *  option. In star mode the underlying value_cents is still the storage
 *  unit (so existing chore data / math is unchanged) but it's presented as
 *  a whole-number star count rather than a monetary amount with decimals. */
export function formatChoreValue(cents: number, currencySymbol: string): string {
  if (cents === 0) return '';
  if (currencySymbol === STAR_CURRENCY) {
    const stars = Math.round(cents / 100);
    return `${stars} ${STAR_CURRENCY}`;
  }
  return `${currencySymbol}${(cents / 100).toFixed(2)}`;
}

/** Color palette for family member assignment */
export const MEMBER_COLORS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#a855f7', // purple
  '#f97316', // orange
  '#ec4899', // pink
  '#14b8a6', // teal
  '#eab308', // yellow
  '#ef4444', // red
  '#6366f1', // indigo
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f43f5e', // rose
  '#8b5cf6', // violet
  '#d946ef', // fuchsia
  '#0ea5e9', // sky
  '#fb923c', // amber
  '#2dd4bf', // mint
  '#a3e635', // chartreuse
  '#c084fc', // lavender
  '#38bdf8', // light blue
] as const;

/** Avatar categories for the picker UI */
export interface AvatarCategory {
  label: string;
  emojis: string[];
}

export const AVATAR_CATEGORIES: AvatarCategory[] = [
  {
    label: 'People',
    emojis: [
      '👦', '👧', '👨', '👩', '👴', '👵', '🧑', '👶', '🧒', '👸', '🤴', '🦸',
      '👩‍🦰', '👨‍🦱', '🧔', '👱', '👩‍🦳', '👨‍🦳', '👩‍🦲', '🧑‍🦱',
      '🧑‍🦰', '🧑‍🦳', '👮', '🧙', '🧝', '🧛', '🧜', '🧚', '🦹', '🥷',
      '👼', '🤠', '🥸', '🤓', '😎', '🧑‍🚀', '🧑‍🎤', '🧑‍🎓', '🧑‍🍳', '🧑‍🔧',
    ],
  },
  {
    label: 'Animals',
    emojis: [
      '🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🦁', '🐮', '🐷', '🐸',
      '🦉', '🐝', '🦋', '🐢', '🐙', '🐧', '🦄', '🐬', '🐳', '🦈',
      '🦅', '🦜', '🐺', '🦝', '🐿️', '🦔', '🐾', '🦩', '🦖', '🐉',
    ],
  },
  {
    label: 'Nature',
    emojis: [
      '🌸', '🌻', '🌺', '🍀', '🌈', '⭐', '🌙', '☀️', '🔥',
      '❄️', '🌊', '⚡', '🌍', '🪐', '💫', '🍂', '🌿', '🌴',
    ],
  },
  {
    label: 'Sports & Hobbies',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏒', '🎸', '🎹', '🎨',
      '🎮', '🎯', '🎳', '🏄', '🚴', '🏋️', '🤸', '⛷️', '🏊', '🧗',
    ],
  },
  {
    label: 'Objects',
    emojis: [
      '🚀', '🎭', '🎪', '🎠', '🏰', '🗽', '⛺', '🎡', '🎢',
      '💎', '🔮', '🎀', '🧸', '🎒', '👑', '🦺', '🧢', '👓',
    ],
  },
  {
    label: 'Food',
    emojis: [
      '🍕', '🍦', '🧁', '🍩', '🎂', '🍔', '🌮', '🍣', '🥑',
      '🍪', '🧇', '🍫', '☕', '🧋', '🍓', '🍉', '🥝', '🍑',
    ],
  },
];

/** Flat list of all avatar emojis (for backwards compat) */
export const AVATAR_OPTIONS = AVATAR_CATEGORIES.flatMap((c) => c.emojis);

/** Whole weeks since the Unix epoch (Thursday-aligned; stable across devices). */
function weekIndex(date: Date): number {
  return Math.floor(date.getTime() / (7 * 86400000));
}

/** Is this member responsible for the chore right now (honors weekly rotation)? */
export function isChoreAssignedTo(chore: Chore, memberId: string, date: Date = new Date()): boolean {
  if (!chore.assigned_to.includes(memberId)) return false;
  if (!chore.rotate_weekly || chore.assigned_to.length < 2) return true;
  return chore.assigned_to[weekIndex(date) % chore.assigned_to.length] === memberId;
}

/** True when a due time ('HH:MM') has passed today. */
export function isChoreOverdue(chore: Chore, done: boolean, now: Date = new Date()): boolean {
  if (done || !chore.due_time) return false;
  const [h, m] = chore.due_time.split(':').map(Number);
  return now.getHours() * 60 + now.getMinutes() > h * 60 + m;
}
