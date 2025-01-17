import { Resend } from "resend";
import { NextResponse } from "next/server";
import { DemoRequestEmail } from "@/emails/DemoRequest";
import { render } from "@react-email/render";
import { z } from "zod";

// Schema for contact request body
const contactRequestSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const rawBody = (await request.json()) as unknown;
    const result = contactRequestSchema.safeParse(rawBody);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request body: " + result.error.message },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY environment variable is required");
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { email } = result.data;
    const html = await render(DemoRequestEmail({ userEmail: email }));

    await resend.emails.send({
      from: "Michael Magán <magan@updates.usehydra.ai>",
      to: email,
      subject: "Thanks for your interest in Hydra!",
      html: html,
      cc: "magan@usehydra.ai",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
