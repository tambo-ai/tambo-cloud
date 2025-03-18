"use client";
import "regenerator-runtime/runtime";

import { useTambo, useTamboThreadInput } from "@tambo-ai/react";
import { useEffect, useRef } from "react";
import { zodToJsonSchema } from "zod-to-json-schema";
import { SpeechTranscription } from "./SpeechTranscription";
import { SubscribeForm, formSchemaTambo } from "./SubscribeForm";

export function TamboSubscribeIntegration() {
  const { registerComponent, thread, isIdle, generationStage } = useTambo();
  const contextKey = "subscribe-form";
  const { setValue, submit } = useTamboThreadInput(contextKey);
  const isRegistered = useRef(false);

  // Register the component once
  useEffect(() => {
    if (isRegistered.current) return;

    registerComponent({
      name: "SubscribeForm",
      description:
        "A form component for subscription information with firstName, lastName, title, and email fields.",
      component: SubscribeForm,
      propsDefinition: zodToJsonSchema(formSchemaTambo),
    });

    isRegistered.current = true;
  }, [registerComponent]);

  // Initialize form with empty values if thread is empty
  useEffect(() => {
    if (!thread?.messages?.length) {
      setValue(
        "Use the SubscribeForm component to display a subscription form with empty values for firstName, lastName, title, and email fields.",
      );
      setTimeout(() => {
        submit({ streamResponse: true });
      }, 100);
    }
  }, [thread?.messages, setValue, submit]);

  // Get processing status
  const isProcessing = !isIdle;
  const processingStage = isProcessing ? generationStage : null;

  // Find the most recent component
  const lastComponent = [...(thread?.messages || [])]
    .reverse()
    .find((m) => m.renderedComponent)?.renderedComponent;

  return (
    <div className="flex flex-col gap-6">
      {/* Show form component or loading */}
      <div className="border p-4 rounded-lg shadow-sm">
        {lastComponent || (
          <div className="text-center p-4">
            <div className="animate-pulse">Loading subscription form...</div>
          </div>
        )}
      </div>

      {/* Speech Input */}
      <SpeechTranscription
        contextKey={contextKey}
        isProcessing={isProcessing}
        processingStage={processingStage}
      />
    </div>
  );
}
