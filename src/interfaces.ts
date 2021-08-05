import { Account, TransactionReceipt } from 'web3-core';
import { EnvelopingConfig, Web3Provider } from '@rsksmart/rif-relay-common';

export interface SmartWallet {
    index: number;
    address: string;
    deployed: boolean;
    deployTransaction?: TransactionReceipt;
    tokenAddress?: string;
}

export interface RelayingServicesConfiguration {
    rskHost: string;
    envelopingConfig: EnvelopingConfig;
    web3Provider?: Web3Provider;
    chainId?: string;
    account?: Account;
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
