import { RelayingServices } from './index';
import {
    Account,
    HttpProvider,
    SignedTransaction,
    Transaction,
    TransactionConfig,
    TransactionReceipt
} from 'web3-core';
import { EnvelopingConfig, Web3Provider } from '@rsksmart/rif-relay-common';
import {
    RelayProvider,
    resolveConfiguration
} from '@rsksmart/rif-relay-client';
import Web3 from 'web3';
import { RelayVerifier } from '@rsksmart/rif-relay-contracts';
import {
    addressHasCode,
    getAbiItem,
    getContract,
    mergeConfiguration
} from './utils';
import { ERC20Token } from './ERC20Token';
import { ZERO_ADDRESS } from './constants';
import {
    RelayingServicesAddresses,
    RelayingServicesConfiguration,
    SmartWallet
} from './interfaces';
import { Contracts } from './contracts';

export class DefaultRelayingServices implements RelayingServices {
    protected readonly web3Instance: Web3;
    protected readonly account?: Account;
    protected developmentAccounts: string[];
    protected relayProvider: RelayProvider;
    protected contracts: Contracts;

    constructor({
        rskHost,
        account,
        envelopingConfig,
        web3Provider,
        contractAddresses,
        web3Instance
    }: RelayingServicesConfiguration) {
        this.web3Instance = web3Instance
            ? web3Instance
            : web3Provider
            ? new Web3(web3Provider as any)
            : new Web3(rskHost);
        this.account = account;
        this.initialize(envelopingConfig, contractAddresses)
            .then(() => {
                console.debug('RelayingServicesSDK initialized correctly');
            })
            .catch((error) => {
                console.error('RelayingServicesSDK fail to initialize', error);
            });
    }

    async configure(
        envelopingConfig: Partial<EnvelopingConfig>
    ): Promise<EnvelopingConfig> {
        const partialConfig: Partial<EnvelopingConfig> = mergeConfiguration(
            envelopingConfig,
            {
                onlyPreferredRelays: true,
                preferredRelays: ['http://localhost:8090'],
                gasPriceFactorPercent: 0,
                relayLookupWindowBlocks: 1e5,
                chainId: await this.web3Instance.eth.getChainId(),
                relayVerifierAddress:
                    this.contracts.addresses.smartWalletRelayVerifier,
                deployVerifierAddress:
                    this.contracts.addresses.smartWalletDeployVerifier,
                smartWalletFactoryAddress:
                    this.contracts.addresses.smartWalletFactory
            }
        );
        const resolvedConfig: EnvelopingConfig = await resolveConfiguration(
            this.web3Instance.currentProvider as Web3Provider,
            partialConfig
        );
        resolvedConfig.relayHubAddress =
            envelopingConfig.relayHubAddress ??
            this.contracts.addresses.relayHub;
        return resolvedConfig;
    }

    async initialize(
        envelopingConfig: Partial<EnvelopingConfig>,
        contractAddresses?: RelayingServicesAddresses
    ): Promise<void> {
        this.developmentAccounts = await this.web3Instance.eth.getAccounts();
        const provider = new RelayProvider(
            this.web3Instance.currentProvider as HttpProvider,
            await this.configure(envelopingConfig)
        );
        if (this.account) {
            provider.addAccount({
                address: this.account.address,
                privateKey: Buffer.from(
                    this.account.privateKey.replaceAll('0x', ''),
                    'hex'
                )
            });
        }
        this.web3Instance.setProvider(provider);
        this.relayProvider = provider;
        this.contracts = new Contracts(
            this.web3Instance,
            await this.web3Instance.eth.getChainId(),
            contractAddresses
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
        const abiMethod = getAbiItem(RelayVerifier.abi, 'acceptToken');
        const encodedCall = this.web3Instance.eth.abi.encodeFunctionCall(
            abiMethod,
            [tokenAddress]
        );
        const transactionConfig: TransactionConfig = {
            from: contractsOwnerAccount.address,
            to: this.contracts.addresses.smartWalletRelayVerifier,
            data: encodedCall
        };
        const signedTransaction: SignedTransaction =
            await contractsOwnerAccount.signTransaction(transactionConfig);
        const transactionReceipt: TransactionReceipt =
            await this.web3Instance.eth.sendSignedTransaction(
                signedTransaction.rawTransaction
            );
        if (!transactionReceipt.status) {
            const errorMessage = 'Error sending allowToken transaction';
            console.debug(errorMessage, transactionReceipt);
            throw new Error(errorMessage);
        }
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
    ): Promise<SmartWallet> {
        console.debug('deploySmartWallet Params', {
            smartWallet,
            tokenAddress,
            tokenAmount
        });

        console.debug('Checking if the wallet already exists');

        if (!(await addressHasCode(this.web3Instance, smartWallet.address))) {
            const token = getContract(
                this.web3Instance,
                ERC20Token.getAbi(),
                tokenAddress
            );

            const balance = await token.methods
                .balanceOf(smartWallet.address)
                .call();

            if (balance <= 0) {
                console.warn(
                    "Smart Wallet doesn't have funds so this will be a subsidized deploy."
                );
            }

            console.debug(
                'Deploying smart wallet for address',
                smartWallet.address
            );

            const transactionHash = await this.relayProvider.deploySmartWallet({
                from: this.getAccountAddress(),
                to: ZERO_ADDRESS,
                callVerifier:
                    this.contracts.addresses.smartWalletDeployVerifier,
                callForwarder: this.contracts.addresses.smartWalletFactory,
                tokenContract: tokenAddress,
                tokenAmount: tokenAmount.toString(),
                data: '0x',
                index: smartWallet.index.toString(),
                recoverer: ZERO_ADDRESS,
                isSmartWalletDeploy: true,
                onlyPreferredRelays: true,
                smartWalletAddress: smartWallet.address
            });

            console.debug(
                'Smart wallet successfully deployed',
                transactionHash
            );

            smartWallet.deployTransaction =
                await this.web3Instance.eth.getTransactionReceipt(
                    transactionHash
                );
            smartWallet.deployed = smartWallet.deployTransaction.status;
            smartWallet.tokenAddress = tokenAddress;
            return smartWallet;
        } else {
            throw new Error('Smart Wallet already deployed');
        }
    }

    async generateSmartWallet(smartWalletIndex: number): Promise<SmartWallet> {
        console.debug('generateSmartWallet Params', {
            smartWalletIndex
        });

        console.debug('Generating computed address for smart wallet');

        const smartWalletFactory = this.contracts.getSmartWalletFactory();

        const smartWalletAddress = smartWalletFactory.methods
            .getSmartWalletAddress(
                this.getAccountAddress(),
                ZERO_ADDRESS,
                smartWalletIndex
            )
            .call();

        console.debug('Checking if the wallet already exists');

        const deployed = await addressHasCode(
            this.web3Instance,
            smartWalletAddress
        );

        return {
            address: smartWalletAddress,
            index: smartWalletIndex,
            deployed
        };
    }

    async getAllowedTokens(): Promise<string[]> {
        const relayVerifierContract =
            this.contracts.getSmartWalletRelayVerifier();
        const deployVerifierContract =
            this.contracts.getSmartWalletDeployVerifier();
        const relayVerifierTokens: string[] =
            await relayVerifierContract.methods.getAcceptedTokens().call();
        const deployVerifierTokens: string[] =
            await deployVerifierContract.methods.getAcceptedTokens().call();
        const tokens = new Set<string>([
            ...relayVerifierTokens,
            ...deployVerifierTokens
        ]);
        return [...tokens];
    }

    async isAllowedToken(tokenAddress: string): Promise<boolean> {
        console.debug('isAllowedToken Params', {
            tokenAddress
        });
        const relayVerifierContract =
            this.contracts.getSmartWalletRelayVerifier();
        const deployVerifierContract =
            this.contracts.getSmartWalletDeployVerifier();
        const relayVerifierAllowsToken: boolean =
            await relayVerifierContract.methods
                .acceptsToken(tokenAddress)
                .call();
        const deployVerifierAllowsToken: boolean =
            await deployVerifierContract.methods
                .acceptsToken(tokenAddress)
                .call();
        return relayVerifierAllowsToken && deployVerifierAllowsToken;
    }

    async isSmartWalletDeployed(smartWalletAddress: string): Promise<boolean> {
        console.debug('isSmartWalletDeployed Params', {
            smartWalletAddress
        });
        return await addressHasCode(this.web3Instance, smartWalletAddress);
    }

    async relayTransaction(
        unsignedTx: Transaction,
        smartWallet: SmartWallet,
        tokenAmount?: number
    ): Promise<TransactionReceipt> {
        console.debug('relayTransaction Params', {
            unsignedTx,
            smartWallet,
            tokenAmount
        });
        console.debug('Checking if the wallet exists');
        if (await addressHasCode(this.web3Instance, smartWallet.address)) {
            const transactionReceipt =
                (await this.web3Instance.eth.sendTransaction({
                    from: this.getAccountAddress(),
                    callVerifier:
                        this.contracts.addresses.smartWalletRelayVerifier,
                    callForwarder: smartWallet.address,
                    isSmartWalletDeploy: false,
                    onlyPreferredRelays: true,
                    tokenAmount,
                    tokenContract: smartWallet.tokenAddress,
                    ...unsignedTx
                } as TransactionConfig)) as TransactionReceipt;
            if (!transactionReceipt.status) {
                const errorMessage = 'Error relaying transaction';
                console.debug(errorMessage, transactionReceipt);
                throw new Error(errorMessage);
            }
            return transactionReceipt;
        }
        throw new Error(
            `Smart Wallet is not deployed or the address ${smartWallet.address} is not a smart wallet.`
        );
    }

    getAccountAddress(): string {
        return this.account
            ? this.account.address
            : this.developmentAccounts[0];
    }
}
