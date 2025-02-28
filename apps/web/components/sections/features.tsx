"use client";

import { Section } from "@/components/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { copy } from "@/lib/copy";
import { icons } from "lucide-react";

const content = copy.features;

export function Features() {
  return (
    <Section id="features" className="container py-24 sm:py-32">
      <div className="mb-16">
        <h2 className="text-lg text-primary uppercase tracking-wider font-medium mb-4">
          {content.title}
        </h2>

        <h2 className="text-5xl md:text-6xl font-bold mb-8 tracking-tight">
          {content.heading}
        </h2>

        <p className="text-xl text-muted-foreground max-w-2xl">
          {content.description}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {content.list.map(({ icon, title, description }, index) => (
          <Card
            key={title}
            className="h-full bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            <CardHeader>
              <div
                className={`bg-[#5C94F7] p-3 rounded-md w-fit mb-4 shadow-sm icon-container ${index % 2 === 0 ? "pulse-animation" : "float-animation"}`}
              >
                <Icon
                  name={icon as keyof typeof icons}
                  size={24}
                  color="white"
                  className="text-white"
                />
              </div>

              <CardTitle className="text-xl font-semibold">{title}</CardTitle>
            </CardHeader>

            <CardContent className="text-muted-foreground">
              {description}
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  );
}
