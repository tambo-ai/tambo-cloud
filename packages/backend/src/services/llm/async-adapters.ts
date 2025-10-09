import { AbstractAgent } from "@ag-ui/client";
import { AsyncQueue } from "./async-queue";

export type AgentSubscriber = AbstractAgent["subscribers"][number];
export type EventHandlerParams = Parameters<
  NonNullable<AgentSubscriber["onEvent"]>
>[0];

/**
 * Adapts your client's event callbacks into an AsyncIterableIterator<LLMResponse>.
 * - Pass an optional AbortSignal to stop streaming.
 * - The `subscribe` function must return an `unsubscribe()` cleanup.
 */
function eventsToAsyncIterator(
  queue: AsyncQueue<EventHandlerParams>,
  subscribe: (agentSubcriber: AgentSubscriber) => { unsubscribe: () => void },
  opts?: { signal?: AbortSignal },
): AsyncIterableIterator<EventHandlerParams> {
  const { unsubscribe } = subscribe({
    onEvent(params) {
      queue.push(params);
    },
    onRunErrorEvent(params) {
      queue.push(params);
      // Propagate the error to consumers; pending/next pulls will reject
      queue.fail(params.event); // fail() also closes the iterator
    },
    onRunFinishedEvent(params) {
      queue.push(params);
      queue.finish();
    },
    onRunFailed({ error }) {
      queue.fail(error); // fail() also closes the iterator
    },
  });

  // Support external cancellation
  const onAbort = () => {
    try {
      unsubscribe();
    } catch {
      console.warn("Failed to unsubscribe");
    }
    queue.fail(new Error("Aborted"));
  };
  if (opts?.signal) {
    if (opts.signal.aborted) onAbort();
    else opts.signal.addEventListener("abort", onAbort, { once: true });
  }

  // Ensure iterator.return() cleans up
  const origReturn = queue.return.bind(queue);
  queue.return = async () => {
    try {
      unsubscribe();
    } catch {
      console.warn("Failed to unsubscribe");
    }
    if (opts?.signal) opts.signal.removeEventListener("abort", onAbort);
    return await origReturn();
  };

  return queue;
}

type RunAgentResult = Awaited<ReturnType<AbstractAgent["runAgent"]>>;
/**
 * Runs an agent and returns an async iterator that emits events from the agent.
 */
export async function* runStreamingAgent(
  agent: AbstractAgent,
  queue: AsyncQueue<EventHandlerParams>,
  args?: Parameters<AbstractAgent["runAgent"]>,
  opts?: { signal?: AbortSignal },
): AsyncIterableIterator<EventHandlerParams, RunAgentResult> {
  // Build the iterator first so early events are captured
  const iter = eventsToAsyncIterator(queue, agent.subscribe.bind(agent), {
    signal: opts?.signal,
  });

  // Kick off the underlying process (non-blocking)
  // If this can throw synchronously, you might want to catch and fail the iterator.
  const resultPromise = agent.runAgent(...(args ?? []));
  // Prevent unhandled rejections if iteration aborts early due to a failure
  void resultPromise.catch(() => undefined);

  // Before we return, we need to yield all the events from the agent
  // This is important because the agent may emit events after the runAgent call
  // has resolved, and we want to capture those events as well

  // Note that we are doing a manual iteration instead of `yield* iter` because
  // we need to capture any errors with stack traces to here, as they happen
  // inside this iterator
  for await (const event of iter) {
    yield event;
  }

  // the final result is not part of the iterator, so we need to await it,
  // and it actually contains the final result of running the agent
  const result = await resultPromise;
  return result;
}
