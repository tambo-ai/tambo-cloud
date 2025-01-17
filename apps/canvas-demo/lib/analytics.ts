interface SessionMetrics {
  messageCount: number;
  chartCount: number;
  startTime: number;
  lastMessageTime?: number;
  lastInteractionTime?: number;
  successfulInteractions: number;
  failedInteractions: number;
  responseTimeTotal: number;
}

// Initialize session metrics
const sessionMetrics: SessionMetrics = {
  messageCount: 0,
  chartCount: 0,
  startTime: Date.now(),
  successfulInteractions: 0,
  failedInteractions: 0,
  responseTimeTotal: 0,
};

export const getTimeSinceLastMessage = (): number => {
  if (!sessionMetrics.lastMessageTime) return 0;
  return Date.now() - sessionMetrics.lastMessageTime;
};

export const getSessionDuration = (): number => {
  return Date.now() - sessionMetrics.startTime;
};

export const getAverageResponseTime = (): number => {
  if (sessionMetrics.messageCount === 0) return 0;
  return sessionMetrics.responseTimeTotal / sessionMetrics.messageCount;
};

export const incrementChartCount = () => {
  sessionMetrics.chartCount++;
};

export const recordMessageSent = (responseTime: number) => {
  sessionMetrics.messageCount++;
  sessionMetrics.lastMessageTime = Date.now();
  sessionMetrics.responseTimeTotal += responseTime;
  sessionMetrics.successfulInteractions++;
};

export const recordMessageError = () => {
  sessionMetrics.failedInteractions++;
};

export const getSessionMetrics = () => {
  return {
    total_messages: sessionMetrics.messageCount,
    total_charts: sessionMetrics.chartCount,
    session_duration_ms: getSessionDuration(),
    average_response_time_ms: getAverageResponseTime(),
    successful_interactions: sessionMetrics.successfulInteractions,
    failed_interactions: sessionMetrics.failedInteractions,
  };
};

// Track when user starts composing a message
let compositionStartTime: number | null = null;

export const startCompositionTracking = () => {
  compositionStartTime = Date.now();
};

export const getCompositionDuration = (): number => {
  if (!compositionStartTime) return 0;
  return Date.now() - compositionStartTime;
};

export const resetCompositionTracking = () => {
  compositionStartTime = null;
};
