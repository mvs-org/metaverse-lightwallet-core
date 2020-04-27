import { MIT } from './mit.interface';

export interface Balance {
    frozen: number
    available: number
    decimals: number
}

export interface Balances {
    ETP: Balance
    MST: {
        [symbol: string]: Balance
    }
    MIT: MIT[]
    AVATAR?: string
    ADDRESS?: string
    IDENTIFIER?: string
}