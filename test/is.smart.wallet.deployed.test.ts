import { RelayingServices } from '../src';
import { MockRelayingServices, Web3Mock } from './mock';
import Expect = jest.Expect;
import { MOCK_SMART_WALLET_ADDRESS } from './constants';

declare const expect: Expect;

describe('Tests for is smart wallet', () => {
    let sdk: RelayingServices;

    beforeEach(async () => {
        sdk = new MockRelayingServices();
        await sdk.initialize({});
    });

    it('Should return is deployed smart wallet', async () => {
        const deployed = await sdk.isSmartWalletDeployed(
            MOCK_SMART_WALLET_ADDRESS
        );
        expect(deployed).toBeTruthy();
    });
});

describe('Tests for is smart wallet without being deployed', () => {
    let sdk: RelayingServices;

    beforeEach(async () => {
        sdk = new MockRelayingServices(
            new Web3Mock({
                getCodeEmpty: true
            }) as any
        );
    });

    it('Should return is not deployed smart wallet', async () => {
        const deployed = await sdk.isSmartWalletDeployed(
            MOCK_SMART_WALLET_ADDRESS
        );
        expect(deployed).toBeFalsy();
    });
});
