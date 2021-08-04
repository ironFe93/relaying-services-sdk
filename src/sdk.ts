import { RelayingServices, SmartWallet } from './index';
import { Transaction, Account } from 'web3-core';
import {
    ContractInteractor,
    EnvelopingConfig,
    Web3Provider
} from '@rsksmart/rif-relay-common';
import { resolveConfiguration } from '@rsksmart/rif-relay-client';
import Web3 from 'web3';
import { ContractAddresses } from '@rsksmart/rif-relay-contracts';

export class DefaultRelayingServicesSDK implements RelayingServices {
    private contractInteractor: ContractInteractor;
    private configuration: EnvelopingConfig;
    private web3Instance: Web3;
    private chainId: number;

    constructor(
        rskHost: string,
        configuration: EnvelopingConfig,
        web3Provider?: Web3Provider,
        chainId?: number
    ) {
        this.configuration = configuration;
        this.web3Instance = web3Provider
            ? new Web3(web3Provider)
            : new Web3(rskHost);
        this.chainId = chainId ?? 33;
        this.initialize()
            .then(() => {
                console.debug('RelayingServicesSDK initialized correctly');
            })
            .catch((error) => {
                console.error('RelayingServicesSDK fail to initialize', error);
            });
    }

    async initialize(): Promise<void> {
        const resolvedConfig = await resolveConfiguration(
            this.web3Instance.currentProvider as Web3Provider,
            {
                verbose: window.location.href.includes('verbose'),
                onlyPreferredRelays: true,
                preferredRelays: this.configuration.preferredRelays,
                factory: ContractAddresses[this.chainId].smartWalletFactory,
                gasPriceFactorPercent: 0,
                relayLookupWindowBlocks: 1e5,
                chainId: this.chainId,
                relayVerifierAddress:
                    ContractAddresses[this.chainId].smartWalletRelayVerifier,
                deployVerifierAddress:
                    ContractAddresses[this.chainId].smartWalletDeployVerifier,
                smartWalletFactoryAddress:
                    ContractAddresses[this.chainId].smartWalletFactory
            }
        );
        resolvedConfig.relayHubAddress =
            ContractAddresses[this.chainId].relayHub;
        this.contractInteractor = new ContractInteractor(
            this.web3Instance.currentProvider as Web3Provider,
            this.configuration
        );
    }

    async allowToken(
        tokenAddress: string,
        contractsOwnerAccount: Account
    ): Promise<void> {
        console.debug('allowToken Params', {
            tokenAddress,
            contractsOwnerAccount
        });
    }

    async claim(commitmentReceipt: any): Promise<void> {
        console.debug('claim Params', {
            commitmentReceipt
        });
        throw new Error(
            'NOT IMPLEMENTED: this will be available with arbiter integration.'
        );
    }

    async deploySmartWallet(
        smartWallet: SmartWallet,
        tokenAddress?: string,
        tokenAmount?: number
    ): Promise<string> {
        console.debug('deploySmartWallet Params', {
            smartWallet,
            tokenAddress,
            tokenAmount
        });
        throw new Error('NOT IMPLEMENTED');
    }

    async generateSmartWallet(smartWalletIndex: number): Promise<SmartWallet> {
        console.debug('generateSmartWallet Params', {
            smartWalletIndex
        });
        throw new Error('NOT IMPLEMENTED');
    }

    async getAllowedTokens(): Promise<string[]> {
        throw new Error('NOT IMPLEMENTED');
    }

    async isAllowedToken(tokenAddress: string): Promise<boolean> {
        console.debug('isAllowedToken Params', {
            tokenAddress
        });
        throw new Error('NOT IMPLEMENTED');
    }

    async isSmartWalletDeployed(smartWalletAddress: string): Promise<boolean> {
        console.debug('isSmartWalletDeployed Params', {
            smartWalletAddress
        });
        throw new Error('NOT IMPLEMENTED');
    }

    async relayTransaction(
        unsignedTx: Transaction,
        smartWallet: SmartWallet,
        tokenAmount?: number
    ): Promise<string> {
        console.debug('relayTransaction Params', {
            unsignedTx,
            smartWallet,
            tokenAmount
        });
        throw new Error('NOT IMPLEMENTED');
    }
}
