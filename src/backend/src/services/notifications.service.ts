import { getPool } from "../config/db";
import { ssePush } from "../utils/sse";

export type NotificationKind =
  | "VISIT_CREATED"
  | "VISIT_APPROVED"
  | "VISIT_UPDATED"
  | "VISIT_REMINDER"
  | "VISIT_CANCELED"
  | "SYSTEM";

export type CreateNotificationDTO = {
  user_id: string;
  visit_id?: string | null;
  kind: NotificationKind;
  title: string;
  body: string;
  meta?: any;
};

export type Notification = {
  id: string;
  user_id: string;
  visit_id: string | null;
  kind: NotificationKind;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
  meta: any | null;
};

export async function createNotification(dto: CreateNotificationDTO) {
  const db = getPool();
  const q = `
    INSERT INTO notifications (user_id, visit_id, kind, title, body, meta)
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *`;
  const { rows } = await db.query(q, [
    dto.user_id,
    dto.visit_id ?? null,
    dto.kind,
    dto.title,
    dto.body,
    dto.meta ?? null,
  ]);
  const notif = rows[0] as Notification;
  if (notif?.user_id) ssePush(notif.user_id, { type: "notification", item: notif });
  return notif;
}

export async function listNotifications(params: {
  userId: string;
  onlyUnread?: boolean;
  limit?: number;
}) {
  const db = getPool();
  const wh: string[] = ["user_id = $1"];
  const vals: any[] = [params.userId];

  if (params.onlyUnread) wh.push("is_read = false");

  const where = "WHERE " + wh.join(" AND ");
  const limit = Math.min(params.limit ?? 50, 200);

  // LIMIT parametrizado
  const q = `
    SELECT *
    FROM notifications
    ${where}
    ORDER BY created_at DESC
    LIMIT $2`;

  const { rows } = await db.query(q, [params.userId, limit]);
  return rows as Notification[];
}

export async function markAsRead(userId: string, ids: string[]) {
  if (!ids.length) return { updated: 0 };
  const db = getPool();
  const q = `
    UPDATE notifications
    SET is_read = true, read_at = now()
    WHERE user_id = $1 AND id = ANY($2::uuid[])
  `;
  const { rowCount } = await db.query(q, [userId, ids]);
  return { updated: rowCount ?? 0 };
}

export async function countUnread(userId: string) {
  const db = getPool();
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS n
     FROM notifications
     WHERE user_id=$1 AND is_read=false`,
    [userId]
  );
  return rows[0]?.n ?? 0;
}

export async function upsertTomorrowReminders() {
  const db = getPool();
  const q = `
    INSERT INTO notifications (user_id, visit_id, kind, title, body, meta)
    SELECT
      v.created_by AS user_id,
      v.id         AS visit_id,
      'VISIT_REMINDER',
      'Recordatorio de visita',
      'Recuerda que mañana tienes una visita programada.',
      jsonb_build_object('visit_date', v.visit_date, 'visit_hour', v.visit_hour)
    FROM visits v
    JOIN users u ON u.id = v.created_by
    WHERE v.created_by IS NOT NULL
      AND u.notify_email = true
      AND v.status IN ('PENDING','APPROVED')
      AND v.visit_date = (CURRENT_DATE + INTERVAL '1 day')::date
    ON CONFLICT (user_id, visit_id, kind) DO NOTHING
  `;
  await db.query(q);
  return { ok: true };
}
