import { RelayingServices, SmartWallet } from '../src';
import { MockRelayingServices, Web3Mock } from './mock';
import { TransactionConfig } from 'web3-core';
import Expect = jest.Expect;
import {
    MOCK_CONTRACT_ADDRESS,
    MOCK_ADDRESS,
    MOCK_SMART_WALLET_ADDRESS
} from './constants';

declare const expect: Expect;
const transaction: TransactionConfig = {
    from: MOCK_ADDRESS,
    to: MOCK_CONTRACT_ADDRESS,
    value: 1
};
const smartWallet: SmartWallet = {
    address: MOCK_SMART_WALLET_ADDRESS,
    index: 0,
    deployed: true
};

describe('Tests for smart wallet without being deployed', () => {
    let sdk: RelayingServices;

    beforeEach(async () => {
        sdk = new MockRelayingServices(
            new Web3Mock({
                getCodeEmpty: true
            }) as any
        );
        await sdk.initialize({});
    });

    it('Should fail to relay transaction', async () => {
        try {
            await sdk.relayTransaction(transaction, smartWallet, 0);
            fail('Relay transaction should have failed.');
        } catch (error: any) {
            expect(error.message).toBe(
                `Smart Wallet is not deployed or the address ${smartWallet.address} is not a smart wallet.`
            );
        }
    });
});
