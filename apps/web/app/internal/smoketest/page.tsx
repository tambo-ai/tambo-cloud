"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { env } from "@/lib/env";
import { api } from "@/trpc/react";
import { useMutation } from "@tanstack/react-query";
import { HydraClient } from "hydra-ai";
import { ReactElement, useState } from "react";
interface Message {
  role: "user" | "assistant";
  content: string | ReactElement;
}

export default function SmokePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [hydraClient] = useState(() => {
    const client = new HydraClient({
      hydraApiKey: env.HYDRA_API_KEY,
      hydraApiUrl: env.HYDRA_API_URL,
    });
    registerComponents(client);
    return client;
  });
  const [threadId, setThreadId] = useState<string | null>(null);

  // XXX Here are the callbacks that I have access to at render time, but I have
  // already registered the components. Maybe I should have passed them in above
  // when I called registerComponents?
  const { mutateAsync: getAirQuality } = api.demo.aqi.useMutation();
  const { mutateAsync: getForecast } = api.demo.forecast.useMutation();
  const { mutateAsync: getHistoricalWeather } = api.demo.history.useMutation();

  // XXX and here is where I'd call generateComponent. I have the callbacks now,
  // should I be able to use them?
  const { mutateAsync: generateComponent } = useMutation({
    mutationFn: async () => {
      const response = await hydraClient.generateComponent(
        input,
        (msg) => {
          console.log(msg);
        },
        threadId ?? undefined,
      );
      setThreadId((response as any).threadId);
      return response;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const response = await generateComponent();

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: input,
    };

    // Add assistant response
    const assistantMessage: Message = {
      role: "assistant",
      content: "Ok",
    };
    if (response?.component) {
      assistantMessage.content = response.component;

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setInput("");
    }
  };

  return (
    <div className="container max-w-2xl py-8">
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
              {message.content}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit">Send</Button>
        </form>
      </Card>
    </div>
  );
}

interface WeatherDay {
  date: string;
  day: {
    maxtemp_c: number;
    mintemp_c: number;
    avgtemp_c: number;
    maxwind_kph: number;
    totalprecip_mm: number;
    avghumidity: number;
    condition: {
      text: string;
      icon: string;
    };
  };
}

interface WeatherDayProps {
  readonly data: WeatherDay;
}

const WeatherDay = ({ data }: WeatherDayProps): React.ReactNode => {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">
            {new Date(data.date).toLocaleDateString()}
          </p>
          <div className="flex items-center gap-2">
            <img
              src={data.day.condition.icon}
              alt={data.day.condition.text}
              width={64}
              height={64}
            />
            <p className="text-sm text-muted-foreground">
              {data.day.condition.text}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold">
            {Math.round(data.day.avgtemp_c)}°C
          </div>
          <div className="text-sm text-muted-foreground">
            H: {Math.round(data.day.maxtemp_c)}° L:{" "}
            {Math.round(data.day.mintemp_c)}°
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Wind</p>
          <p>{Math.round(data.day.maxwind_kph)} km/h</p>
        </div>
        <div>
          <p className="text-muted-foreground">Precipitation</p>
          <p>{data.day.totalprecip_mm} mm</p>
        </div>
        <div>
          <p className="text-muted-foreground">Humidity</p>
          <p>{Math.round(data.day.avghumidity)}%</p>
        </div>
      </div>
    </Card>
  );
};

interface AirQualityProps {
  readonly data: {
    aqi: number;
    pm2_5: number;
    pm10: number;
    o3: number;
    no2: number;
  };
}

const AirQuality = ({ data }: AirQualityProps): React.ReactNode => {
  const getAqiLevel = (aqi: number) => {
    if (aqi <= 50) return "Good";
    if (aqi <= 100) return "Moderate";
    if (aqi <= 150) return "Unhealthy for Sensitive Groups";
    if (aqi <= 200) return "Unhealthy";
    if (aqi <= 300) return "Very Unhealthy";
    return "Hazardous";
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Air Quality</p>
          <p className="text-sm text-muted-foreground">
            {getAqiLevel(data.aqi)}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{data.aqi}</div>
          <div className="text-sm text-muted-foreground">AQI</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">PM2.5</p>
          <p>{data.pm2_5} µg/m³</p>
        </div>
        <div>
          <p className="text-muted-foreground">PM10</p>
          <p>{data.pm10} µg/m³</p>
        </div>
        <div>
          <p className="text-muted-foreground">Ozone</p>
          <p>{data.o3} ppb</p>
        </div>
        <div>
          <p className="text-muted-foreground">Nitrogen Dioxide</p>
          <p>{data.no2} ppb</p>
        </div>
      </div>
    </Card>
  );
};

function registerComponents(client: HydraClient) {
  client.registerComponent({
    component: WeatherDay,
    name: "WeatherDay",
    description: "A weather day",
    propsDefinition: {
      data: "{ date: string; day: { maxtemp_c: number; mintemp_c: number; avgtemp_c: number; maxwind_kph: number; totalprecip_mm: number; avghumidity: number; condition: { text: string; icon: string } } }",
    },
    contextTools: [
      // XXX here I want to add a tool that will get the weather forecast for the
      // next 7 days, but I don't have access to the callback right now.
    ],
  });
  client.registerComponent({
    component: AirQuality,
    name: "AirQuality",
    description: "Air quality",
    propsDefinition: {
      data: "{ aqi: number; pm2_5: number; pm10: number; o3: number; no2: number }",
    },
  });
  client.registerComponent({
    component: WeatherForecast,
    name: "WeatherForecast",
    description: "Weather forecast",
    propsDefinition: {
      data: "{ forecast: { date: string; day: { maxtemp_c: number; mintemp_c: number; avgtemp_c: number; maxwind_kph: number; totalprecip_mm: number; avghumidity: number; condition: { text: string; icon: string } } }[] }",
    },
  });
}
