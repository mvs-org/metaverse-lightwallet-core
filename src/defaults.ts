import { Balances } from './interfaces/balance.interface';

export const defaultBalances: Balances = {
    ETP: { frozen: 0, available: 0, decimals: 8 },
    MST: {
        'PARCELX.GPX': { frozen: 0, available: 0, decimals: 8 },
        'RIGHTBTC.RT': { frozen: 0, available: 0, decimals: 4 },
        'MVS.ZGC': { frozen: 0, available: 0, decimals: 8 },
        DNA: { frozen: 0, available: 0, decimals: 4 },
        SDG: { frozen: 0, available: 0, decimals: 8 },
    },
    MIT: [],
}