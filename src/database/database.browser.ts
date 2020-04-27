import { initTransactionCollection } from './transaction.collection'
import { createRxDatabase, addRxPlugin } from 'rxdb'
import adapter from 'pouchdb-adapter-idb'
import { initAccountCollection  } from './account.collection'
import { MetaverseLightwalletDatabase } from './database'


addRxPlugin(adapter)

export class MetaverseLightwalletDatabaseIdD {
    static async create(options: { name?: string } = {}) {
        const database = await createRxDatabase<MetaverseLightwalletDatabase>({
            name: options.name || 'metaverse',
            adapter: 'idb',
            multiInstance: true,
        })
        await initTransactionCollection(database)
        await initAccountCollection(database)
        return database
    }
}
