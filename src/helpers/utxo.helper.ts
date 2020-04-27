import { ATTACHMENT_TYPE, ScriptAttenuation } from 'metaverse-ts'

export function assetSpendable(quantity: number, script: string, tx_height: number, current_height: number) {
    if (ScriptAttenuation.hasAttenuationModel(script)) {
        let model = ScriptAttenuation.getParameters(ScriptAttenuation.getAttenuationModel(script))
        let locked = 0
        let step_target = model.LH
        switch (model.TYPE) {
            case 1:
                for (let period = model.PN; period < model.UN; period++) {
                    if (period != model.PN)
                        step_target += model.LP / model.UN
                    if (tx_height + step_target > current_height)
                        locked += model.LQ / model.UN
                }
                return quantity - locked
            case 2:
            case 3:
                if (model.UC === undefined || model.UQ === undefined) {
                    throw Error('Invalid attenuation model params')
                }
                for (let period = model.PN; period < model.UC.length; period++) {
                    if (period != model.PN)
                        step_target += model.UC[period]
                    if (tx_height + step_target > current_height)
                        locked += model.UQ[period]
                }
                return quantity - locked
            default:
                throw Error('Unknown attenuation model type')

        }
    } else {
        return quantity
    }
}

export async function calculateUtxo(txs: any[], addresses: string[]) {
    let list: any = {}
    await Promise.all(txs.map(tx => {
        return Promise.all([
            Promise.all(
                tx.inputs.map((input: { previous_output: { hash: string, index: number } }) => {
                    list[input.previous_output.hash + '-' + input.previous_output.index] = 'spent'
                }),
            ),
            Promise.all(
                tx.outputs.map((output: any) => {
                    if (addresses.indexOf(output.address) !== -1 && list[tx.hash + '-' + output.index] !== 'spent') {
                        output.locked_until = (output.locked_height_range) ? tx.height + output.locked_height_range : 0
                        delete output['locked_height_range']
                        output.hash = tx.hash
                        list[tx.hash + '-' + output.index] = output
                    }
                    if (output.attenuation_model_param && output.attenuation_model_param.lock_period > 100000000) {
                        list[tx.hash + '-' + output.index] = 'spent'
                    }
                }),
            ),
        ])
    }))
    return Object.values(list).filter(item => item !== 'spent')
}


export function calculateBalancesFromUtxo(utxo: any[], addresses: string[], height: number, init: any, min_confirmations: number) {
    if (init == undefined) init = {
        ETP: {
            available: 0,
            unconfirmed: 0,
            frozen: 0,
            decimals: 8,
        },
        MST: {},
        MIT: [],
    }
    if (min_confirmations === undefined) {
        min_confirmations = 0
    }
    return utxo.reduce((acc, output) => {
        output.confirmed = min_confirmations <= 0 || (min_confirmations > 0 && output.height + min_confirmations <= height && !output.unconfirmed)
        if (addresses.indexOf(output.address) !== -1) {
            switch (output.attachment.type) {
                case ATTACHMENT_TYPE.MST:
                case 'asset-transfer':
                case 'asset-issue':
                    if (acc.MST[output.attachment.symbol] == undefined)
                        acc.MST[output.attachment.symbol] = {
                            available: 0,
                            unconfirmed: 0,
                            frozen: 0,
                            decimals: output.attachment.decimals,
                        }
                    let available = assetSpendable(output.attachment.quantity, output.script, output.height, height)
                    if (!output.confirmed) {
                        acc.MST[output.attachment.symbol].unconfirmed += available
                    } else {
                        acc.MST[output.attachment.symbol].available += available
                    }
                    acc.MST[output.attachment.symbol].frozen += output.attachment.quantity - available
                    break
                case ATTACHMENT_TYPE.MIT:
                case 'mit':
                    acc.MIT.push({
                        symbol: output.attachment.symbol,
                        address: output.attachment.address,
                        content: output.attachment.content,
                        owner: output.attachment.to_did,
                        status: output.attachment.status,
                    })
                    break
            }
            if (output.value) {
                if (output.locked_until > height) {
                    acc.ETP.frozen += output.value
                } else {
                    if (!output.confirmed) {
                        acc.ETP.unconfirmed = acc.ETP.unconfirmed ? acc.ETP.unconfirmed + output.value : output.value
                    } else {
                        acc.ETP.available += output.value
                    }
                }
            }
        }
        return acc
    }, init)
}
