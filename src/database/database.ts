import { TransactionCollection } from './transaction.collection';
import { RxDatabase, } from 'rxdb'
import { AccountCollection } from './account.collection';



export type MetaverseLightwalletDatabase = RxDatabase<MetaverseLightwalletDatabaseCollections>;
export type MetaverseLightwalletDatabaseCollections = {
    transactions: TransactionCollection,
    accounts: AccountCollection,
}

