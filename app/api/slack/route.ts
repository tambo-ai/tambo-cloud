import { NextResponse } from "next/server";
import { CreateSlackChannelSchema } from "@/lib/types/slack";
import { callSlackAPI } from "@/lib/slack";
import type { CreateChannelResponse, InviteResponse } from "@/lib/types/slack";
import { ConversationInfoResponse } from "@/lib/types/slack";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Input validation
    const result = CreateSlackChannelSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }

    const { companyName, email } = result.data;

    // Validate email domain if needed
    if (process.env.ALLOWED_EMAIL_DOMAINS) {
      const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS.split(",");
      const emailDomain = email.split("@")[1];
      if (!allowedDomains.includes(emailDomain)) {
        return NextResponse.json(
          { error: "Email domain not allowed" },
          { status: 400 }
        );
      }
    }

    // Create channel name with hydra prefix
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const channelName = `hydra-${companyName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 65)}-${randomSuffix}`;

    // Add validation for channel name
    if (channelName.length < 7) {
      return NextResponse.json(
        { error: "Company name results in invalid channel name" },
        { status: 400 }
      );
    }

    // Update the channel existence check
    try {
      const existingChannel = await callSlackAPI<ConversationInfoResponse>(
        "conversations.info",
        {
          channel: channelName,
        }
      );
    } catch (error) {
      // Channel doesn't exist or error occurred, continue with creation
      // No need to handle this error specifically
    }

    // Proceed with channel creation
    console.log("Attempting to create channel:", channelName);

    const channelData = await callSlackAPI<CreateChannelResponse>(
      "conversations.create",
      {
        name: channelName,
        is_private: true,
      }
    );

    console.log("Channel creation response:", channelData);

    if (!channelData?.channel?.id) {
      console.error("Invalid channel data received:", channelData);
      throw new Error("Failed to create Slack channel: Invalid response");
    }

    // Step 2: Invite via Slack Connect
    console.log("Attempting to send invite to:", email);

    const inviteData = await callSlackAPI<InviteResponse>(
      "conversations.inviteShared",
      {
        channel: channelData.channel.id,
        emails: [email],
        external_limited: false,
      }
    );

    console.log("Invite response:", inviteData);

    if (!inviteData?.invite_id) {
      throw new Error("Failed to create Slack invite: Invalid response");
    }

    // Add team ID validation
    const teamId = process.env.SLACK_TEAM_ID;
    if (!teamId) {
      throw new Error("SLACK_TEAM_ID environment variable is not set");
    }

    // Generate invitation link with validated team ID
    const inviteLink = `https://slack.com/app_redirect?channel=${channelData.channel.id}&team=${teamId}`;

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        channelId: channelData.channel.id,
        channelName: channelData.channel.name,
        inviteId: inviteData.invite_id,
        inviteLink,
      },
    });
  } catch (error) {
    // Enhance error logging
    console.error("Detailed Slack error:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: "Failed to create Slack channel",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
