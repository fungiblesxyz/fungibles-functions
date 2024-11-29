const fungiToken = "0x7d9CE55D54FF3FEddb611fC63fF63ec01F26D15F";
const jelliToken = "0xA1b9d812926a529D8B002E69FCd070c8275eC73c";
const pepiToken = "0x28a5e71BFc02723eAC17E39c84c5190415C0de9F";
const froggiToken = "0x88A78C5035BdC8C9A8bb5c029e6cfCDD14B822FE";
const truffiToken = "0x2496a9AF81A87eD0b17F6edEaf4Ac57671d24f38";

export function getLevels(token: `0x${string}`) {
  if (token.toLowerCase() === fungiToken.toLowerCase()) {
    return [0, 21000, 525000, 1050000, 1575000, 2100000, 2625000];
  }
  if (token.toLowerCase() === jelliToken.toLowerCase()) {
    return [0, 21000, 105000, 420000, 1050000, 1764000];
  }
  if (token.toLowerCase() === pepiToken.toLowerCase()) {
    return [0, 11, 22, 33, 44, 56, 77];
  }
  if (token.toLowerCase() === froggiToken.toLowerCase()) {
    return [0, 3000, 10000, 30000, 60000, 120000, 240000];
  }
  if (token.toLowerCase() === truffiToken.toLowerCase()) {
    return [4000, 1000000];
  }
  return [0, 1000000];
}

export function getAbi(token: `0x${string}`) {
  if (token.toLowerCase() === pepiToken.toLowerCase()) {
    return "function getSvg((uint256 seed, uint seed2, uint256 extra)) view returns (string)";
  }
  if (token.toLowerCase() === truffiToken.toLowerCase()) {
    return "function getSvg((uint256 seed, uint256 extra, address creator)) view returns (string)";
  }

  return "function getSvg((uint256 seed, uint256 extra)) view returns (string)";
}

export function isToken(token: `0x${string}`) {
  const tokens = [fungiToken, jelliToken, pepiToken, froggiToken, truffiToken];
  return tokens.some((t) => t.toLowerCase() === token.toLowerCase());
}
