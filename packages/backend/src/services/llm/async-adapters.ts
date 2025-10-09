import { AbstractAgent } from "@ag-ui/client";
import { AsyncQueue, ItemSink } from "./async-queue";

export type AgentSubscriber = AbstractAgent["subscribers"][number];
export type EventHandlerParams = Parameters<
  NonNullable<AgentSubscriber["onEvent"]>
>[0];

/**
 * Adapts your client's event callbacks into an AsyncIterableIterator<LLMResponse>.
 * - Pass an optional AbortSignal to stop streaming.
 * - The `subscribe` function must return an `unsubscribe()` cleanup.
 */
function subscribeToEvents(
  sink: ItemSink<EventHandlerParams>,
  agent: AbstractAgent,
  opts?: { signal?: AbortSignal },
) {
  const { unsubscribe } = agent.subscribe({
    onEvent(params) {
      sink.push(params);
    },
    onRunErrorEvent(params) {
      sink.push(params);
      // Propagate the error to consumers; pending/next pulls will reject
      sink.fail(params.event); // fail() also closes the iterator
    },
    onRunFinishedEvent(params) {
      sink.push(params);
      sink.finish();
    },
    onRunFailed({ error }) {
      sink.fail(error); // fail() also closes the iterator
    },
  });

  // Support external cancellation
  const onAbort = () => {
    try {
      unsubscribe();
    } catch {
      console.warn("Failed to unsubscribe");
    }
    sink.fail(new Error("Aborted"));
  };
  if (opts?.signal) {
    if (opts.signal.aborted) onAbort();
    else opts.signal.addEventListener("abort", onAbort, { once: true });
  }

  return unsubscribe;
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
  const unsubscribe = subscribeToEvents(queue, agent, {
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
  try {
    for await (const event of queue) {
      yield event;
    }
  } finally {
    unsubscribe();
  }

  // the final result is not part of the iterator, so we need to await it,
  // and it actually contains the final result of running the agent
  const result = await resultPromise;
  return result;
}
