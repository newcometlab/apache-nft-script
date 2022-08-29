import {
	Keypair,
} from '@solana/web3.js';
import fs from 'fs';
import { bs58 } from '@project-serum/anchor/dist/cjs/utils/bytes';

export function loadWalletKey(keypair: string): Keypair {
	if (!keypair || keypair == '') {
		throw new Error('Keypair is required!');
	}

	const decodedKey = new Uint8Array(
		keypair.endsWith('.json') && !Array.isArray(keypair)
			? JSON.parse(fs.readFileSync(keypair).toString())
			: bs58.decode(keypair),
	);

	const loaded = Keypair.fromSecretKey(decodedKey);
	return loaded;
}
  