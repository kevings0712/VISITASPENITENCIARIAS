import { upsertTomorrowReminders } from "../services/notifications.service";

export function startReminderJob() {
  // corre cada hora
  setInterval(async () => {
    try { await upsertTomorrowReminders(); } catch {}
  }, 60 * 60 * 1000);

  // dispara una vez al levantar
  upsertTomorrowReminders().catch(() => {});
}
