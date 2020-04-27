import { get } from 'superagent'

export class MetaverseExplorer {
    constructor(private url: string = 'https://explorer.mvs.org/api') { }

    setUrl(url: string){
        this.url = url
    }

    listAddressTransactions(options: { min_height?: number, addresses: string[] }) {
        let url = `${this.url}/v2/addresses/txs?addresses=` + options.addresses.join('&addresses=');
        if (options.min_height)
            url += '&min_height=' + options.min_height;
        return this.get(url)
    }

    getHeight(){
        return this.get(`${this.url}/v2/height`)
    }

    private get(url: string) {
        return get(url).set('Accept', 'application/json').send().then(response => response.body.result)
    }
}