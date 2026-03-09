export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function scheduleEventNotification(event: {
  id: string;
  title: string;
  time: string;
  date: string;
}) {
  if (!("serviceWorker" in navigator) || Notification.permission !== "granted") return;

  const eventDate = new Date(`${event.date}T${event.time}:00`);

  // Notify 5 minutes before
  const notifyTime = eventDate.getTime() - 5 * 60 * 1000;
  if (notifyTime <= Date.now()) return;

  navigator.serviceWorker.ready.then((registration) => {
    registration.active?.postMessage({
      type: "SCHEDULE_NOTIFICATION",
      title: `⏰ ${event.title}`,
      body: `Starting in 5 minutes at ${formatTime12(event.time)}`,
      time: notifyTime,
      tag: `event-${event.id}`,
    });
  });
}

function formatTime12(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}
