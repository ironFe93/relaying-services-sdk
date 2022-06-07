import { Account, TransactionConfig } from 'web3-core';
import { EnvelopingConfig, EnvelopingTransactionDetails, Web3Provider } from '@rsksmart/rif-relay-common';

export interface SmartWalletAddress {
    index: number;
    address: string;
}

export interface SmartWallet extends SmartWalletAddress{
    deployTransaction: string;
    tokenAddress: string;
}

export interface SmartWalletDeploymentOptions {
    tokenAddress?: string,
    tokenAmount?: number
    recovererAddress?: string,
    onlyPreferredRelays?: boolean,
    callVerifier?: string,
    callForwarder?: string,
}

export interface RelayingServicesConfiguration {
    rskHost: string;
    envelopingConfig: Partial<EnvelopingConfig>;
    web3Instance?: Web3;
    web3Provider?: Web3Provider;
    account?: Account;
    contractAddresses?: RelayingServicesAddresses;
}

export interface RelayingServicesAddresses {
    penalizer: string;
    relayHub: string;
    smartWallet: string;
    smartWalletFactory: string;
    smartWalletDeployVerifier: string;
    smartWalletRelayVerifier: string;
    customSmartWallet: string;
    customSmartWalletFactory: string;
    customSmartWalletDeployVerifier: string;
    customSmartWalletRelayVerifier: string;
    sampleRecipient: string;
    testToken: string;
}

export interface RelayingTransactionOptions {
    unsignedTx: TransactionConfig,
    smartWallet: SmartWallet,
    tokenAmount?: number,
    transactionDetails?: Partial<EnvelopingTransactionDetails>,
    value?: number,
    onlyPreferredRelays?: boolean
}

export interface RelayGasEstimationOptions {
    destinationContract: string,
    smartWalletAddress: string,
    tokenFees: string,
    abiEncodedTx: string,
    relayWorker: string
}