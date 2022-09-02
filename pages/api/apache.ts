import type { NextApiRequest, NextApiResponse } from 'next'
import { addTransactions, connectSqlite, getLastTxn, getTransaction, updateLastTxn, updateTransactions } from './functions/db';
import { getMagicEdenTransactions } from './functions/services';
import { BResponseTxnObj, BTxnObj } from './functions/types';

import { Commitment, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as anchor from "@project-serum/anchor";
import { loadWalletKey } from '../../utils';
import { distributeCreatorTokens } from './functions/solana';

const percentage = Number(process.env?.NEXT_PUBLIC_DISTRIBITION_PERCENTAGE || 3750);
const rpcEndpoint = process.env?.NEXT_PUBLIC_RPC_ENDPOINT || 'https://ssc-dao.genesysgo.net/';

const commitment: Commitment = 'confirmed';
const opts = {
  commitment,
  confirmTransactionInitialTimeout: 2 * 60 * 1000,
  disableRetryOnRateLimit: false,
};
const connection = new anchor.web3.Connection(rpcEndpoint, opts);

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
          const _1stTxns = magdenTxns.filter(txn => txn.blockTime >= _blockTime);
  
          let _2ndTxns: Array<BResponseTxnObj> = [];
          await Promise.all(
            _1stTxns.map(async _stTxn => {
              const txn = await getTransaction(_stTxn.signature);
              if (txn === null) {
                _2ndTxns.push({ ..._stTxn, isNew: true });
              } else if (txn !== null && txn.isDistributed === false) {
                _2ndTxns.push({ ..._stTxn, isNew: false });
              }
            })
          );
          allMagdenTxns = allMagdenTxns.concat(_2ndTxns);
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
    return;
  }

  console.log(allMagdenTxns.length, 'allMagdenTxns');
  if (allMagdenTxns.length === 0) {
    timenow = Math.round(Date.now() / 1000);
    console.log(`========================= API ended at ${timenow} =========================\n`);

    res.status(200).json({ data: 'nothing to add' });
    return;
  }


  const walletKeypair = loadWalletKey('files/id.json');
  const wallet = new anchor.Wallet(walletKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, anchor.AnchorProvider.defaultOptions());

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
          provider,
          new anchor.web3.PublicKey(txn.buyer),
          (new anchor.BN(txn.price * LAMPORTS_PER_SOL)).muln(percentage).divn(100000).toNumber() / LAMPORTS_PER_SOL,
        );
      } catch (error) {
        console.log(error, `solana error for txn: ${txn.signature}`);
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
  const uTxnObjs = bTxnObjs.filter(txn => !txn.isNew && txn.isDistributed);

  if (nTxnObjs.length > 0) {
    await addTransactions(nTxnObjs);
  }
  if (uTxnObjs.length > 0) {
    await updateTransactions(uTxnObjs.map(txn => { return txn.txnid; }));
  }

  let _lastTxn = null;
  for (i = 0; i < bTxnObjs.length; i++) {
    if (bTxnObjs[bTxnObjs.length - 1 - i].isDistributed === true) {
      _lastTxn = bTxnObjs[bTxnObjs.length - 1 - i];
      break;
    }
  }

  if (_lastTxn !== null) {
    await updateLastTxn(_lastTxn.txnid, _lastTxn.blockTime);
  }

  timenow = Math.round(Date.now() / 1000);
  console.log(`========================= API ended at ${timenow} =========================\n`);

  res.status(200).json({
    data: String(bTxnObjs.length)
  });
}
