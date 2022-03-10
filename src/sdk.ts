import { RelayingServices } from './index';
import {
    Account,
    HttpProvider,
    TransactionConfig,
    TransactionReceipt
} from 'web3-core';
import {
    EnvelopingConfig,
    EnvelopingTransactionDetails,
    Web3Provider
} from '@rsksmart/rif-relay-common';
import {
    RelayProvider,
    resolveConfiguration
} from '@rsksmart/rif-relay-client';
import Web3 from 'web3';
import { DeployVerifier, RelayVerifier } from '@rsksmart/rif-relay-contracts';
import {
    addressHasCode,
    getContract,
    getRevertReason,
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
import { toBN } from 'web3-utils';

export class DefaultRelayingServices implements RelayingServices {
    protected readonly web3Instance: Web3;
    private readonly account?: Account;
    private developmentAccounts: string[];
    protected relayProvider: RelayProvider;
    protected contracts: Contracts;
    protected contractAddresses: RelayingServicesAddresses;
    protected envelopingConfig: EnvelopingConfig;

    private txId = 777;

    // TODO: Change constructor to receive web3Instance | webProvider | rskHost
    // we don't need the configuration here
    constructor({
        rskHost,
        account,
        web3Provider,
        web3Instance
    }: RelayingServicesConfiguration) {
        this.web3Instance = web3Instance
            ? web3Instance
            : web3Provider
            ? // TODO: remove any
              new Web3(web3Provider as any)
            : new Web3(rskHost);
        this.account = account;
    }

    async configure(
        envelopingConfig: Partial<EnvelopingConfig>
    ): Promise<EnvelopingConfig> {
        try {
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
            const { relayHubAddress, ...newPartialConfig } = partialConfig;
            const resolvedConfig: EnvelopingConfig = await resolveConfiguration(
                this.web3Instance.currentProvider as Web3Provider,
                newPartialConfig
            );
            resolvedConfig.relayHubAddress =
                relayHubAddress ?? this.contracts.addresses.relayHub;
            return resolvedConfig;
        } catch (error) {
            console.log(error);
        }
    }

    async initialize(
        envelopingConfig: Partial<EnvelopingConfig>,
        contractAddresses?: RelayingServicesAddresses
    ): Promise<void> {
        try {
            this.contracts = new Contracts(
                this.web3Instance,
                await this.web3Instance.eth.getChainId(),
                contractAddresses
            );
            this.developmentAccounts =
                await this.web3Instance.eth.getAccounts();
            const configuation = await this.configure(envelopingConfig);
            const provider = new RelayProvider(
                this.web3Instance.currentProvider as HttpProvider,
                configuation
            );
            await provider.relayClient._init();

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
            console.debug('RelayingServicesSDK initialized correctly');
        } catch (error) {
            console.error('RelayingServicesSDK fail to initialize', error);
        }
    }

    async allowToken(tokenAddress: string, account?: string): Promise<string> {
        console.debug('allowToken Params', {
            tokenAddress,
            account
        });
        if (!account) {
            account = this._getAccountAddress();
        }

        const smartWalletDeployVerifier =
            await new this.web3Instance.eth.Contract(
                DeployVerifier.abi,
                this.contracts.addresses.smartWalletDeployVerifier
            );
        const smartWalletRelayVerifier =
            await new this.web3Instance.eth.Contract(
                RelayVerifier.abi,
                this.contracts.addresses.smartWalletRelayVerifier
            );

        try {
            const acceptToken =
                smartWalletDeployVerifier.methods.acceptToken(tokenAddress);
            console.log(acceptToken);
            await acceptToken.send({ from: account });
        } catch (error: any) {
            console.log('Error');
            console.log(error);
            const reason = await getRevertReason(error.receipt.transactionHash);
            console.error(
                'Error adding token with address ' +
                    tokenAddress +
                    ' to allowed tokens on smart wallet deploy verifier',
                reason
            );
            throw error;
        }
        try {
            await smartWalletRelayVerifier.methods
                .acceptToken(tokenAddress)
                .send({ from: account });
        } catch (error: any) {
            console.log(error);
            const reason = await getRevertReason(error.receipt.transactionHash);
            console.error(
                'Error adding token with address ' +
                    tokenAddress +
                    ' to allowed tokens on smart wallet relay verifier',
                reason
            );
            throw error;
        }
        console.debug('Tokens allowed successfully!');
        return tokenAddress;
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
        tokenAmount = tokenAmount ?? 0;
        console.debug('Checking if the wallet already exists');
        const smartWalletDeployed = await addressHasCode(
            this.web3Instance,
            smartWallet.address
        );

        if (!smartWalletDeployed) {
            if (tokenAddress) {
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
            }

            console.debug(
                'Deploying smart wallet for address',
                smartWallet.address
            );
            const txDetails = <EnvelopingTransactionDetails>{
                from: this._getAccountAddress(),
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
            };

            const transactionHash = await this.relayProvider.deploySmartWallet(
                txDetails
            );

            console.debug(
                'Smart wallet successfully deployed',
                transactionHash
            );

            smartWallet.deployTransaction = transactionHash;
            smartWallet.deployed = true;
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

        const smartWalletAddress = await smartWalletFactory.methods
            .getSmartWalletAddress(
                this._getAccountAddress(),
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

    async isSmartWalletDeployed(smartWalletAddress: string): Promise<boolean> {
        console.debug('isSmartWalletDeployed Params', {
            smartWalletAddress
        });
        return await addressHasCode(this.web3Instance, smartWalletAddress);
    }

    // TODO: we may want to change this method signature to use one single object to have a more flexible signature.
    async relayTransaction(
        unsignedTx: TransactionConfig,
        smartWallet: SmartWallet,
        tokenAmount?: number,
        transactionDetails?: Partial<EnvelopingTransactionDetails>
    ): Promise<TransactionReceipt> {
        console.debug('relayTransaction Params', {
            unsignedTx,
            smartWallet,
            tokenAmount,
            transactionDetails
        });
        console.debug('Checking if the wallet exists');
        if (await addressHasCode(this.web3Instance, smartWallet.address)) {
            const jsonRpcPayload = {
                jsonrpc: '2.0',
                id: ++this.txId,
                method: 'eth_sendTransaction',
                params: [
                    {
                        from: this._getAccountAddress(),
                        to: smartWallet.tokenAddress,
                        value: '0',
                        relayHub: this.contracts.addresses.relayHub,
                        callVerifier:
                            this.contracts.addresses.smartWalletRelayVerifier,
                        callForwarder: smartWallet.address,
                        data: unsignedTx.data,
                        tokenContract: smartWallet.tokenAddress,
                        tokenAmount: await this.web3Instance.utils.toWei(
                            tokenAmount.toString()
                        ),
                        onlyPreferredRelays: true,
                        ...transactionDetails
                    }
                ]
            };
            const transactionReceipt: TransactionReceipt = await new Promise(
                (resolve, reject) => {
                    this.relayProvider._ethSendTransaction(
                        jsonRpcPayload,
                        async (error: Error, jsonrpc: any) => {
                            if (error) {
                                reject(error);
                            }
                            const recipient =
                                await web3.eth.getTransactionReceipt(
                                    jsonrpc.result
                                );
                            resolve(recipient);
                        }
                    );
                }
            );

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

    async estimateMaxPossibleRelayGas(
        smartWallet: SmartWallet,
        relayWorker: string
    ): Promise<string> {
        console.debug('estimateMaxPossibleRelayGas Params', {
            smartWallet
        });
        const gasPrice = toBN(
            await this.relayProvider.relayClient._calculateGasPrice()
        );
        const tokenAmount = await this.web3Instance.utils.toWei('1');

        const trxDetails: EnvelopingTransactionDetails = {
            from: this._getAccountAddress(),
            to: ZERO_ADDRESS.toString(),
            value: '0',
            relayHub: this.contracts.addresses.relayHub,
            callVerifier: this.contracts.addresses.smartWalletRelayVerifier,
            callForwarder: this.contracts.addresses.smartWalletFactory,
            data: '0x',
            index: smartWallet.index.toString(),
            tokenContract: this.contracts.addresses.testToken,
            tokenAmount: tokenAmount,
            onlyPreferredRelays: true,
            isSmartWalletDeploy: true,
            smartWalletAddress: smartWallet.address,
            recoverer: ZERO_ADDRESS.toString()
        };
        const maxPossibleGasValue =
            await this.relayProvider.relayClient.estimateMaxPossibleRelayGas(
                trxDetails,
                relayWorker
            );
        const maxPossibleGas = toBN(maxPossibleGasValue);
        const estimate = maxPossibleGas.mul(gasPrice);
        return estimate.toString();
    }

    async estimateMaxPossibleRelayGasWithLinearFit(
        destinationContract: string,
        smartWalletAddress: string,
        tokenFees: string,
        abiEncodedTx: string,
        relayWorker: string
    ): Promise<string> {
        console.debug('estimateMaxPossibleRelayGasWithLinearFit Params', {
            destinationContract,
            smartWalletAddress,
            tokenFees,
            abiEncodedTx,
            relayWorker
        });

        const gasPrice = toBN(
            await this.relayProvider.relayClient._calculateGasPrice()
        );
        const tokenAmount = await this.web3Instance.utils.toWei(tokenFees);
        const trxDetails = {
            from: this._getAccountAddress(),
            to: destinationContract,
            value: '0',
            relayHub: this.contracts.addresses.relayHub,
            callVerifier: this.contracts.addresses.smartWalletRelayVerifier,
            callForwarder: smartWalletAddress,
            data: abiEncodedTx,
            tokenContract: this.contracts.addresses.testToken,
            tokenAmount: tokenAmount,
            onlyPreferredRelays: true
        };

        const maxPossibleGasValue =
            await this.relayProvider.relayClient.estimateMaxPossibleRelayGasWithLinearFit(
                trxDetails,
                relayWorker
            );
        const maxPossibleGas = toBN(maxPossibleGasValue);
        const estimate = maxPossibleGas.mul(gasPrice);
        return estimate.toString();
    }

    private _getAccountAddress(): string {
        return this.account
            ? this.account.address
            : this.developmentAccounts[0];
    }
}
