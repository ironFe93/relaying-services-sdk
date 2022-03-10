/// <reference types="@openeth/truffle-typings" />
import { AbiItem } from 'web3-utils';
import { RelayingServicesAddresses } from './interfaces';
import { Contract } from 'web3-eth-contract';
import { EnvelopingConfig } from '@rsksmart/rif-relay-common';
export declare function getAbiItem(contractAbi: AbiItem[], itemName: string): AbiItem;
export declare function addressHasCode(web3Instance: Web3, smartWalletAddress: string): Promise<boolean>;
export declare function getContract(web3Instance: Web3, contractAbi: AbiItem[], contractAddress: string): Contract;
export declare function getContractAddresses(chainId: number): RelayingServicesAddresses;
export declare function mergeConfiguration(inputConfig: any, mergeConfig: any): Partial<EnvelopingConfig>;
export declare function getRevertReason(txHash: string): Promise<unknown>;
