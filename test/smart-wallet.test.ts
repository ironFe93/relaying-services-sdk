import { RelayingServices, SmartWallet } from '../src';
import { MockRelayingServices } from './mock';
import Expect = jest.Expect;
import { MOCK_SMART_WALLET_ADDRESS } from './constants';

declare const expect: Expect;

describe('Tests for generateSmartWallet', () => {
    let sdk: RelayingServices;

    beforeEach(async () => {
        sdk = new MockRelayingServices();
    });

    it('Should return an smart wallet address', async () => {
        const smartWalletIndex = 0;
        const smartWallet: SmartWallet = await sdk.generateSmartWallet(
            smartWalletIndex
        );
        expect(smartWallet.index).toBe(smartWalletIndex);
        expect(smartWallet.address).toBe(MOCK_SMART_WALLET_ADDRESS);
        expect(smartWallet.deployed).toBeTruthy();
        expect(smartWallet.tokenAddress).toBeFalsy();
        expect(smartWallet.deployTransaction).toBeFalsy();
    });
});
