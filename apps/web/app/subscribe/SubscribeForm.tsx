"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";

// Schema with descriptions to help Tambo understand the component
export const formSchemaTambo = z.object({
  firstName: z.string().optional().describe("First name of the subscriber"),
  lastName: z.string().optional().describe("Last name of the subscriber"),
  title: z.string().optional().describe("Job title of the subscriber"),
  email: z.string().optional().describe("Email address of the subscriber"),
});

export type FormDataTambo = z.infer<typeof formSchemaTambo>;

// Simplified component with basic props and functionality
export function SubscribeForm(props: Partial<FormDataTambo>) {
  // Initialize with props or empty strings
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    title: "",
    email: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>(
    "Thank you for subscribing! We'll be in touch soon.",
  );
  const [error, setError] = useState<string | null>(null);

  // Debug timestamp to verify component updates
  const mountTime = useRef(new Date().toISOString());

  // Update form data when props change
  useEffect(() => {
    // Only update if we have actual prop values
    const hasProps = Object.values(props).some((value) => value !== undefined);

    if (hasProps) {
      setFormData((prevData) => ({
        ...prevData,
        ...props,
      }));

      // Reset success state when new props are received
      setSuccess(false);
      setError(null);

      console.log(`Form data updated with props:`, JSON.stringify(props));
    }
  }, [props]);

  // Log component mount
  useEffect(() => {
    console.log(`SubscribeForm mounted at ${mountTime.current}`);
  }, []);

  // Simple change handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Submit to our contacts API
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          role: "subscriber",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to subscribe");
      }

      setSuccess(true);
      setSuccessMessage(
        data.message || "Thank you for subscribing! We'll be in touch soon.",
      );
      console.log("Successfully subscribed:", data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="firstName">First Name</Label>
        <Input
          id="firstName"
          name="firstName"
          type="text"
          value={formData.firstName}
          onChange={handleChange}
          required
          disabled={isSubmitting || success}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="lastName">Last Name</Label>
        <Input
          id="lastName"
          name="lastName"
          type="text"
          value={formData.lastName}
          onChange={handleChange}
          disabled={isSubmitting || success}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          type="text"
          value={formData.title}
          onChange={handleChange}
          disabled={isSubmitting || success}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={isSubmitting || success}
          className="mt-1"
        />
      </div>

      {error && (
        <div className="rounded bg-red-50 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {success ? (
        <div className="rounded bg-green-50 p-3 text-sm text-green-600">
          {successMessage}
        </div>
      ) : (
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Subscribing..." : "Subscribe"}
        </Button>
      )}
    </form>
  );
}
