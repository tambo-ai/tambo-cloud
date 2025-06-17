import {
  attachEmailWorker,
  initEmailQueue,
  EmailJobPayload,
  boss,
} from "./queue";
import { sendEmail } from "./sendEmail";

async function loadEmailComponent(name: string) {
  // Expecting email templates to live in `emails/<Name>.tsx` at repo root.
  const module = await import(`../../../../emails/${name}.tsx`);
  return module.default;
}

export async function startEmailWorker() {
  await initEmailQueue();

  attachEmailWorker(async (payload: EmailJobPayload) => {
    const Component = await loadEmailComponent(payload.componentName);
    await sendEmail({
      to: payload.to,
      component: Component,
      props: payload.props,
      subject: payload.subject,
      from: payload.from,
    });
  });

  process.on("SIGINT", gracefulShutdown);
  process.on("SIGTERM", gracefulShutdown);
}

async function gracefulShutdown() {
  if (boss) {
    await boss.stop();
  }
  process.exit(0);
}
