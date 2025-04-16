"use client";

import { ThreadList } from "@/components/thread/thread-list";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSession } from "@/hooks/auth";
import { api } from "@/trpc/react";
import { TamboTool, useTambo, useTamboThreadList } from "@tambo-ai/react";
import { TRPCClientErrorLike } from "@trpc/client";
import { PlusCircle, RefreshCcw, X } from "lucide-react";
import {
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { z } from "zod";
import { AirQuality } from "./components/AirQuality";
import {
  ApiActivityMonitor,
  type ApiState,
} from "./components/ApiActivityMonitor";
import { LocalFileContents, LocalFileList } from "./components/LocalFileList";
import { MessageSuggestions } from "./components/MessageSuggestions";
import { ThreadMessageInput } from "./components/ThreadMessageInput";
import { WeatherDay } from "./components/WeatherDay";
import { wrapApiCall } from "./utils/apiWrapper";

export default function SmokePage() {
  const { data: session } = useSession();
  const userId = session?.user.id;
  const [errors, setErrors] = useState<(TRPCClientErrorLike<any> | Error)[]>(
    [],
  );
  const {
    registerComponent,
    generationStage,
    thread,
    switchCurrentThread,
    startNewThread,
  } = useTambo();
  const messages = thread?.messages ?? [];

  const { mutateAsync: getAirQuality, isPending: isAqiPending } =
    api.demo.aqi.useMutation({
      onError: (error) => setErrors((prev) => [...prev, error]),
    });
  const { mutateAsync: getForecast, isPending: isForecastPending } =
    api.demo.forecast.useMutation({
      onError: (error) => setErrors((prev) => [...prev, error]),
    });
  const { mutateAsync: getHistoricalWeather, isPending: isHistoryPending } =
    api.demo.history.useMutation({
      onError: (error) => setErrors((prev) => [...prev, error]),
    });
  const { mutateAsync: getCurrentWeather, isPending: isCurrentWeatherPending } =
    api.demo.currentWeather.useMutation({
      onError: (error) => setErrors((prev) => [...prev, error]),
    });

  const [apiStates, setApiStates] = useState<Record<string, ApiState>>({
    aqi: {
      isRunning: false,
      startTime: null,
      duration: null,
      isPaused: false,
      shouldError: false,
      tokens: null,
    },
    forecast: {
      isRunning: false,
      startTime: null,
      duration: null,
      isPaused: false,
      shouldError: false,
      tokens: null,
    },
    history: {
      isRunning: false,
      startTime: null,
      duration: null,
      isPaused: false,
      shouldError: false,
      tokens: null,
    },
    currentWeather: {
      isRunning: false,
      startTime: null,
      duration: null,
      isPaused: false,
      shouldError: false,
      tokens: null,
    },
  });

  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  const wrappedApis = useWrappedApis(
    setApiStates,
    getAirQuality,
    getForecast,
    getHistoricalWeather,
    getCurrentWeather,
  );
  const isAnyApiRunning = Object.values(apiStates).some(
    (state) => state.isRunning,
  );

  const updateApiStates = useCallback(() => {
    setApiStates({
      aqi: wrappedApis.aqi.getState(),
      forecast: wrappedApis.forecast.getState(),
      history: wrappedApis.history.getState(),
      currentWeather: wrappedApis.currentWeather.getState(),
    });
  }, [wrappedApis]);

  useEffect(() => {
    if (isAnyApiRunning && !pollInterval) {
      const interval = setInterval(() => {
        console.log("polling");
        setApiStates({
          aqi: wrappedApis.aqi.getState(),
          forecast: wrappedApis.forecast.getState(),
          history: wrappedApis.history.getState(),
          currentWeather: wrappedApis.currentWeather.getState(),
        });
      }, 1000);
      setPollInterval(interval);
    } else if (!isAnyApiRunning && pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [apiStates, wrappedApis, pollInterval, isAnyApiRunning]);

  const tools: Record<string, TamboTool> = useMemo(
    () =>
      makeWeatherTools(
        wrappedApis.forecast.call,
        wrappedApis.history.call,
        wrappedApis.aqi.call,
        wrappedApis.currentWeather.call,
      ),
    [wrappedApis],
  );

  useEffect(() => {
    console.log("registering components");
    registerComponent({
      component: WeatherDay,
      name: "WeatherDay",
      description: "A weather day",
      propsSchema: z.object({
        data: z.object({
          date: z.string(),
          day: z.object({
            maxtemp_c: z.number(),
            mintemp_c: z.number(),
            avgtemp_c: z.number(),
            maxwind_kph: z.number(),
            totalprecip_mm: z.number(),
            avghumidity: z.number(),
            condition: z.object({
              text: z.string(),
              icon: z.string(),
            }),
          }),
        }),
      }),
      associatedTools: [tools.forecast, tools.history, tools.currentWeather],
    });
    registerComponent({
      component: AirQuality,
      name: "AirQuality",
      description: "Air quality",
      propsSchema: z.object({
        data: z.object({
          aqi: z.number(),
          pm2_5: z.number(),
          pm10: z.number(),
          o3: z.number(),
          no2: z.number(),
        }),
      }),
      associatedTools: [tools.aqi],
    });
    registerComponent({
      component: LocalFileList,
      name: "LocalFileList",
      description: "A list of local files",
      propsSchema: z.object({
        directoryName: z.string(),
        files: z.array(
          z.object({
            name: z.string(),
            content: z.string(),
          }),
        ),
      }),
    });
    registerComponent({
      component: LocalFileContents,
      name: "LocalFileContents",
      description: "The contents of a local file",
      propsSchema: z.object({
        fileName: z.string(),
        fileContents: z.string(),
      }),
    });
  }, [registerComponent, tools]);

  const {
    data: threadInfo,
    isLoading: isThreadInfoLoading,
    refetch: refetchThreadInfo,
  } = useTamboThreadList({
    contextKey: userId,
  });

  const isLoading =
    isAqiPending ||
    isForecastPending ||
    isHistoryPending ||
    isCurrentWeatherPending ||
    isThreadInfoLoading;

  return (
    <div className="container max-w-4xl py-8 space-y-4">
      <div className="flex  gap-4">
        <Card className="p-4">
          <div className="flex justify-between items-center mb-4 gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Threads</h2>
              {isLoading && (
                <div className="animate-spin">
                  <RefreshCcw className="h-4 w-4" />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => startNewThread()}
                className="mr-2"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                New Thread
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={async () => await refetchThreadInfo()}
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <ThreadList
            threads={threadInfo?.items ?? []}
            selectedThreadId={thread?.id}
            onThreadSelect={(threadId) => {
              switchCurrentThread(threadId);
            }}
            isLoading={isLoading}
          />
        </Card>
        <div className="flex-1">
          <Card className="p-4 min-h-[500px] flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground ml-12"
                      : "bg-muted mr-12"
                  }`}
                >
                  {message.content.map((content, index) => (
                    <div key={index}>
                      {content.type === "text"
                        ? content.text
                        : `[Unhandled ${content.type}]`}
                    </div>
                  ))}
                  {message.renderedComponent && (
                    <div className="mt-2">{message.renderedComponent}</div>
                  )}
                </div>
              ))}
            </div>
            <MessageSuggestions maxSuggestions={3} />
            <div>
              <p className="text-sm text-muted-foreground p-2">
                Generation stage: {generationStage}
              </p>
            </div>
            <ThreadMessageInput
              contextKey={userId}
              onSubmit={async () => {
                await refetchThreadInfo();
              }}
            />
          </Card>

          {errors.length > 0 && (
            <Card className="p-4 bg-destructive/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Errors</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setErrors([])}
                  className="h-8 px-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {errors.map((error, index) => (
                  <div key={index} className="text-sm font-mono">
                    {error.message || String(error)}
                  </div>
                ))}
              </div>
            </Card>
          )}
          <Card className="p-4">
            <h3 className="font-semibold mb-2">API Activity</h3>
            <div className="space-y-2">
              <ApiActivityMonitor
                name="Air Quality"
                state={apiStates.aqi}
                tokens={apiStates.aqi.tokens ?? undefined}
                onPauseToggle={(isPaused) => {
                  if (isPaused) {
                    wrappedApis.aqi.unpause();
                  } else {
                    wrappedApis.aqi.pause();
                  }
                  updateApiStates();
                }}
                onErrorToggle={(isErroring) => {
                  wrappedApis.aqi.setNextError(!isErroring);
                  updateApiStates();
                }}
              />
              <ApiActivityMonitor
                name="Forecast"
                state={apiStates.forecast}
                tokens={apiStates.forecast.tokens ?? undefined}
                onPauseToggle={(isPaused) => {
                  if (isPaused) {
                    wrappedApis.forecast.unpause();
                  } else {
                    wrappedApis.forecast.pause();
                  }
                  updateApiStates();
                }}
                onErrorToggle={(isErroring) => {
                  wrappedApis.forecast.setNextError(!isErroring);
                  updateApiStates();
                }}
              />
              <ApiActivityMonitor
                name="History"
                state={apiStates.history}
                tokens={apiStates.history.tokens ?? undefined}
                onPauseToggle={(isPaused) => {
                  if (isPaused) {
                    wrappedApis.history.unpause();
                  } else {
                    wrappedApis.history.pause();
                  }
                  updateApiStates();
                }}
                onErrorToggle={(isErroring) => {
                  wrappedApis.history.setNextError(!isErroring);
                  updateApiStates();
                }}
              />
              <ApiActivityMonitor
                name="Current Weather"
                state={apiStates.currentWeather}
                tokens={apiStates.currentWeather.tokens ?? undefined}
                onPauseToggle={(isPaused) => {
                  if (isPaused) {
                    wrappedApis.currentWeather.unpause();
                  } else {
                    wrappedApis.currentWeather.pause();
                  }
                  updateApiStates();
                }}
                onErrorToggle={(isErroring) => {
                  wrappedApis.currentWeather.setNextError(!isErroring);
                  updateApiStates();
                }}
              />
            </div>
          </Card>
          <div>
            <p>Thread ID: &apos;{thread?.id}&apos;</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function useWrappedApis(
  setApiStates: (value: SetStateAction<Record<string, ApiState>>) => void,
  getAirQuality: (...args: any[]) => Promise<any>,
  getForecast: (...args: any[]) => Promise<any>,
  getHistoricalWeather: (...args: any[]) => Promise<any>,
  getCurrentWeather: (...args: any[]) => Promise<any>,
) {
  const updateAqiState = useCallback(
    (
      isRunning: boolean,
      startTime: number | null,
      duration: number | null,
      tokens: number | null,
    ) =>
      setApiStates((prev) => ({
        ...prev,
        aqi: { ...prev.aqi, isRunning, startTime, duration, tokens },
      })),
    [setApiStates],
  );

  const updateForecastState = useCallback(
    (
      isRunning: boolean,
      startTime: number | null,
      duration: number | null,
      tokens: number | null,
    ) =>
      setApiStates((prev) => ({
        ...prev,
        forecast: { ...prev.forecast, isRunning, startTime, duration, tokens },
      })),
    [setApiStates],
  );

  const updateHistoryState = useCallback(
    (
      isRunning: boolean,
      startTime: number | null,
      duration: number | null,
      tokens: number | null,
    ) =>
      setApiStates((prev) => ({
        ...prev,
        history: { ...prev.history, isRunning, startTime, duration, tokens },
      })),
    [setApiStates],
  );

  const updateCurrentWeatherState = useCallback(
    (
      isRunning: boolean,
      startTime: number | null,
      duration: number | null,
      tokens: number | null,
    ) =>
      setApiStates((prev) => ({
        ...prev,
        currentWeather: {
          ...prev.currentWeather,
          isRunning,
          startTime,
          duration,
          tokens,
        },
      })),
    [setApiStates],
  );

  return useMemo(
    () => ({
      aqi: wrapApiCall(getAirQuality, updateAqiState),
      forecast: wrapApiCall(getForecast, updateForecastState),
      history: wrapApiCall(getHistoricalWeather, updateHistoryState),
      currentWeather: wrapApiCall(getCurrentWeather, updateCurrentWeatherState),
    }),
    [
      getAirQuality,
      getCurrentWeather,
      getForecast,
      getHistoricalWeather,
      updateAqiState,
      updateCurrentWeatherState,
      updateForecastState,
      updateHistoryState,
    ],
  );
}

function makeWeatherTools(
  getForecast: (...args: any[]) => Promise<any>,
  getHistoricalWeather: (...args: any[]) => Promise<any>,
  getAirQuality: (...args: any[]) => Promise<any>,
  getCurrentWeather: (...args: any[]) => Promise<any>,
): Record<string, TamboTool> {
  const weatherLocationSchema = z
    .object({
      location: z
        .string()
        .describe("The location to get the weather forecast for"),
    })
    .describe("The parameters to get the weather forecast for");

  const historySchema = z
    .object({
      location: z
        .string()
        .describe("The location to get the historical weather for"),
      datetime: z
        .string()
        .describe("The datetime to get the historical weather for"),
    })
    .describe("The parameters to get the historical weather for");

  const aqiSchema = z
    .object({
      location: z.string().describe("The location to get the air quality for"),
    })
    .describe("The parameters to get the air quality for");

  return {
    forecast: {
      name: "getWeatherForecast",
      description: "Get the weather forecast",
      tool: getForecast,
      toolSchema: z.function().args(weatherLocationSchema).returns(z.any()),
    },
    history: {
      name: "getHistoricalWeather",
      description: "Get the historical weather",
      tool: getHistoricalWeather,
      toolSchema: z.function().args(historySchema).returns(z.any()),
    },
    aqi: {
      name: "getAirQuality",
      description: "Get the air quality",
      tool: getAirQuality,
      toolSchema: z.function().args(aqiSchema).returns(z.any()),
    },
    currentWeather: {
      name: "getCurrentWeather",
      description: "Get the current weather",
      tool: getCurrentWeather,
      toolSchema: z.function().args(weatherLocationSchema).returns(z.any()),
    },
  };
}
