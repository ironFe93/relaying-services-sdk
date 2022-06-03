import { RelayingServices } from './index';
import { Account, HttpProvider, TransactionReceipt } from 'web3-core';
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
import { addressHasCode, getRevertReason, mergeConfiguration } from './utils';
import { ZERO_ADDRESS } from './constants';
import {
    RelayGasEstimationOptions,
    RelayingServicesAddresses,
    RelayingTransactionOptions,
    SmartWallet,
    SmartWalletAddress,
    SmartWalletDeploymentOptions
} from './interfaces';
import { Contracts } from './contracts';
import { toBN, toHex } from 'web3-utils';
import log, { LogLevelNumbers } from 'loglevel';

export class DefaultRelayingServices implements RelayingServices {
    private readonly web3Instance: Web3;
    private readonly account?: Account;
    private developmentAccounts: string[]; //code should be the same for develop and prod
    private relayProvider: RelayProvider;
    private contracts: Contracts;
    private contractAddresses: RelayingServicesAddresses;
    private envelopingConfig: EnvelopingConfig;

    private txId = 777;

    constructor(web3: Web3 | Web3Provider | string, account?: Account) {
        this.web3Instance = web3 instanceof Web3 ? web3 : new Web3(web3);
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
            log.log(error);
        }
    }

    async initialize(
        envelopingConfig: Partial<EnvelopingConfig>,
        contractAddresses?: RelayingServicesAddresses
    ): Promise<void> {
        try {
            this.setLogLevel();
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
            log.debug('RelayingServicesSDK initialized correctly');
        } catch (error) {
            log.error('RelayingServicesSDK fail to initialize', error);
        }
    }

    async allowToken(tokenAddress: string, account?: string): Promise<string> {
        log.debug('allowToken Params', {
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
            log.info(acceptToken);
            await acceptToken.send({ from: account });

            await smartWalletRelayVerifier.methods
                .acceptToken(tokenAddress)
                .send({ from: account });
        } catch (error: any) {
            log.error(error);
            const reason = await getRevertReason(error.receipt.transactionHash);
            log.error(
                'Error adding token with address ' +
                    tokenAddress +
                    ' to allowed tokens on smart wallet deploy verifier',
                reason
            );
            throw error;
        }
        log.debug('Tokens allowed successfully!');
        return tokenAddress;
    }

    async isAllowedToken(tokenAddress: string): Promise<boolean> {
        log.debug('isAllowedToken Params', {
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
        log.debug('claim Params', {
            commitmentReceipt
        });
        throw new Error(
            'NOT IMPLEMENTED: this will be available with arbiter integration.'
        );
    }

    async deploySmartWallet(
        walletAddress: SmartWalletAddress,
        options?: SmartWalletDeploymentOptions
    ): Promise<SmartWallet> {
        log.debug('deploySmartWallet Params', {
            walletAddress,
            options
        });
        const { address, index } = walletAddress;
        const {
            tokenAddress,
            tokenAmount,
            recovererAddress,
            onlyPreferredRelays,
            callVerifier,
            callForwarder
        } = options;

        log.debug('Checking if the wallet already exists');
        const isSmartWalletDeployed = await this.isSmartWalletDeployed(address);

        if (isSmartWalletDeployed) {
            throw new Error('Smart Wallet already deployed');
        }

        log.debug('Deploying smart wallet for address', address);

        const txDetails: EnvelopingTransactionDetails = {
            from: this._getAccountAddress(),
            to: ZERO_ADDRESS,
            callVerifier:
                callVerifier ??
                this.contracts.addresses.smartWalletDeployVerifier,
            callForwarder:
                callForwarder ?? this.contracts.addresses.smartWalletFactory,
            tokenContract: tokenAddress ?? ZERO_ADDRESS,
            tokenAmount: tokenAmount ? tokenAmount.toString() : '0',
            data: '0x',
            index: index.toString(),
            recoverer: recovererAddress ?? ZERO_ADDRESS,
            isSmartWalletDeploy: true,
            onlyPreferredRelays: onlyPreferredRelays || true,
            smartWalletAddress: address
        };

        const transactionHash = await this.relayProvider.deploySmartWallet(
            txDetails
        );

        log.debug('Smart wallet successfully deployed', transactionHash);

        return {
            deployTransaction: transactionHash,
            tokenAddress,
            address,
            index
        };
    }

    async generateSmartWallet(
        smartWalletIndex: number
    ): Promise<SmartWalletAddress> {
        log.debug('generateSmartWallet Params', {
            smartWalletIndex
        });

        log.debug('Generating computed address for smart wallet');

        const smartWalletFactory = this.contracts.getSmartWalletFactory();

        const smartWalletAddress = await smartWalletFactory.methods
            .getSmartWalletAddress(
                this._getAccountAddress(),
                ZERO_ADDRESS,
                smartWalletIndex
            )
            .call();

        return {
            address: smartWalletAddress,
            index: smartWalletIndex
        };
    }

    isSmartWalletDeployed(smartWalletAddress: string): Promise<boolean> {
        log.debug('isSmartWalletDeployed Params', {
            smartWalletAddress
        });
        return addressHasCode(this.web3Instance, smartWalletAddress);
    }

    // TODO: we may want to change this method signature to use one single object to have a more flexible signature.
    async relayTransaction(
        options: RelayingTransactionOptions
    ): Promise<TransactionReceipt> {
        log.debug('relayTransaction Params', {
            options
        });

        const {
            unsignedTx,
            smartWallet,
            tokenAmount,
            transactionDetails,
            value,
            onlyPreferredRelays
        } = options;

        log.debug('Checking if the wallet exists');

        const { address } = smartWallet;

        if (!(await addressHasCode(this.web3Instance, address))) {
            throw new Error(
                `Smart Wallet is not deployed or the address ${address} is not a smart wallet.`
            );
        }

        const jsonRpcPayload = {
            jsonrpc: '2.0',
            id: ++this.txId,
            method: 'eth_sendTransaction',
            params: [
                {
                    from: this._getAccountAddress(),
                    to: smartWallet.tokenAddress,
                    value: value ? value.toString() : '0',
                    relayHub: this.contracts.addresses.relayHub,
                    callVerifier:
                        this.contracts.addresses.smartWalletRelayVerifier,
                    callForwarder: address,
                    data: unsignedTx.data,
                    tokenContract: smartWallet.tokenAddress,
                    tokenAmount: await this.web3Instance.utils.toWei(
                        tokenAmount ? tokenAmount.toString() : '0'
                    ),
                    onlyPreferredRelays: onlyPreferredRelays ?? true,
                    ...transactionDetails
                }
            ]
        };

        //we should return the transaction hash. let the user decide to wait.
        const transactionReceipt: TransactionReceipt = await new Promise(
            (resolve, reject) => {
                this.relayProvider._ethSendTransaction(
                    jsonRpcPayload,
                    async (error: Error, jsonrpc: any) => {
                        if (error) {
                            reject(error);
                        }
                        const recipient = await web3.eth.getTransactionReceipt(
                            jsonrpc.result
                        );
                        resolve(recipient);
                    }
                );
            }
        );

        if (!transactionReceipt.status) {
            const errorMessage = 'Error relaying transaction';
            log.debug(errorMessage, transactionReceipt);
            throw new Error(errorMessage);
        }
        return transactionReceipt;
    }

    async estimateMaxPossibleRelayGas(
        trxDetails: EnvelopingTransactionDetails,
        relayWorker: string
    ) {
        const relayClient = this.relayProvider.relayClient;

        const txDetailsClone = {
            ...trxDetails
        };

        const internalCallCost = await relayClient.getInternalCallCost(
            relayClient.getEstimateGasParams(txDetailsClone)
        );
        txDetailsClone.gas = toHex(internalCallCost);

        const tokenGas = (
            await relayClient.estimateTokenTransferGas(
                txDetailsClone,
                relayWorker
            )
        ).toString();
        txDetailsClone.tokenGas = tokenGas;
        const maxPossibleGasValue =
            await relayClient.estimateMaxPossibleRelayGas(
                txDetailsClone,
                relayWorker
            );
        return maxPossibleGasValue;
    }

    async estimateMaxPossibleRelayGasWithLinearFit(
        options: RelayGasEstimationOptions
    ): Promise<string> {
        log.debug('estimateMaxPossibleRelayGasWithLinearFit Params', options);

        const {
            destinationContract,
            smartWalletAddress,
            tokenFees,
            abiEncodedTx,
            relayWorker
        } = options;

        const gasPrice = toBN(
            await this.relayProvider.relayClient._calculateGasPrice()
        );
        const tokenAmount = await this.web3Instance.utils.toWei(tokenFees);
        const trxDetails: EnvelopingTransactionDetails = {
            from: this._getAccountAddress(),
            to: destinationContract,
            value: '0',
            relayHub: this.contracts.addresses.relayHub,
            callVerifier: this.contracts.addresses.smartWalletRelayVerifier,
            callForwarder: smartWalletAddress,
            data: abiEncodedTx,
            tokenContract: this.contracts.addresses.testToken,
            tokenAmount: tokenAmount.toString(),
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

    private setLogLevel() {
        const level = Number.parseInt(process.env.LOG_LEVEL) as LogLevelNumbers;
        if (level > 5 || level < 0) {
            console.log('Unknown log level specified, using default log level');
            return;
        }
        log.setLevel(level);
    }
}
