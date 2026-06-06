const MAX_MESSAGE = 140;

function cleanMessage(value, fallback = "Reminder time!") {
  const text = typeof value === "string" ? value.trim().replace(/[\r\n]+/g, " ").replace(/\s+/g, " ") : "";
  return (text || fallback).slice(0, MAX_MESSAGE) || fallback;
}

// Returns milliseconds until the next occurrence of HH:MM (daily).
function msUntilNextTime(timeStr, now = Date.now()) {
  const match = typeof timeStr === "string" ? timeStr.match(/^(\d{1,2}):(\d{2})$/) : null;
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;

  const d = new Date(now);
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hours, minutes, 0, 0);
  let diff = target.getTime() - now;
  if (diff <= 0) diff += 24 * 60 * 60 * 1000; // tomorrow
  return diff;
}

function reminderId(index, timeStr) {
  return `nekodrift-reminder-${index}-${timeStr}`;
}

async function scheduleAll(ctx, reminders, now = Date.now()) {
  await ctx.schedule.cancelAll();

  const valid = (Array.isArray(reminders) ? reminders : []).filter(
    (r) => r && typeof r.time === "string" && typeof r.message === "string",
  );

  for (let i = 0; i < valid.length; i++) {
    const r = valid[i];
    const delay = msUntilNextTime(r.time, now);
    if (delay === null) continue;

    const id = reminderId(i, r.time);
    const message = cleanMessage(r.message);

    await ctx.schedule.once(id, delay, async () => {
      await ctx.pet.speak(message);
      await ctx.pet.react("waving");
      // Reschedule for tomorrow
      const nextDelay = msUntilNextTime(r.time, Date.now());
      if (nextDelay !== null) {
        await ctx.schedule.once(id, nextDelay, async () => {
          await ctx.pet.speak(message);
          await ctx.pet.react("waving");
        });
      }
    });
  }

  await ctx.status.set(
    valid.length
      ? { text: `${valid.length} reminder${valid.length === 1 ? "" : "s"} active`, tone: "info" }
      : { text: "No reminders set", tone: "info" },
  );
}

export function register(NekoDriftPlugin) {
  NekoDriftPlugin.register({
    async start(ctx) {
      const reminders = ctx.config.get("reminders") ?? [];
      await scheduleAll(ctx, reminders);
    },

    async onConfigChange(ctx) {
      const reminders = ctx.config.get("reminders") ?? [];
      await scheduleAll(ctx, reminders);
      if (Array.isArray(reminders) && reminders.length > 0) {
        await ctx.pet.speak("Reminders updated!");
        await ctx.pet.react("success");
      }
    },

    async stop() {},
  });
}
