import { RxCollection, RxDocument, RxJsonSchema } from 'rxdb'
import { MetaverseLightwalletDatabase } from './database';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Address {
    a: string,
    path: string
}
export interface MultisigAddress {
    a: string,
    k: string[]
    m: number
    s: number
}

export interface Account {
    name: string
    protected: string
    addresses?: Address[]
    private?: {
        path: string,
        xpub: string,
        xpriv: string,
        algo: string,
        multisig: MultisigAddress[]
    },
    config: {
        index: number,
        MST?: {
            hidden: string[]
            order: string[]
        }
        MIT?: {
            hidden: string[]
            order: string[]
        }
    }
}

export interface AccountConfig {
    index: number
    MST: {
        order: string[]
        hidden: string[]
    }
    MIT: {
        order: string[]
        hidden: string[]
    }
}


export async function initAccountCollection(database: MetaverseLightwalletDatabase): Promise<AccountCollection> {
    const accountCollection = await database.collection<Account, AccountDocMethods, AccountCollectionMethods>({
        name: 'accounts',
        schema: accountSchema,
        methods: {},
        statics: accountCollectionMethods,
    })
    return accountCollection
}

export type AccountDocMethods = {}

export type AccountDocument = RxDocument<Account, AccountDocMethods>

export type AccountCollection = RxCollection<Account, AccountDocMethods, AccountCollectionMethods>

export type AccountCollectionMethods = {
    activeAccount$: () => Observable<Account | null>
    addresses$: () => Observable<string[]>
}

export const accountCollectionMethods: AccountCollectionMethods = {
    activeAccount$: function (this: AccountCollection) {
        return this.findOne({ selector: { private: { $exists: true} } }).$.pipe(map(account => {
            return account?.toJSON() ?? account
        }))
    },
    addresses$: function (this: AccountCollection) {
        return this.activeAccount$().pipe(map(account => {
            if (account && account.addresses) {
                return account.addresses.map(address => address.a)
            }
            return []
        }))
    }
}

export const multisigAddressSchema: RxJsonSchema<MultisigAddress> = {
    version: 0,
    type: 'object',
    properties: {
        a: {
            type: 'string'
        },
        k: {
            type: 'array',
            items: {
                type: 'string'
            }
        },
        m: {
            type: 'integer'
        },
        s: {
            type: 'integer'
        },
    }
}

export const addressSchema: RxJsonSchema<Address> = {
    version: 0,
    type: 'object',
    properties: {
        a: {
            type: 'string'
        },
        path: {
            type: 'string'
        },
    }
}

export const accountConfigSchema: RxJsonSchema<AccountConfig> = {
    version: 0,
    type: 'object',
    properties: {
        index: {
            type: 'integer',
        },
        MST: {
            type: 'object',
            properties: {
                order: {
                    type: 'array',
                    items: {
                        type: 'string'
                    }
                },
                hidden: {
                    type: 'array',
                    items: {
                        type: 'string'
                    }
                }
            },
        },
        MIT: {
            type: 'object',
            properties: {
                order: {
                    type: 'array',
                    items: {
                        type: 'string'
                    }
                },
                hidden: {
                    type: 'array',
                    items: {
                        type: 'string'
                    }
                }
            },
        },
    }
}



export const accountSchema: RxJsonSchema<Account> = {
    title: 'account',
    version: 0,
    description: 'Metaverse Accounts',
    type: 'object',
    indexes: ['name'],
    properties: {
        name: {
            type: 'string',
            primary: true,
        },
        protected: {
            type: 'string'
        },
        addresses: {
            "type": "array",
            "items": addressSchema,
        },
        private: {
            "type": "object",
            "properties": {
                "path": {
                    "type": "string"
                },
                "xpub": {
                    "type": "string"
                },
                "xpriv": {
                    "type": "string"
                },
                "algo": {
                    "type": "string"
                },
                multisig: {
                    type: 'array',
                    items: multisigAddressSchema,
                }
            }
        },
        config: accountConfigSchema
    },
}