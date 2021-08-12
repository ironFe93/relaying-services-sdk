import { DefaultRelayingServices } from '../src';
import Web3 from 'web3';
import { EnvelopingConfig } from '@rsksmart/rif-relay-common';
import { RelayingServicesAddresses } from '../src/interfaces';

declare const jest: any;

jest.mock('web3');

const sendSignedTransactionMock = jest.fn();
sendSignedTransactionMock.mockReturnValue({
    status: true
});

const web3Mock = {
    eth: {
        sendSignedTransaction: sendSignedTransactionMock
    }
};

export class MockRelayingServices extends DefaultRelayingServices {
    constructor() {
        super({
            rskHost: '',
            envelopingConfig: {},
            web3Instance: web3Mock as Web3
        });
    }

    async initialize(
        envelopingConfig: Partial<EnvelopingConfig>,
        contractAddresses?: RelayingServicesAddresses
    ): Promise<void> {
        console.debug('Init Relaying Services Mock', {
            envelopingConfig,
            contractAddresses
        });
        return Promise.resolve();
    }
}
