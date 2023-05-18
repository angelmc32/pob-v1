import { getBaseUrl } from "../url-formatting";
import { ethers } from "ethers";
import { keccak256 } from "ethers/lib/utils.js";
import MerkleTree from "merkletreejs";

export const createRandomWallets = (pobQuantity: number) => {
  const qrWalletsArray = Array(pobQuantity)
    .fill(0)
    .map(() => ethers.Wallet.createRandom());

  console.log(qrWalletsArray);

  const qrPubKeys = qrWalletsArray.map(wallet => wallet.address);
  const qrPrivKeysArray = qrWalletsArray.map(wallet => wallet.privateKey);
  console.log(qrPrivKeysArray);

  const merkleTreeWithQrPubKeys = new MerkleTree(qrPubKeys, keccak256, {
    sort: true,
    hashLeaves: true,
  });

  return { merkleTreeWithQrPubKeys, qrWalletsArray, qrPrivKeysArray };
};

export const generateUrlsForQrCodes = (pobContractAddress: string, privKeysArray: any[]) => {
  const urlsArray: string[] = [];

  const baseUrl = getBaseUrl();

  for (let i = 0; i < privKeysArray.length; i++) {
    urlsArray.push(`${baseUrl}/mint/${pobContractAddress}?key=${privKeysArray[i]}&index=${i}`);
  }

  return urlsArray;
};