import axios from 'axios';
import { Response, ResponseTxnObj } from './types';

const pageLength = 900;


export const getMagicEdenTransactions = async (page: number): Promise<Array<ResponseTxnObj>> => {
    const activities = await axios.get(
        `https://api-mainnet.magiceden.dev/v2/collections/apaches/activities?offset=${page * pageLength}&limit=1000`
    ).then((resp: Response) => {
        return resp.data;
    }).catch((err) => {
        console.log(err);
        return [];
    });

    return activities.filter((activity: ResponseTxnObj) => activity.type === 'buyNow');
}