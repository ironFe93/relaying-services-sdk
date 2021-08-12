import { RelayingServices } from './index';
import { Account, Transaction, TransactionReceipt } from 'web3-core';
import { EnvelopingConfig } from '@rsksmart/rif-relay-common';
import { RelayingServicesConfiguration, SmartWallet } from './interfaces';
export declare class DefaultRelayingServices implements RelayingServices {
    private readonly web3Instance;
    private readonly account?;
    private developmentAccounts;
    private relayProvider;
    private contracts;
    constructor({ rskHost, account, envelopingConfig, web3Provider }: RelayingServicesConfiguration);
    configure(envelopingConfig: Partial<EnvelopingConfig>): Promise<EnvelopingConfig>;
    initialize(envelopingConfig: Partial<EnvelopingConfig>): Promise<void>;
    allowToken(tokenAddress: string, contractsOwnerAccount: Account): Promise<void>;
    claim(commitmentReceipt: any): Promise<void>;
    deploySmartWallet(smartWallet: SmartWallet, tokenAddress?: string, tokenAmount?: number): Promise<SmartWallet>;
    generateSmartWallet(smartWalletIndex: number): Promise<SmartWallet>;
    getAllowedTokens(): Promise<string[]>;
    isAllowedToken(tokenAddress: string): Promise<boolean>;
    isSmartWalletDeployed(smartWalletAddress: string): Promise<boolean>;
    relayTransaction(unsignedTx: Transaction, smartWallet: SmartWallet, tokenAmount?: number): Promise<TransactionReceipt>;
    getAccountAddress(): string;
}
