import type { NextApiRequest, NextApiResponse } from 'next'
import { PublicKey, Commitment } from "@solana/web3.js"
import * as anchor from "@project-serum/anchor";
import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import { getAssociatedAccountBalance } from "@strata-foundation/spl-utils";
import { loadWalletKey } from '../../utils';
import {
  NATIVE_MINT,
} from "@solana/spl-token";

type Data = {
  data: string
}

const commitment: Commitment = 'confirmed';
const network = 'https://api.mainnet-beta.solana.com';
const opts = {
  commitment,
  confirmTransactionInitialTimeout: 2 * 60 * 1000,
  disableRetryOnRateLimit: false,
};
const connection = new anchor.web3.Connection(network, opts);
const mintRVTK = new PublicKey('51rN6ZcERwNtYvtubCwWn1pQDDfQpot6niYxwXnEurQJ');
const mintLOGOS = new PublicKey('7vb3kEPGkR1qCqQr3a4cNdLT6svrFpaxZqfY53L1LM5J');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const walletKeypair = loadWalletKey('files/id.json');
  const wallet = new anchor.Wallet(walletKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, anchor.AnchorProvider.defaultOptions());
  anchor.setProvider(provider);

  const tokenBondingSdk = await SplTokenBonding.init(provider);

  const { targetAmount: targetRVTKAmount } = await tokenBondingSdk.swap({
    baseMint: NATIVE_MINT,
    targetMint: mintRVTK,
    baseAmount: 0.01,
    slippage: 0.05,
  });
  console.log(targetRVTKAmount, 'targetRVTKAmount');
  const rvtkBalance = await getAssociatedAccountBalance(
    connection,
    wallet.publicKey,
    mintRVTK
  );
  console.log(rvtkBalance, 'rvtkBalance');

  const { targetAmount: targetLogosAmount } = await tokenBondingSdk.swap({
    baseMint: NATIVE_MINT,
    targetMint: mintLOGOS,
    baseAmount: 0.01,
    slippage: 0.05,
  });
  console.log(targetLogosAmount, 'targetLogosAmount');
  const logosBalance = await getAssociatedAccountBalance(
    connection,
    wallet.publicKey,
    mintRVTK
  );
  console.log(logosBalance, 'logosBalance');

  res.status(200).json({
    data: 'success'
  });
}
