import { MetaverseExplorer } from './explorer'
import { flatMap, take, switchMap, debounceTime, filter } from 'rxjs/operators'
import { BehaviorSubject, interval, Observable, combineLatest, of } from 'rxjs'
import { MetaverseLightwalletDatabase } from './database/database'
import { RxDumpDatabaseAny, CollectionsOfDatabase } from 'rxdb'
import { merge } from 'lodash'
import { Balances } from './interfaces/balance.interface'
import { defaultBalances } from './defaults'
import { calculateUtxo, calculateBalancesFromUtxo } from './helpers/utxo.helper'

export class MetaverseLightwalletCore {

    syncing$ = new BehaviorSubject<boolean>(false)
    initialized$ = new BehaviorSubject<boolean>(false)
    height$ = new BehaviorSubject<number>(0)

    // it set to false it does not try to sync
    active$ = new BehaviorSubject<boolean>(true)

    constructor(
        public db: MetaverseLightwalletDatabase,
        private defaults: { balances?: Balances } = {},
        private explorer = new MetaverseExplorer(),
    ) {
        this.defaults.balances = this.defaults.balances ?? defaultBalances
        this.init(db)
    }

    utxos$ = (addresses$: Observable<string[]>, debounce?: number) => {
        return combineLatest([
            this.db.transactions.watch$(debounce),
            addresses$,
        ])
            .pipe(
                flatMap(([transactions, addresses]) => calculateUtxo(transactions, addresses)),
            )
    }

    balances$ = (debounce = 2000, min_confirnations = 3) => combineLatest([
        this.utxos$(this.addresses$(), debounce),
        this.addresses$(),
        this.height$,
    ])
        .pipe(
            debounceTime(debounce),
            switchMap(([utxos, addresses, currentHeight]: [any[], string[], number]) => {
                const defaultBalances = JSON.parse(JSON.stringify(this.defaults.balances))
                return of(merge(defaultBalances, calculateBalancesFromUtxo(utxos, addresses, currentHeight, defaultBalances, min_confirnations)))
            }),
        )

    addresses$() {
        return this.db.accounts.addresses$()
    }


    isSyncMaster() {
        return this.db.isLeader()
    }

    getName() {
        return this.db.name
    }

    transactionCollection() {
        return this.db.transactions
    }

    import(data: RxDumpDatabaseAny<CollectionsOfDatabase>) {
        this.db.importDump(data)
    }

    export(): Promise<RxDumpDatabaseAny<CollectionsOfDatabase>> {
        return this.db.dump()
    }

    destroy() {
        return this.db.destroy()
    }

    async resetTransactions() {
        if (this.syncing$.value) {
            await this.syncing$.pipe(filter(status => status === false)).toPromise()
        }
        const tmpActive = this.active$.value
        if (tmpActive) {
            this.active$.next(false)
        }
        await this.db.transactions.remove()
        if (tmpActive) {
            this.active$.next(true)
        }
    }

    private async init(database: MetaverseLightwalletDatabase) {
        await database.waitForLeadership()
        console.info('taking the lead')
        let accountSwitch = 0
        database.accounts.activeAccount$()
            .subscribe(async (account) => {
                if (accountSwitch > 1) {
                    this.resetTransactions()
                }
                if (account) {
                    accountSwitch++
                    await this.sync()
                    this.syncInterval()
                }
            })
    }

    private syncInterval() {
        interval(5000)
            .subscribe(() => {
                if (!this.active$.value) {
                    return
                }
                this.sync()
            })
    }

    private async sync() {
        return Promise.all([
            this.syncHeight(),
            this.syncTransactions()
                .catch(error => {
                    console.log(error)
                    this.syncing$.next(false)
                }),
        ])
    }

    private async syncTransactions() {
        if (this.syncing$.value) {
            return
        }
        this.syncing$.next(true)
        let lastHeight = (await this.db.transactions.latest())?.height || 0
        const addresses = await this.addresses$().pipe(take(1)).toPromise()
        let transactions: any[] = await this.explorer.listAddressTransactions({
            addresses,
            min_height: lastHeight + 1,
        })
        while (this.active$.value && transactions.length) {
            lastHeight = transactions[0].height
            await this.db.transactions.bulkInsert(transactions)
            transactions = await this.explorer.listAddressTransactions({
                addresses,
                min_height: lastHeight + 1,
            })
        }
        this.syncing$.next(false)
        if (!this.initialized$.value) {
            this.initialized$.next(true)
        }
    }

    private async syncHeight() {
        const height = await this.explorer.getHeight()
        if (height && height > this.height$.value) {
            this.height$.next(height)
        }
    }

}
