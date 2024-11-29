import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parseAbiItem, concat, keccak256, toBytes } from "viem";
import { Resvg } from "@resvg/resvg-js";
import client from "../helpers/client";
import { getLevels, getAbi, isToken } from "../helpers/tokens";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { token, address } = req.query;

  if (!isToken(token as `0x${string}`)) {
    return res.status(400).json({ error: "Invalid token" });
  }

  if (
    !token ||
    !address ||
    typeof token !== "string" ||
    typeof address !== "string"
  ) {
    return res
      .status(400)
      .json({ error: "Missing or invalid token or address parameter" });
  }

  try {
    const png = await getPng(token as `0x${string}`, address as `0x${string}`);

    if (!png) {
      return res.status(404).json({ error: "Failed to generate PNG" });
    }

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    return res.send(png);
  } catch (error) {
    console.error("Error generating PNG:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

type Inscription = {
  seed: bigint;
  seed2: bigint;
  extra: bigint;
  creator: `0x${string}`;
};

async function getSvg(token: `0x${string}`, inscription: Inscription) {
  const abiString = getAbi(token);
  return client.readContract({
    address: token,
    abi: [parseAbiItem(abiString)],
    functionName: "getSvg",
    args: [inscription],
  });
}

async function generateInscription(
  address: `0x${string}`,
  token: `0x${string}`
): Promise<Inscription> {
  const levels = getLevels(token);
  const randomRange = Math.floor(Math.random() * (levels.length - 1));
  const min = levels[randomRange];
  const max = levels[randomRange + 1];
  const seed = BigInt(Math.floor(Math.random() * (max - min)) + min);

  const extraSeedHex = `0x${seed.toString(16)}`;
  const packed = concat([toBytes(address), toBytes(extraSeedHex)]);
  const extra = BigInt(keccak256(packed));

  return {
    seed,
    seed2: extra,
    extra,
    creator: address,
  };
}

async function getPng(token: `0x${string}`, address: `0x${string}`) {
  const inscription = await generateInscription(address, token);
  if (inscription.seed === 0n || inscription.extra === 0n) return;

  let svg = await getSvg(token, inscription);
  if (!svg) return;

  svg = svg
    .replace(/<def>.*?<\/def>/s, "")
    .replace(/\s*filter=['"]url\(#[^'"]*\)['"]/g, "");

  return new Resvg(svg, {
    fitTo: { mode: "width", value: 440 },
  })
    .render()
    .asPng();
}
