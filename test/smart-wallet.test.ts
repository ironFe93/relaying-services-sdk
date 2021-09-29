import { RelayingServices } from '../src';
import { MockRelayingServices } from './mock';
import Expect = jest.Expect;
import { MOCK_SMART_WALLET_ADDRESS, MOCK_TOKEN_ADDRESS } from './constants';

declare const expect: Expect;

describe('Tests for smart wallet', () => {
    let sdk: RelayingServices;

    beforeEach(async () => {
        sdk = new MockRelayingServices();
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
            fail('The small wallet this not already deployed');
        } catch (error: any) {
            expect(error.message).toBe('Smart Wallet already deployed');
        }
    });
});
