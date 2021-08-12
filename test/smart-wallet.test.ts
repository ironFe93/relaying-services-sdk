import { RelayingServices, SmartWallet } from '../src';
import { MockRelayingServices, Web3Mock } from './mock';
import Expect = jest.Expect;
import {
    MOCK_ACCOUNT,
    MOCK_ADDRESS,
    MOCK_SMART_WALLET_ADDRESS,
    MOCK_TOKEN_ADDRESS
} from './constants';

declare const expect: Expect;

describe('Tests for smart wallet', () => {
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

    it('Should run allow token', async () => {
        await sdk.allowToken(MOCK_TOKEN_ADDRESS, MOCK_ACCOUNT);
    });

    it('Should fail with smart wallet already deployed', async () => {
        try {
            await sdk.deploySmartWallet(
                {
                    address: MOCK_SMART_WALLET_ADDRESS,
                    index: 0
                },
                MOCK_TOKEN_ADDRESS,
                0
            );
        } catch (error) {
            expect(error.message).toBe('Smart Wallet already deployed');
        }
    });
});

describe('Tests for smart wallet without code', () => {
    let sdk: RelayingServices;

    beforeEach(async () => {
        sdk = new MockRelayingServices(
            new Web3Mock({
                getCodeEmpty: true
            }) as any
        );
    });

    it('Should deploy smart wallet successfully', async () => {
        const smartWallet: SmartWallet = await sdk.deploySmartWallet(
            {
                address: MOCK_SMART_WALLET_ADDRESS,
                index: 0
            },
            MOCK_TOKEN_ADDRESS,
            0
        );
        expect(smartWallet.address).toBe(MOCK_SMART_WALLET_ADDRESS);
        expect(smartWallet.index).toBe(0);
        expect(smartWallet.deployed).toBeTruthy();
        expect(smartWallet.tokenAddress).toBe(MOCK_TOKEN_ADDRESS);
        expect(smartWallet.deployTransaction).toBeTruthy();
        expect(smartWallet.deployTransaction.from).toBe(MOCK_ADDRESS);
        expect(smartWallet.deployTransaction.status).toBeTruthy();
    });
});
