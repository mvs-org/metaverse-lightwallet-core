import { initTransactionCollection } from './transaction.collection'
import { createRxDatabase, addRxPlugin } from 'rxdb'
import memoryAdapter from 'pouchdb-adapter-memory'
import { initAccountCollection } from './account.collection'
import { MetaverseLightwalletDatabase } from './database'


addRxPlugin(memoryAdapter)

export class MetaverseLightwalletDatabaseMemory {
    static async create(options: { name?: string } = {}) {
        const database = await createRxDatabase<MetaverseLightwalletDatabase>({
            name: options.name || 'metaverse',
            adapter: 'memory',
            multiInstance: true,
        })
        await initTransactionCollection(database)
        await initAccountCollection(database)
        return database
    }
}
