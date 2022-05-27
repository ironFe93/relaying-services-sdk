import { Account } from 'web3-core';
import { EnvelopingConfig, Web3Provider } from '@rsksmart/rif-relay-common';

export interface SmartWalletContract {
    index: number;
    address: string;
}

export interface SmartWallet {
    contract: SmartWalletContract
    deployTransaction: string;
    tokenAddress: string;
}

export interface SmartWalletDeploymentOptions {
    tokenAddress?: string,
    tokenAmount?: number
    recovererAddress?: string,
    onlyPreferredRelays?: boolean,
    
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