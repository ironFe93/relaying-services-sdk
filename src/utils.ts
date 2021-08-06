import { AbiItem } from 'web3-utils';
import { RelayingServicesAddresses } from './interfaces';
import { ContractAddresses } from '@rsksmart/rif-relay-contracts';
import { Contract } from 'web3-eth-contract';

export function getAbiItem(contractAbi: AbiItem[], itemName: string): AbiItem {
    const abiItems = contractAbi.filter((abiItem) => abiItem.name === itemName);
    if (abiItems.length > 0) {
        return abiItems[0];
    }
    throw new Error(`Item ${itemName} doesn't exists on contract abi`);
}

export async function addressHasCode(
    web3: Web3,
    smartWalletAddress: string
): Promise<boolean> {
    const code = await web3.eth.getCode(smartWalletAddress);
    return code !== '0x00' && code !== '0x';
}

export function getContract(
    web3: Web3,
    contractAbi: AbiItem[],
    contractAddress: string
): Contract {
    return new web3.eth.Contract(contractAbi, contractAddress);
}

export function getContractAddresses(
    chainId: number
): RelayingServicesAddresses {
    return ContractAddresses[chainId];
}
