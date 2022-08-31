import type { NextApiRequest, NextApiResponse } from 'next'
import { addTransactions, connectSqlite, getLastTxn, getTransaction, updateLastTxn, updateTransactions } from './functions/db';
import { getMagicEdenTransactions } from './functions/services';
import { ResponseTxnObj, BResponseTxnObj, BTxnObj } from './functions/types';

import { Commitment, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as anchor from "@project-serum/anchor";
import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import { loadWalletKey } from '../../utils';
import { distributeCreatorTokens } from './functions/solana';

const commitment: Commitment = 'confirmed';
const network = 'https://api.mainnet-beta.solana.com';
const opts = {
  commitment,
  confirmTransactionInitialTimeout: 2 * 60 * 1000,
  disableRetryOnRateLimit: false,
};
const connection = new anchor.web3.Connection(network, opts);

type Data = {
  data: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method != "POST") {
    return res.status(400).json({ data: "It should be POST method." });
  }

  let timenow = Math.round(Date.now() / 1000);
  console.log(`\n========================= API started at ${timenow} =========================`);

  let isPromiseEnded = true;
  let allMagdenTxns: Array<BResponseTxnObj> = [];

  try {
    await connectSqlite();
  
    const lastTxn = await getLastTxn();
    if (lastTxn === null) {
      timenow = Math.round(Date.now() / 1000);
      console.log(`========================= API ended at ${timenow} =========================\n`);
  
      res.status(200).json({ data: 'error' });
      return;
    }

    let pageNum = 0;
    while (pageNum < 100) {
      if (isPromiseEnded) {
        isPromiseEnded = false;
        console.log(pageNum, 'pageNum')
  
        const magdenTxns = await getMagicEdenTransactions(pageNum);
        magdenTxns.sort((a, b) => b.blockTime - a.blockTime);
  
        let isExisting = false; let _blockTime: number = 0;
        for (let i = 0; i < magdenTxns.length; i++) {
          if (magdenTxns[i].signature === lastTxn.txnid) {
            _blockTime = magdenTxns[i].blockTime;
            isExisting = true;
            break;
          }
        }
        if (isExisting) {
          const _1stTxns = magdenTxns.filter(txn => txn.blockTime > _blockTime);
          const _2ndTxns = magdenTxns.filter(txn => txn.blockTime === _blockTime);
  
          let _3rdTxns: Array<ResponseTxnObj> = [];
          await Promise.all(
            _2ndTxns.map(async _ndTxn => {
              const txn = await getTransaction(_ndTxn.signature);
              if (txn === null || txn.isDistributed === false) {
                _3rdTxns.push(_ndTxn);
              }
            })
          );
          allMagdenTxns = allMagdenTxns.concat(
            _1stTxns.map(txn => { return { ...txn, isNew: true }; })
          ).concat(
            _3rdTxns.map(txn => { return { ...txn, isNew: false }; })
          );
          pageNum = 100;
        } else {
          pageNum++;
          allMagdenTxns = allMagdenTxns.concat(
            magdenTxns.map(txn => { return { ...txn, isNew: true }; })
          );
        }
        isPromiseEnded = true;
      }
    }
  } catch (error) {
    console.log(error, 'magiceden api error');

    timenow = Math.round(Date.now() / 1000);
    console.log(`========================= API ended at ${timenow} =========================\n`);

    res.status(200).json({
      data: 'magiceden api error'
    });
  }

  console.log(allMagdenTxns.length, 'allMagdenTxns');
  if (allMagdenTxns.length === 0) {
    timenow = Math.round(Date.now() / 1000);
    console.log(`========================= API ended at ${timenow} =========================\n`);

    res.status(200).json({ data: 'nothing to add' }); return;
  }


  const walletKeypair = loadWalletKey('files/id.json');
  const wallet = new anchor.Wallet(walletKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, anchor.AnchorProvider.defaultOptions());
  anchor.setProvider(provider);

  const tokenBondingSdk = await SplTokenBonding.init(provider);

  let bTxnObjs: Array<BTxnObj> = [];
  let i = 0; isPromiseEnded = true;
  while (i < allMagdenTxns.length) {
    if (isPromiseEnded) {
      isPromiseEnded = false;

      const txn: BResponseTxnObj = allMagdenTxns[allMagdenTxns.length - i - 1];

      if (txn.buyer === null) return;

      let ret = false;
      try {
        ret = await distributeCreatorTokens(
          connection,
          wallet,
          tokenBondingSdk,
          new anchor.web3.PublicKey(txn.buyer),
          (new anchor.BN(txn.price * LAMPORTS_PER_SOL)).divn(3 * 10).toNumber() / LAMPORTS_PER_SOL,
          (new anchor.BN(txn.price * LAMPORTS_PER_SOL)).divn(3 * 10).toNumber() / LAMPORTS_PER_SOL,
        );
      } catch (error) {
        console.log(error, `solana error for txn: ${txn.signature}`);

        timenow = Math.round(Date.now() / 1000);
        console.log(`========================= API ended at ${timenow} =========================\n`);

        res.status(200).json({
          data: 'magiceden api error'
        });
      }

      bTxnObjs.push({
        txnid: txn.signature,
        blockTime: txn.blockTime,
        isDistributed: ret ? true : false,
        isNew: txn.isNew
      });

      isPromiseEnded = true;
      i++;
    }
  }

  const nTxnObjs = bTxnObjs.filter(txn => txn.isNew);
  const uTxnObjs = bTxnObjs.filter(txn => !txn.isNew);
  
  if (nTxnObjs.length > 0) {
    await addTransactions(nTxnObjs);
  }
  if (uTxnObjs.length > 0) {
    await updateTransactions(uTxnObjs.map(txn => { return txn.txnid; }));
  }

  const _lastTxn = bTxnObjs[bTxnObjs.length - 1];

  await updateLastTxn(_lastTxn.txnid, _lastTxn.blockTime);

  timenow = Math.round(Date.now() / 1000);
  console.log(`========================= API ended at ${timenow} =========================\n`);

  res.status(200).json({
    data: String(bTxnObjs.length)
  });
}
