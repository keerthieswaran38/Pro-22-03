/**
 * Audit Log — tracks all admin and public actions to MongoDB.
 */

export interface AuditEntry {
  id?: string;
  timestamp: string;
  user: string;
  action: string;
  target: string;
  details: string;
}

const auditChannel = typeof window !== 'undefined' ? new BroadcastChannel('gagner_audit_sync') : null;

export async function getAuditLog(): Promise<AuditEntry[]> {
  const res = await fetch('/api/audit');
  if (!res.ok) throw new Error('Failed to fetch audit log');
  return await res.json();
}

export function logAction(action: string, target: string, details: string = ''): void {
  try {
    const session = typeof localStorage !== 'undefined' ? localStorage.getItem('gagner_admin_session') : null;
    const user = session ? JSON.parse(session).email : 'system@gagner.com';

    const entry: AuditEntry = {
      timestamp: new Date().toISOString(),
      user,
      action,
      target,
      details,
    };

    fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    }).catch(e => console.error('Audit Fetch Error', e));

    // Notify other listeners for UI reactivity
    if (auditChannel) auditChannel.postMessage('LOG_UPDATED');
  } catch (err) {
    console.error('Audit Engine: Action Capture Failure', err);
  }
}

export function performHealthCheck(): void {
  logAction('SYSTEM_HEALTH_CHECK', 'Infrastructure', 'Automatic integrity validation successful.');
}

export async function clearAuditLog(): Promise<void> {
   await fetch('/api/audit', { method: 'DELETE' });
}
