import type { NextApiRequest, NextApiResponse } from 'next'

import { Commitment, LAMPORTS_PER_SOL, PublicKey, Keypair } from '@solana/web3.js';
import * as anchor from "@project-serum/anchor";
import { loadWalletKey } from '../../utils';
import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import * as splToken from "@solana/spl-token";
const { NATIVE_MINT } = splToken;

const commitment: Commitment = 'confirmed';
const network = 'https://ssc-dao.genesysgo.net/';
const opts = {
  commitment,
  confirmTransactionInitialTimeout: 2 * 60 * 1000,
  disableRetryOnRateLimit: false,
};
const connection = new anchor.web3.Connection(network, opts);
const mintRVTK = new PublicKey('51rN6ZcERwNtYvtubCwWn1pQDDfQpot6niYxwXnEurQJ');

type Data = {
  data: string
}

const getPricing = () => {
	return SplTokenBonding.tokenBondingKey(mintRVTK)
	.then(async res => {
		console.log(res, 'res')
		const tokenBondingKey= res[0];
		return res[0];
	}).catch(err => {
		console.log(err, 'err');
		return null;
	});

}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
//   if (req.method != "POST") {
//     return res.status(400).json({ data: "It should be POST method." });
//   }

  // const walletKeypair = loadWalletKey('files/id.json');
  const wallet = new anchor.Wallet(Keypair.generate());
  const provider = new anchor.AnchorProvider(connection, wallet, anchor.AnchorProvider.defaultOptions());

  anchor.setProvider(provider);
  const tokenBondingSdk = await SplTokenBonding.init(provider);

	const tokenBondingKey = await SplTokenBonding.tokenBondingKey(mintRVTK)
	.then(async res => {
		return res[0];
	}).catch(err => {
		console.log(err, 'err');
		return null;
	});
	if (!tokenBondingKey) {
		res.status(200).json({
			data: 'error'
		});
		return;
	}

	const pricing = await tokenBondingSdk.getPricing(tokenBondingKey);
	console.log(pricing?.current(), 'pricing1')

  res.status(200).json({
    data: tokenBondingKey.toBase58()
  });
}
