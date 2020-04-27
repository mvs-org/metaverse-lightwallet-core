import { initTransactionCollection } from './transaction.collection';
import { createRxDatabase, addRxPlugin, } from 'rxdb'
import memoryAdapter from 'pouchdb-adapter-memory'
import { initAccountCollection, } from './account.collection';
import { MetaverseLightwalletDatabase } from './database';


addRxPlugin(memoryAdapter)

export class MetaverseLightwalletDatabaseMemory {
    static create(options: { name?: string } = {}) {
        return createRxDatabase<MetaverseLightwalletDatabase>({
            name: options.name || 'metaverse',
            adapter: 'memory',
            multiInstance: true,
        }).then(async (database) => {
            await initTransactionCollection(database)
            await initAccountCollection(database)
            return database
        })
    }
}
