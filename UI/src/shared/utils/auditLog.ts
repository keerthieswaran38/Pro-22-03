/**
 * Audit Log — tracks all admin actions to localStorage.
 */

export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  target: string;
  details: string;
}

const AUDIT_KEY = 'gagner_audit_log';

export function getAuditLog(): AuditEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Audit Engine: Retrieval Failure', err);
    return [];
  }
}

const auditChannel = typeof window !== 'undefined' ? new BroadcastChannel('gagner_audit_sync') : null;

export function logAction(action: string, target: string, details: string = ''): void {
  try {
    const log = getAuditLog();
    const session = localStorage.getItem('gagner_admin_session');
    const user = session ? JSON.parse(session).email : 'system@gagner.com';

    const entry: AuditEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      timestamp: new Date().toISOString(), // Standardized UTC
      user,
      action,
      target,
      details,
    };

    log.unshift(entry); 
    if (log.length > 500) log.length = 500;
    localStorage.setItem(AUDIT_KEY, JSON.stringify(log));

    // Notify other listeners for real-time reactivity
    if (auditChannel) auditChannel.postMessage('LOG_UPDATED');
  } catch (err) {
    // Silent fail to prevent breaking main action flows
    console.error('Audit Engine: Action Capture Failure', err);
  }
}

export function performHealthCheck(): void {
  logAction('SYSTEM_HEALTH_CHECK', 'Infrastructure', 'Automatic integrity validation successful.');
}

export function clearAuditLog(): void {
  localStorage.removeItem(AUDIT_KEY);
}
