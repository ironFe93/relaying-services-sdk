import { RelayingServices } from './index';
import { Account, TransactionReceipt } from 'web3-core';
import { EnvelopingConfig, Web3Provider } from '@rsksmart/rif-relay-common';
import Web3 from 'web3';
import { RelayGasEstimationOptions, RelayingServicesAddresses, RelayingTransactionOptions, SmartWallet, SmartWalletDeploymentOptions } from './interfaces';
export declare class DefaultRelayingServices implements RelayingServices {
    private readonly web3Instance;
    private readonly account?;
    private developmentAccounts;
    private relayProvider;
    private contracts;
    private contractAddresses;
    private envelopingConfig;
    private txId;
    constructor(web3: Web3 | Web3Provider | string, account?: Account);
    configure(envelopingConfig: Partial<EnvelopingConfig>): Promise<EnvelopingConfig>;
    initialize(envelopingConfig: Partial<EnvelopingConfig>, contractAddresses?: RelayingServicesAddresses, opts?: {
        loglevel: number;
    }): Promise<void>;
    allowToken(tokenAddress: string, account?: string): Promise<string>;
    isAllowedToken(tokenAddress: string): Promise<boolean>;
    getAllowedTokens(): Promise<string[]>;
    claim(commitmentReceipt: any): Promise<void>;
    deploySmartWallet(smartWallet: SmartWallet, options?: SmartWalletDeploymentOptions): Promise<SmartWallet>;
    generateSmartWallet(smartWalletIndex: number): Promise<SmartWallet>;
    isSmartWalletDeployed(smartWalletAddress: string): Promise<boolean>;
    relayTransaction(options: RelayingTransactionOptions): Promise<TransactionReceipt>;
    estimateMaxPossibleRelayGas(options: RelayGasEstimationOptions): Promise<string>;
    estimateMaxPossibleRelayGasWithLinearFit(options: RelayGasEstimationOptions): Promise<string>;
    private calculateCostFromGas;
    private _getAccountAddress;
    private setLogLevel;
}
