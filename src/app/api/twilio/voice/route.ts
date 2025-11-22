import { NextResponse } from "next/server";
import { twiml } from "twilio";

export async function POST(request: Request) {
  try {
    // Parse the form data from the incoming webhook
    const formData = await request.formData();
    const callSid = formData.get("CallSid");
    const from = formData.get("From");
    const to = formData.get("To");

    console.log("Incoming call:", { callSid, from, to });

    // TODO: Add Twilio signature validation here
    // const signature = request.headers.get('x-twilio-signature');
    // ... validate ...

    const response = new twiml.VoiceResponse();
    const mediaStreamWssUrl = process.env.MEDIA_STREAM_WSS_URL;
    const clientIdentity = process.env.TWILIO_CLIENT_IDENTITY ?? "user";

    if (mediaStreamWssUrl) {
      // Fork the inbound audio to a Twilio Media Stream WebSocket URL
      const start = response.start();
      start.stream({
        url: mediaStreamWssUrl,
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
