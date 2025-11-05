import app from './app'
import { startReminderJob } from "./jobs/reminders";
import 'dotenv/config';

const PORT = Number(process.env.PORT || 4000)
app.listen(PORT, () => {
  console.log(`[visicontrol] API corriendo en http://localhost:${PORT}`)
});

startReminderJob();
