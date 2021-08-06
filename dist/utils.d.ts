/// <reference types="@openeth/truffle-typings" />
import { AbiItem } from 'web3-utils';
import { RelayingServicesAddresses } from './interfaces';
import { Contract } from 'web3-eth-contract';
export declare function getAbiItem(contractAbi: AbiItem[], itemName: string): AbiItem;
export declare function addressHasCode(web3: Web3, smartWalletAddress: string): Promise<boolean>;
export declare function getContract(web3: Web3, contractAbi: AbiItem[], contractAddress: string): Contract;
export declare function getContractAddresses(chainId: string): RelayingServicesAddresses;
