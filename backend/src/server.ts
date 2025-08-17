import app from "./shared/app";
import { scheduleReminderJob } from "./module/reminders/reminders.job";

const PORT = Number(process.env.PORT ?? 3000);

app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});

scheduleReminderJob();
