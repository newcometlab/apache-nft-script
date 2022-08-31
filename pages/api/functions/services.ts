import axios from 'axios';
import { Response, ResponseTxnObj } from './types';

const pageLength = 900;


export const getMagicEdenTransactions = async (page: number): Promise<Array<ResponseTxnObj>> => {
    // const activities = await axios.get(
    //     `https://api-mainnet.magiceden.dev/v2/collections/apaches/activities?offset=${page * pageLength}&limit=1000`
    // ).then((resp: Response) => {
    //     return resp.data;
    // }).catch((err) => {
    //     console.log(err);
    //     return [];
    // });

    // return activities.filter((activity: ResponseTxnObj) => activity.type === 'buyNow');

    return [
        {
            "signature": "3wA2L82f1aDZAf547gyvaP9X3zN6ejqqu6sxXaidK2rPfTr4dvRZTAGuLnuzwKbJi6g56xjo4HEdR7Nff8g476Tx",
            "type": "buyNow",
            "source": "magiceden_v2",
            "tokenMint": "7zgEziLi5Qtf8ZqbPceFkVmnuBY7ELRDD2hBmRf4RxR9",
            "collection": "apaches",
            "collectionSymbol": "apaches",
            "slot": 146426704,
            "blockTime": 1660765915,
            "buyer": "AUCuShKXe4g56qJRugCFJbU7bRhro622tfDWXgn6DLUq",
            "buyerReferral": "",
            "seller": "2oirbRR9w6JW4xApw7oxRvM5J9VKp5b3JKw2UkCNoPKu",
            "sellerReferral": "",
            "price": 1,
            "image": "https://apaches.mypinata.cloud/ipfs/Qmb7LJUfwtQFKWM8VCcDUVe2Nat3ZNk9NPK7p77fRMXWdD/245.png"
        },
        {
            "signature": "2AxyaR7KRqrut67QbcdM6PPEhZ9VYX5hDc1zk7BVQ6qVtBx5VXibZa8LpAh2AAQv6d1biN1XXv6DAgH9ByS1PKe9",
            "type": "buyNow",
            "source": "magiceden_v2",
            "tokenMint": "6FbRQfK8dT3T3hc5Rhp2WuoMsuN6HWz566gDvssN8hAh",
            "collection": "apaches",
            "collectionSymbol": "apaches",
            "slot": 146426628,
            "blockTime": 1660765872,
            "buyer": "8ioPEi9EK1vCvPjudRdT6PH89pDj8fJa8z7uqaCVhbog",
            "buyerReferral": "",
            "seller": "2oirbRR9w6JW4xApw7oxRvM5J9VKp5b3JKw2UkCNoPKu",
            "sellerReferral": "",
            "price": 1.99,
            "image": "https://apaches.mypinata.cloud/ipfs/Qmb7LJUfwtQFKWM8VCcDUVe2Nat3ZNk9NPK7p77fRMXWdD/20.png"
        },
        {
            "signature": "5oENv4xwn59oHJqZsBz1qacAFYuFtCRAn1jWYSM6Y4eAE89WkZkesm9feGMdtA1qAFNqTU3gWUqWe8GkfusrTjfe",
            "type": "buyNow",
            "source": "magiceden_v2",
            "tokenMint": "E3bRdUvLFjRFEg7yVSnnV4a7phscPwJX2PDGaHhExsGC",
            "collection": "apaches",
            "collectionSymbol": "apaches",
            "slot": 146422905,
            "blockTime": 1660763600,
            "buyer": "2oirbRR9w6JW4xApw7oxRvM5J9VKp5b3JKw2UkCNoPKu",
            "buyerReferral": "",
            "seller": "2oirbRR9w6JW4xApw7oxRvM5J9VKp5b3JKw2UkCNoPKu",
            "sellerReferral": "",
            "price": 0.74,
            "image": "https://apaches.mypinata.cloud/ipfs/Qmb7LJUfwtQFKWM8VCcDUVe2Nat3ZNk9NPK7p77fRMXWdD/214.png"
        }
    ]
}