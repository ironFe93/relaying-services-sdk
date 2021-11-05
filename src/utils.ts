import { AbiItem } from 'web3-utils';
import { RelayingServicesAddresses } from './interfaces';
import { ContractAddresses } from '@rsksmart/rif-relay-contracts';
import { Contract } from 'web3-eth-contract';
import { EnvelopingConfig } from '@rsksmart/rif-relay-common';
import { ContractError } from './ContractError';

export function getAbiItem(contractAbi: AbiItem[], itemName: string): AbiItem {
    const abiItems = contractAbi.filter((abiItem) => abiItem.name === itemName);
    if (abiItems.length > 0) {
        return abiItems[0];
    }
    throw new Error(`Item ${itemName} doesn't exists on contract abi`);
}

export async function addressHasCode(
    web3Instance: Web3,
    smartWalletAddress: string
): Promise<boolean> {
    const code = await web3Instance.eth.getCode(smartWalletAddress);
    return code !== '0x00' && code !== '0x';
}

export function getContract(
    web3Instance: Web3,
    contractAbi: AbiItem[],
    contractAddress: string
): Contract {
    return new web3Instance.eth.Contract(contractAbi, contractAddress);
}

export function getContractAddresses(
    chainId: number
): RelayingServicesAddresses {
    const contracts = ContractAddresses[chainId];
    if (!contracts) {
        throw new ContractError(
            `No contracts found for the specified network id ${chainId}.`
        );
    }
    return contracts;
}

export function mergeConfiguration(
    inputConfig: any,
    mergeConfig: any
): Partial<EnvelopingConfig> {
    const mergedConfiguration: any = {};
    // we first put the merge configuration
    Object.keys(mergeConfig).forEach(
        (key) => (mergedConfiguration[key] = mergeConfig[key])
    );
    // we override with the input configuration if any matches the merge
    Object.keys(inputConfig).forEach(
        (key) => (mergedConfiguration[key] = inputConfig[key])
    );
    return mergedConfiguration;
}
export async function getRevertReason(txHash: string) {
    const tx: any = await web3.eth.getTransaction(txHash);
    const txBlockNumber = tx.blockNumber;
    try {
        delete tx['hash'];
        delete tx['blockHash'];
        delete tx['blockNumber'];
        delete tx['transactionIndex'];
        delete tx['v'];
        delete tx['r'];
        delete tx['s'];

        let result: any = await web3.eth.call(tx, txBlockNumber);
        result = result.startsWith('0x') ? result : '0x' + result;
        if (result && result.substr(138)) {
            return web3.utils.toAscii(result.substr(138));
        } else {
            return 'Cannot get reason - No return value';
        }
    } catch (reason) {
        return reason;
    }
}
