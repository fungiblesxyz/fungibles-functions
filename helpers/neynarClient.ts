import { NeynarAPIClient } from "@neynar/nodejs-sdk";

if (!process.env.NEYNAR_API_KEY) {
  throw new Error("NEYNAR_API_KEY is not defined");
}

const neynarClient = new NeynarAPIClient({
  apiKey: process.env.NEYNAR_API_KEY,
});

export default neynarClient;
