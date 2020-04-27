
import { MetaverseLightwalletCore, MetaverseLightwalletDatabaseMemory, } from '../lib/index';
(async () => {


    // new MVSLightwallet()
    const db = await MetaverseLightwalletDatabaseMemory.create()
    const core = new MetaverseLightwalletCore(db)

    core.syncing$.subscribe(syncing => {
        console.log('sync status:', syncing)
    })
    core.balances$().subscribe(balances => console.log('balance', balances))

    console.log('Database', core.getName())


    db.accounts.activeAccount$().subscribe((account) => {
        console.log('active account:', account?.name)
        db.transactions.find().remove()
    })

    // create account
    db.accounts.insert({
        name: 'cangr',
        protected: 'dfjalkdsjfaa',
        addresses: [{
            a: 'abc',
            path: 'm/0'
        }, {
            a: 'MQWyTasDiEsAUqHy6fHuvzA2vozcVCVizQ',
            // a: 'MSCHL3unfVqzsZbRVCJ3yVp7RgAmXiuGN3',
            path: 'm/1'
        }],
        config: {
            index: 10,
        }
    })

    // wait 5 seconds. then update the account to become active
    setTimeout(() => {
        db.accounts.findOne({ selector: { name: 'cangr' } }).update({
            $set: {
                private: {
                    path: 'm/0',
                    xpub: 'xpub328402384023840923',
                    xpriv: 'xpriv348230984082304234',
                    algo: 'none',
                    multisig: [],
                }
            }
        })
    }, 1000)

})()