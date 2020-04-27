
import { MetaverseLightwalletCore, MetaverseLightwalletDatabaseMemory } from '../lib/index'
import { throttleTime, filter } from 'rxjs/operators'

(async () => {

    const db = await MetaverseLightwalletDatabaseMemory.create()
    const core = new MetaverseLightwalletCore(db)

    core.syncing$.subscribe(syncing => {
        console.log('sync status:', syncing)
    })
    core.balances$().subscribe(balances => console.log('balance', balances))

    console.log('Database', core.getName())

    db.transactions.latest$().pipe(
        throttleTime(1000),
    )
        .subscribe(latestTx => {
            if (latestTx) {
                console.log('latest transaction height:', latestTx.height)
            }
        })

    db.accounts.activeAccount$()
        .pipe(filter(account => !!account))
        .subscribe((account) => {
            console.log('active account:', account?.name)
            db.transactions.find().remove()
        })

    // create account. (not active until private property is set)
    db.accounts.insert({
        name: 'cangr',
        protected: 'dfjalkdsjfaa',
        addresses: [{
            a: 'abc',
            path: 'm/0',
        }, {
            a: 'MQWyTasDiEsAUqHy6fHuvzA2vozcVCVizQ',
            // a: 'MSCHL3unfVqzsZbRVCJ3yVp7RgAmXiuGN3',
            path: 'm/1',
        }],
        config: {
            index: 10,
        },
    })

    // wait some time. then update the account to active it
    setTimeout(() => {
        db.accounts.findOne({ selector: { name: 'cangr' } }).update({
            $set: {
                private: {
                    path: 'm/0',
                    xpub: 'xpub328402384023840923',
                    xpriv: 'xpriv348230984082304234',
                    algo: 'none',
                    multisig: [],
                },
            },
        })
    }, 1000)

})()