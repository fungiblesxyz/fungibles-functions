import type { VercelRequest, VercelResponse } from "@vercel/node";
import neynarClient from "../helpers/neynarClient";
import { isApiErrorResponse } from "@neynar/nodejs-sdk";

if (!process.env.SIGNER_UUID) {
  throw new Error("SIGNER_UUID is not defined");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { body } = req;

    if (!body?.data?.hash) {
      return res.status(400).json({ error: "Missing cast hash in request" });
    }

    await replyToCast(body.data.hash);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in handler:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}

const projects = [
  {
    name: "Fungi",
    address: "0x7d9CE55D54FF3FEddb611fC63fF63ec01F26D15F",
  },
  {
    name: "Jelli",
    address: "0xA1b9d812926a529D8B002E69FCd070c8275eC73c",
  },
  {
    name: "Pepi",
    address: "0x28a5e71BFc02723eAC17E39c84c5190415C0de9F",
  },
  {
    name: "Froggi",
    address: "0x88A78C5035BdC8C9A8bb5c029e6cfCDD14B822FE",
  },
  {
    name: "Truffi",
    address: "0x2496a9AF81A87eD0b17F6edEaf4Ac57671d24f38",
  },
];

const TOKEN_MESSAGES = {
  FUNGI: [
    "gm $fungi fam! 🍄 Keep spreading those spores! 🌿",
    "another beautiful day in the $fungi garden 🍄✨",
    "$fungi squad, let's grow together! 🍄🌱",
    "spreading some $fungi love your way! 🍄🌾",
  ],
  JELLI: [
    "floating through the $jelli seas! 🌊🪼",
    "glowing with $jelli vibes today! 🪼✨",
    "who's ready for some $jelli time? 🌊🪼",
    "making waves in the $jelli universe! 🪼💫",
  ],
  PEPI: [
    "hopping around with $pepi! 🐸🌿",
    "$pepi fam, let's make today count! 🐸💫",
    "spreading that $pepi energy! 🐸🍃",
    "another amazing day for $pepi! 🐸🌱",
  ],
  FROGGI: [
    "splashing in the $froggi pond! 🐸💦",
    "$froggi fam, let's make today ribbit! 🐸🌿",
    "leaping through lily pads with $froggi! 🐸🍃",
    "another day in the $froggi pond! 🐸💫",
  ],
  TRUFFI: [
    "reaching for the moon with $truffi! 🌕✨",
    "$truffi crew, let's shoot for the stars! 🌕💫",
    "spreading that $truffi moonlight! 🌕🚀",
    "another lunar day for $truffi! 🌕✨",
  ],
};

export const getTokenMessage = (tokenName: keyof typeof TOKEN_MESSAGES) => {
  const messages = TOKEN_MESSAGES[tokenName];
  return messages[Math.floor(Math.random() * messages.length)];
};

export function getRandomInscriptionPng() {
  const project = projects[Math.floor(Math.random() * projects.length)];
  const randomQuery = Math.random().toString(36).substring(7);
  const url = `https://fungibles-functions.vercel.app/api/inscription-png?token=${project.address}&address=0xF78108c9BBaF466dd96BE41be728Fe3220b37119&q=${randomQuery}`;

  return { project, url };
}

const replyToCast = async (parentHash: string) => {
  try {
    const { project, url } = getRandomInscriptionPng();
    const text = getTokenMessage(project.name.toUpperCase() as any);
    await neynarClient.publishCast({
      signerUuid: process.env.SIGNER_UUID!,
      parent: parentHash,
      text,
      embeds: [
        {
          url,
        },
      ],
    });
  } catch (err) {
    if (isApiErrorResponse(err)) {
      console.log(err.response.data);
    } else console.log(err);
  }
};
