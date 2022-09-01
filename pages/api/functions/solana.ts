import { PublicKey, Connection, TransactionInstruction, Transaction, Signer, LAMPORTS_PER_SOL } from "@solana/web3.js"
import * as anchor from "@project-serum/anchor";
import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import { getAssociatedAccountBalance } from "@strata-foundation/spl-utils";
import * as splToken from "@solana/spl-token";
const { NATIVE_MINT } = splToken;

const mintRVTK = new PublicKey('51rN6ZcERwNtYvtubCwWn1pQDDfQpot6niYxwXnEurQJ');
// const mintLOGOS = new PublicKey('7vb3kEPGkR1qCqQr3a4cNdLT6svrFpaxZqfY53L1LM5J');

export const distributeCreatorTokens = async (
	connection: Connection,
	wallet: anchor.Wallet,
	provider: anchor.AnchorProvider,
	buyer: PublicKey,
	amount_1: number,
	// amount_2: number,
) => {
	anchor.setProvider(provider);
	const tokenBondingSdk = await SplTokenBonding.init(provider);

	const { targetAmount: targetRVTKAmount } = await tokenBondingSdk.swap({
		baseMint: NATIVE_MINT,
		targetMint: mintRVTK,
		baseAmount: amount_1,
		slippage: 0.05,
	});
	console.log(targetRVTKAmount, 'targetRVTKAmount');
	const rvtkBalance = await getAssociatedAccountBalance(
		connection,
		wallet.publicKey,
		mintRVTK
	);
	console.log(rvtkBalance, 'rvtkBalance');

	// const { targetAmount: targetLogosAmount } = await tokenBondingSdk.swap({
	// 	baseMint: NATIVE_MINT,
	// 	targetMint: mintLOGOS,
	// 	baseAmount: amount_2,
	// 	slippage: 0.05,
	// });
	// console.log(targetLogosAmount, 'targetLogosAmount');
	// const logosBalance = await getAssociatedAccountBalance(
	// 	connection,
	// 	wallet.publicKey,
	// 	mintRVTK
	// );
	// console.log(logosBalance, 'logosBalance');

	const srcRVTK = await getAssociateTokenAccount(mintRVTK, wallet.publicKey);
	const destRVTK = await getOrCreateAssociateTokenAccount(connection, mintRVTK, wallet, buyer);

	const instructions: Array<TransactionInstruction> = [];
	instructions.push(
		splToken.Token.createTransferInstruction(
			splToken.TOKEN_PROGRAM_ID,
			srcRVTK,
			destRVTK,
			wallet.publicKey,
			[],
			targetRVTKAmount * LAMPORTS_PER_SOL
		)
	);

	// const srcLOGOS = await getAssociateTokenAccount(mintLOGOS, wallet.publicKey);
	// const destLOGOS = await getOrCreateAssociateTokenAccount(connection, mintLOGOS, wallet, buyer);

	// instructions.push(
	// 	splToken.Token.createTransferInstruction(
	// 		splToken.TOKEN_PROGRAM_ID,
	// 		srcLOGOS,
	// 		destLOGOS,
	// 		wallet.publicKey,
	// 		[],
	// 		targetLogosAmount * LAMPORTS_PER_SOL
	// 	)
	// );

	await sendTransaction(connection, wallet, instructions);

	return true;
}

export const getAssociateTokenAccount = async (mint: PublicKey, authority: PublicKey) => {
	let [address] = await PublicKey.findProgramAddress(
			[authority.toBuffer(), splToken.TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
			splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
	);
	return address;
}

export const getOrCreateAssociateTokenAccount = async (
	connection: Connection,
	mint: PublicKey,
	wallet: anchor.Wallet,
	authority: PublicKey,
) => {
	const ata = await getAssociateTokenAccount(mint, authority);
	const accountInfo = await connection.getAccountInfo(ata);
	if(accountInfo == null) {
		const instructions = [
			splToken.Token.createAssociatedTokenAccountInstruction(
				splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
				splToken.TOKEN_PROGRAM_ID,
				mint,
				ata,
				authority,
				wallet.publicKey,
			)
		];
		await sendTransaction(connection, wallet, instructions);
	}
	return ata;
}

export const sendTransaction = async (
	connection: Connection,
	wallet: anchor.Wallet,
	instructions: Array<TransactionInstruction>,
	signers?: Array<Signer> | undefined
) => {
	let transaction = new Transaction();
	instructions.forEach(instr => transaction.add(instr));

	transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

	if (signers && signers.length > 0) {
			transaction.setSigners(wallet.publicKey, ...signers.map(s => s.publicKey));
			transaction.partialSign(...signers);
	} else
			transaction.setSigners(wallet.publicKey);

	const signedTransaction = await wallet.signTransaction(transaction);
	let hash = await connection.sendRawTransaction(signedTransaction.serialize());
	await connection.confirmTransaction(hash);
	return hash;
}
