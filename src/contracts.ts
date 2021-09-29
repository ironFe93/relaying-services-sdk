import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { RelayingServicesAddresses } from './interfaces';
import { getContract, getContractAddresses, mergeConfiguration } from './utils';
import {
    DeployVerifier,
    RelayVerifier,
    SmartWalletFactory
} from '@rsksmart/rif-relay-contracts';

export class Contracts {
    protected web3Instance: Web3;
    public addresses: RelayingServicesAddresses;
    protected smartWalletFactory: Contract;
    protected smartWalletRelayVerifier: Contract;
    protected smartWalletDeployVerifier: Contract;

    constructor(
        web3Instance: Web3,
        chainId: number,
        contractAddresses?: RelayingServicesAddresses
    ) {
        this.web3Instance = web3Instance;
        contractAddresses = contractAddresses ?? <RelayingServicesAddresses>{};
        const contracts: RelayingServicesAddresses =
            getContractAddresses(chainId);
        this.addresses = <RelayingServicesAddresses>(
            mergeConfiguration(contractAddresses, contracts)
        );
        this.initialize();
    }

    protected initialize(): void {
        try {
            this.smartWalletRelayVerifier = getContract(
                this.web3Instance,
                RelayVerifier.abi,
                this.addresses.smartWalletRelayVerifier
            );
            this.smartWalletDeployVerifier = getContract(
                this.web3Instance,
                DeployVerifier.abi,
                this.addresses.smartWalletDeployVerifier
            );
            console.debug('Contracts initialized correctly');
        } catch (error: any) {
            throw new Error('Contracts fail to initialize: ' + error.message);
        }
    }

    public getSmartWalletFactory(): Contract {
        if (!this.smartWalletFactory) {
            this.smartWalletFactory = getContract(
                this.web3Instance,
                SmartWalletFactory.abi,
                this.addresses.smartWalletFactory
            );
        }
        return this.smartWalletFactory;
    }

    public getSmartWalletRelayVerifier(): Contract {
        if (!this.smartWalletRelayVerifier) {
            this.smartWalletRelayVerifier = getContract(
                this.web3Instance,
                RelayVerifier.abi,
                this.addresses.smartWalletRelayVerifier
            );
        }
        return this.smartWalletRelayVerifier;
    }

    public getSmartWalletDeployVerifier(): Contract {
        if (!this.smartWalletDeployVerifier) {
            this.smartWalletDeployVerifier = getContract(
                this.web3Instance,
                DeployVerifier.abi,
                this.addresses.smartWalletDeployVerifier
            );
        }
        return this.smartWalletDeployVerifier;
    }
}
