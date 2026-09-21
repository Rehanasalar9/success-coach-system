import AuditLog from '../models/AuditLog';

interface AuditLogOptions {
  actorId?: string;
  actorRole?: string;
  action: string;
  targetStudentId?: string;
  details: string;
  status?: 'SUCCESS' | 'FAILED' | 'UNAUTHORIZED';
  ipAddress?: string;
}

export const createAuditLog = async (options: AuditLogOptions): Promise<void> => {
  try {
    await AuditLog.create({
      actor: options.actorId,
      actorRole: options.actorRole || 'system',
      action: options.action,
      targetStudent: options.targetStudentId,
      details: options.details,
      status: options.status || 'SUCCESS',
      ipAddress: options.ipAddress || '127.0.0.1',
    });
  } catch (err) {
    console.error('Failed to record audit log entry:', err);
  }
};
