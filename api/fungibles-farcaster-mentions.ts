import type { VercelRequest, VercelResponse } from "@vercel/node";
import neynarClient from "../helpers/neynarClient";
import { isApiErrorResponse } from "@neynar/nodejs-sdk";
import { createHmac } from "crypto";

if (!process.env.SIGNER_UUID) {
  throw new Error("SIGNER_UUID is not defined");
}

if (!process.env.WEBHOOK_SECRET) {
  throw new Error("WEBHOOK_SECRET is not defined");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await validateSignature(req);

    const { body } = req;
    if (!body?.data?.hash || !body?.data?.text) {
      return res
        .status(400)
        .json({ error: "Missing cast hash or text in request" });
    }

    await replyToCast(body.data.hash, body.data.text);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in handler:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
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

function findMentionedProjects(text: string): (typeof projects)[0][] {
  return projects.filter(
    (project) =>
      text.toLowerCase().includes(project.name.toLowerCase()) ||
      text.toLowerCase().includes(`$${project.name.toLowerCase()}`)
  );
}

function getRandomProject(mentionedProjects?: (typeof projects)[0][]) {
  if (mentionedProjects && mentionedProjects.length > 0) {
    return mentionedProjects[
      Math.floor(Math.random() * mentionedProjects.length)
    ];
  }
  return projects[Math.floor(Math.random() * projects.length)];
}

export function getRandomInscriptionPng(project?: (typeof projects)[0]) {
  const selectedProject =
    project || projects[Math.floor(Math.random() * projects.length)];
  const randomQuery = Math.random().toString(36).substring(7);
  const url = `https://fungibles-functions.vercel.app/api/inscription-png?token=${selectedProject.address}&address=0xF78108c9BBaF466dd96BE41be728Fe3220b37119&q=${randomQuery}`;

  return { project: selectedProject, url };
}

const replyToCast = async (parentHash: string, text: string) => {
  try {
    const mentionedProjects = findMentionedProjects(text);
    const selectedProject = getRandomProject(mentionedProjects);
    const { url } = getRandomInscriptionPng(selectedProject);
    const responseText = getTokenMessage(
      selectedProject.name.toUpperCase() as any
    );

    await neynarClient.publishCast({
      signerUuid: process.env.SIGNER_UUID!,
      parent: parentHash,
      text: responseText,
      embeds: [{ url }],
    });
    console.log(`replied to ${parentHash} with ${responseText}`);
  } catch (err) {
    if (isApiErrorResponse(err)) {
      console.log(err.response.data);
    } else console.log(err);
  }
};

async function validateSignature(req: VercelRequest) {
  const sig = req.headers["x-neynar-signature"];
  if (!sig || Array.isArray(sig)) {
    throw new Error("Invalid or missing Neynar signature in request headers");
  }

  const rawBody = JSON.stringify(req.body);
  const hmac = createHmac("sha512", process.env.WEBHOOK_SECRET as string);
  hmac.update(rawBody);
  const generatedSignature = hmac.digest("hex");

  if (sig !== generatedSignature) {
    throw new Error("Invalid signature");
  }
}
