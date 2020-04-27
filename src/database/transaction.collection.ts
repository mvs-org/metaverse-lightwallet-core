import { RxCollection, RxDocument, RxJsonSchema } from 'rxdb'
import { Transaction } from '../../../metaverse-ts/lib'
import { Observable, BehaviorSubject } from 'rxjs'
import { map, debounceTime, switchMap } from 'rxjs/operators'
import { MetaverseLightwalletDatabase } from './database'


export interface TransactionDocType {
    hash: string
    confirmed_at?: number
    inputs: any[]
    outputs: any[]
    height: number
    lock_time?: number
}

export type TransactionDocMethods = {}

export type TransactionDocument = RxDocument<TransactionDocType, TransactionDocMethods>

export type TransactionCollection = RxCollection<TransactionDocType, TransactionDocMethods, TransactionCollectionMethods>

export type TransactionCollectionMethods = {
    count$: () => Observable<number>
    countAll: () => Promise<number>
    watch$: (debounce?: number) => Observable<TransactionDocType[]>
    latest: () => Promise<TransactionDocType | undefined>
    latest$: () => BehaviorSubject<RxDocument<TransactionDocType, TransactionDocMethods> | null>
    clear: () => Promise<number>
    add: (this: TransactionCollection, serializedTransaction: string, height: number) => Promise<RxDocument<TransactionDocType, TransactionDocMethods>>,
}

export async function initTransactionCollection(database: MetaverseLightwalletDatabase): Promise<TransactionCollection> {
    const transactionCollection = await database.collection<TransactionDocType, TransactionDocMethods, TransactionCollectionMethods>({
        name: 'transactions',
        schema: transactionSchema,
        methods: {},
        statics: transactionCollectionMethods,
    })
    return transactionCollection
}

export const transactionCollectionMethods: TransactionCollectionMethods = {
    count$: function (this: TransactionCollection) {
        return this.find().$.pipe(map(txs => txs.length))
    },
    countAll: async function (this: TransactionCollection) {
        const allDocs = await this.find().exec()
        return allDocs.length
    },
    watch$: function (this: TransactionCollection, debounce = 2000) {
        return this.$.pipe(
            debounceTime(debounce),
            switchMap(() => this.find().$.pipe(
            )),
        )
    },
    latest$: function (this: TransactionCollection) {
        return this.findOne().sort({ height: 'desc' }).$
    },
    latest: async function (this: TransactionCollection) {
        const latestTx = await this.find().sort({ height: 'desc' }).exec()
        return latestTx.length ? latestTx[0].toJSON() : undefined
    },
    clear: async function (this: TransactionCollection) {
        const deleted = await this.find().remove()
        return deleted.length
    },
    add: async function (this: TransactionCollection, serializedTransaction: string, height: number) {
        const transaction = Transaction.decode(serializedTransaction)
        return this.upsert({
            hash: transaction.getId('hex').toString(),
            height,
            outputs: transaction.outputs,
            inputs: transaction.inputs,
        })
    },
}

export const transactionSchema: RxJsonSchema<TransactionDocType> = {
    title: 'transaction',
    version: 0,
    description: 'Metaverse transactions',
    type: 'object',
    indexes: ['height'],
    properties: {
        hash: {
            type: 'string',
            primary: true,
        },
        inputs: {
            type: 'array',
        },
        outputs: {
            type: 'array',
        },
        lock_time: {
            type: 'integer',
        },
        height: {
            type: 'integer',
        },
        confirmed_at: {
            type: 'integer',
        },
    },
}