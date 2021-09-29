import { RelayingServices, SmartWallet } from '../src';
import { MockRelayingServices, Web3Mock } from './mock';
import Expect = jest.Expect;
import {
    MOCK_SMART_WALLET_ADDRESS,
    MOCK_TOKEN_ADDRESS,
    MOCK_TRANSACTION_HASH
} from './constants';

declare const expect: Expect;

describe('Tests for smart wallet', () => {
    let sdk: RelayingServices;

    beforeEach(async () => {
        sdk = new MockRelayingServices(
            new Web3Mock({
                getCodeEmpty: false
            }) as any
        );
        await sdk.initialize({});
    });

    it('Should fail with smart wallet already deployed', async () => {
        try {
            await sdk.deploySmartWallet(
                {
                    address: MOCK_SMART_WALLET_ADDRESS,
                    index: 0,
                    deployed: true
                },
                MOCK_TOKEN_ADDRESS,
                0
            );
            fail('The smart wallet this not already deployed');
        } catch (error: any) {
            expect(error.message).toBe('Smart Wallet already deployed');
        }
    });
});

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

    it('Should deploy smart wallet successfully', async () => {
        const smartWallet: SmartWallet = await sdk.deploySmartWallet(
            {
                address: MOCK_SMART_WALLET_ADDRESS,
                index: 0,
                deployed: true
            },
            MOCK_TOKEN_ADDRESS,
            0
        );
        expect(smartWallet.address).toBe(MOCK_SMART_WALLET_ADDRESS);
        expect(smartWallet.index).toBe(0);
        expect(smartWallet.deployed).toBeTruthy();
        expect(smartWallet.tokenAddress).toBe(MOCK_TOKEN_ADDRESS);
        expect(smartWallet.deployTransaction).toBe(MOCK_TRANSACTION_HASH);
    });
});
