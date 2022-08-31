export type ResponseTxnObj = {
    signature: string;
    type: string;
    source: string;
    tokenMint: string;
    collection: string;
    collectionSymbol: string;
    slot: number;
    blockTime: number;
    buyer: string | null;
    buyerReferral: string;
    seller: string | null;
    sellerReferral: string;
    image: string;
    price: number;
}

export type BResponseTxnObj = {
    signature: string;
    type: string;
    source: string;
    tokenMint: string;
    collection: string;
    collectionSymbol: string;
    slot: number;
    blockTime: number;
    buyer: string | null;
    buyerReferral: string;
    seller: string | null;
    sellerReferral: string;
    image: string;
    price: number;
    isNew: boolean;
}

export type Response = {
    data: Array<ResponseTxnObj> | []
}

export type pTxnObj = {
    txnid: string;
    blockTime: number;
}

export type TxnObj = {
    txnid: string;
    blockTime: number;
    isDistributed: boolean;
}

export type BTxnObj = {
    txnid: string;
    blockTime: number;
    isDistributed: boolean;
    isNew: boolean;
}