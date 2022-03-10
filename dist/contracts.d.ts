import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { RelayingServicesAddresses } from './interfaces';
export declare class Contracts {
    private web3Instance;
    addresses: RelayingServicesAddresses;
    private smartWalletFactory;
    private smartWalletRelayVerifier;
    private smartWalletDeployVerifier;
    constructor(web3Instance: Web3, chainId: number, contractAddresses?: RelayingServicesAddresses);
    protected initialize(): void;
    getSmartWalletFactory(): Contract;
    getSmartWalletRelayVerifier(): Contract;
    getSmartWalletDeployVerifier(): Contract;
}
