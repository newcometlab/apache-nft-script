import { Sequelize } from 'sequelize';
import Meta from '../models/meta';
import Transactions from '../models/transactions';
import { TxnObj } from './types';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'db/database.sqlite'
});

export const connectSqlite = async () => {
  new Promise((resolve, reject) => {
    sequelize.authenticate()
      .then(result => {
        console.log(`SQLite successfully connected!`);
        Transactions.sync();
        Meta.sync();
        return true;
      })
      .then(result => {
        console.log(`Tables created`);
        resolve(result);
      })
      .catch(error => {
        console.error('Unable to connect to SQLite database:', error);
        reject(error);
      });
  });
}

export const addTransactions = async (txnObjs: Array<TxnObj>) => {
  const txns = txnObjs.map(txn => {
    return { isDistributed: txn.isDistributed, txnid: txn.txnid, blockTime: txn.blockTime };
  });

  const maxCounter = 50;
  const txnCounter = Math.ceil(txns.length / maxCounter);

  const bulkTxns = [];
  for (let i = 0; i < txnCounter; i++) {
    const arr = [];
    for (let j = 0; j < maxCounter; j++) {
      if (i * maxCounter + j < txns.length) {
          arr.push(txns[i * maxCounter + j]);
      }
    }
    bulkTxns.push(arr);
  }

  let f = true;
  await Promise.all(
    bulkTxns.map(async batch => {
      const ret = await Transactions.bulkCreate(batch)
      .then(res => true).catch(err => {
        console.log(err);
        return false;
      });
      if (f && !ret) f = false;
    })
  );
  return f;
}

export const updateTransactions = async (txnids: Array<string>) => {
  let f = true;
  await Promise.all(
    txnids.map(async txnid => {
      const ret = await Transactions.update({
        isDistributed : true
      }, {
        where: { txnid }
      }).then(res => true).catch(err => {
        console.log(err);
        return false;
      });
      if (f && !ret) f = false;
    })
  );
  return f;
}

export const getTransaction = async (txnid: string) => {
  const txn = await Transactions.findOne({
    where: { txnid }
  });
  if (txn === undefined || txn === null) {
    return null;
  } else {
    return {
      id: txn.get('id'),
      txnid: txn.get('txnid'),
      isDistributed: txn.get('isDistributed'),
    }
  }
}

export const updateLastTxn = async (txnid: string, blockTime: number) => {
  return await Meta.update({
    txnid, blockTime
  }, {
    where: { id: 1 }
  }).then(res => true).catch(err => {
    console.log(err);
    return false;
  });
}

export const getLastTxn =async () => {
  const meta = await Meta.findOne({
    where: { id: 1 }
  });
  if (meta === undefined || meta === null) {
    return null;
  } else {
    return {
      txnid: meta.get('txnid'),
      blockTime: meta.get('blockTime'),
    }
  }
}
