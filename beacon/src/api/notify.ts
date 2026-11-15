import { loadData } from './beacon-store';
import { callHaService } from './ha-rest';

const KEY = 'beacon_notify_service';

/**
 * Send a push through an HA notify service (e.g. "mobile_app_preets_iphone").
 * The service name is stored in /beacon-data. No-op when unset; never throws,
 * so a notification failure can't break the action that triggered it.
 */
export async function notifyParents(title: string, message: string): Promise<void> {
  try {
    const service = await loadData<string>(KEY, '');
    if (!service) return;
    await callHaService('notify', service, { title, message });
  } catch {
    /* best effort */
  }
}

export const NOTIFY_KEY = KEY;
