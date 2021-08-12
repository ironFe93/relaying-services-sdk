import { DefaultRelayingServices } from '../src';
import Web3 from 'web3';
import { EnvelopingConfig } from '@rsksmart/rif-relay-common';
import { RelayingServicesAddresses } from '../src/interfaces';
import { Contracts } from '../src/contracts';
import { AbiItem } from 'web3-utils';
import {
    MOCK_ACCOUNT,
    MOCK_CODE,
    MOCK_SMART_WALLET_ADDRESS
} from './constants';

declare const jest: any;

const sendSignedTransactionMock = jest.fn();
sendSignedTransactionMock.mockReturnValue({
    status: true
});

export class Web3MethodsMock {
    constructor(private abi: AbiItem, private address: string) {}
    public getSmartWalletAddress(
        address: string,
        recoverer: string,
        smartWalletIndex: number
    ) {
        console.debug('getSmartWalletAddress', {
            address,
            recoverer,
            smartWalletIndex
        });
        return {
            call: () => {
                return MOCK_SMART_WALLET_ADDRESS;
            }
        };
    }
}

export class Web3ContractMock {
    methods: Web3MethodsMock;
    constructor(abi: AbiItem, address: string) {
        console.debug('Contract Mock', address);
        this.methods = new Web3MethodsMock(abi, address);
    }
}

export class Web3EthMock {
    sendSignedTransaction: any = sendSignedTransactionMock;
    Contract = Web3ContractMock;
    getCode = (address: string): Promise<string> => {
        console.debug('getCode', {
            address
        });
        return Promise.resolve(MOCK_CODE);
    };
}

export class Web3Mock {
    eth: Web3EthMock = new Web3EthMock();
}

const web3Mock = new Web3Mock();

export class MockContracts extends Contracts {
    constructor(web3Instance?: Web3) {
        super(web3Instance ?? (web3Mock as Web3), 33);
    }

    async initialize(): Promise<void> {
        console.debug('Initializing MockContracts');
        return super.initialize();
    }
}

export class MockRelayingServices extends DefaultRelayingServices {
    constructor(web3Instance?: Web3) {
        super({
            rskHost: '',
            envelopingConfig: {},
            web3Instance: web3Instance ? web3Instance : (web3Mock as Web3)
        });
    }

    async initialize(
        envelopingConfig: Partial<EnvelopingConfig>,
        contractAddresses?: RelayingServicesAddresses
    ): Promise<void> {
        console.debug('Init Relaying Services Mock', {
            envelopingConfig,
            contractAddresses,
            web3: this.web3Instance
        });
        this.contracts = new MockContracts(this.web3Instance);
        return Promise.resolve();
    }

    getAccountAddress(): string {
        return MOCK_ACCOUNT;
    }
}
