const db = require('../config/db');

// Ghi nhận Audit Log hệ thống (Có hỗ trợ ghi trong cùng Transaction hoặc độc lập)
const logAudit = async ({
  userId = null,
  userEmail = null,
  userRole = null,
  action,
  resourceType,
  resourceId,
  oldValues = null,
  newValues = null,
  req = null,
  connection = null
}) => {
  const ipAddress = req
    ? req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || null
    : null;
  const userAgent = req ? req.headers['user-agent'] || null : null;

  const actorId = userId || (req?.user ? req.user.id : null);
  const actorEmail = userEmail || (req?.user ? req.user.email : null);
  const actorRole = userRole || (req?.user ? req.user.role : null);

  const queryRunner = connection || db;

  try {
    await queryRunner.query(
      `INSERT INTO AuditLogs 
       (user_id, user_email, user_role, action, resource_type, resource_id, old_values, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        actorId,
        actorEmail,
        actorRole,
        action,
        resourceType,
        String(resourceId),
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        ipAddress,
        userAgent
      ]
    );
  } catch (error) {
    // Không ném lỗi ra ngoài làm sập transaction nghiệp vụ chính, chỉ log cảnh báo
    console.warn(`[AuditLog Warning] Không thể ghi audit log cho hành động "${action}":`, error.message);
  }
};

module.exports = {
  logAudit
};
