import { NextResponse } from "next/server";
import { twiml } from "twilio";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: Request) {
  try {
    // Parse the form data from the incoming webhook
    const formData = await request.formData();
    const callSid = formData.get("CallSid");
    const from = formData.get("From");
    const to = formData.get("To");

    console.log("Incoming call:", { callSid, from, to });

    // Fetch active dispatcher
    let dispatcherId: string | undefined;
    try {
      const dispatcher = await convex.query(api.app_state.getActiveDispatcher);
      dispatcherId = dispatcher ?? undefined;
      console.log("Active dispatcher ID:", dispatcherId);
      if (!dispatcherId) {
        console.warn("No active dispatcher found in app_state. Check if a dispatcher was selected in the UI.");
      }
    } catch (e) {
      console.error("Failed to fetch active dispatcher", e);
    }

    // TODO: Add Twilio signature validation here
    // const signature = request.headers.get('x-twilio-signature');
    // ... validate ...

    const response = new twiml.VoiceResponse();
    const mediaStreamWssUrl = process.env.MEDIA_STREAM_WSS_URL;
    const clientIdentity = dispatcherId ?? process.env.TWILIO_CLIENT_IDENTITY ?? "user";

    if (mediaStreamWssUrl) {
      // Fork the inbound audio to a Twilio Media Stream WebSocket URL
      const streamUrl = dispatcherId
        ? `${mediaStreamWssUrl}?dispatcher_id=${dispatcherId}`
        : mediaStreamWssUrl;

      console.log("Media Stream URL:", streamUrl);
      console.log("Using dispatcher_id:", dispatcherId ?? "NOT SET - using fallback");

      const start = response.start();
      start.stream({
        url: streamUrl,
      });
    } else {
      console.warn("MEDIA_STREAM_WSS_URL not set, skipping media stream start");
    }

    // Dial a Twilio Client identity
    const dial = response.dial();
    dial.client(clientIdentity);

    return new NextResponse(response.toString(), {
      headers: {
        "Content-Type": "application/xml",
      },
    });
  } catch (error) {
    console.error("Error processing incoming call:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
