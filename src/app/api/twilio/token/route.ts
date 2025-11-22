import { type Id } from "convex/_generated/dataModel";
import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";
import Twilio from "twilio";
import { api } from "../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const identityParam = searchParams.get("identity");

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKey = process.env.TWILIO_API_KEY_SID;
  const apiSecret = process.env.TWILIO_API_KEY_SECRET;
  const voiceAppSid = process.env.TWILIO_VOICE_APP_SID;
  const identity =
    identityParam ?? process.env.TWILIO_CLIENT_IDENTITY ?? "user";

  if (!accountSid || !apiKey || !apiSecret || !voiceAppSid) {
    return NextResponse.json(
      { error: "Missing Twilio environment variables" },
      { status: 500 },
    );
  }

  // Set the active dispatcher if an identity (dispatcher ID) was provided
  if (identityParam) {
    try {
      await convex.mutation(api.app_state.setActiveDispatcher, {
        dispatcherId: identityParam as Id<"dispatchers">,
      });
      console.log(`Token endpoint: Set active dispatcher to ${identityParam}`);
    } catch (e) {
      console.error("Token endpoint: Failed to set active dispatcher", e);
    }
  }

  const AccessToken = Twilio.jwt.AccessToken;
  const VoiceGrant = AccessToken.VoiceGrant;

  // Create a "grant" which enables a client to use Voice as a given user
  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: voiceAppSid,
    incomingAllow: true, // Allow incoming calls
  });

  // Create an access token which we will sign and return to the client,
  // containing the grant we just created
  const token = new AccessToken(accountSid, apiKey, apiSecret, {
    identity: identity,
  });
  token.addGrant(voiceGrant);

  return NextResponse.json({
    identity: identity,
    token: token.toJwt(),
  });
}
