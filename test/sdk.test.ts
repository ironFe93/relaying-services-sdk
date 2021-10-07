import { TransactionConfig } from 'web3-core';
import { RelayingServices, SmartWallet } from '../src';
import {
    MOCK_ACCOUNT,
    MOCK_ADDRESS,
    MOCK_CONTRACT_ADDRESS,
    MOCK_SMART_WALLET_ADDRESS,
    MOCK_TOKEN_ADDRESS,
    MOCK_TRANSACTION_HASH
} from './constants';
import { MockRelayingServices, Web3Mock } from './mock';
import Expect = jest.Expect;

declare const expect: Expect;

describe('SDK', () => {
    let sdk: RelayingServices;

    beforeEach(async () => {
        sdk = new MockRelayingServices();
        await sdk.initialize({});
    });

    it('Claim', async () => {
        try {
            await sdk.claim({});
            fail(
                "The claim operation was expected to fail in this version of SDK, but it didn't"
            );
        } catch (error: any) {
            expect(error.message).toBe(
                'NOT IMPLEMENTED: this will be available with arbiter integration.'
            );
        }
    });

    it('Allow Token', async () => {
        try {
            const allowedToken = await sdk.allowToken(
                MOCK_TOKEN_ADDRESS,
                MOCK_ACCOUNT.address
            );
            expect(allowedToken).toEqual(MOCK_TOKEN_ADDRESS);
        } catch (error: any) {
            fail('The allow token call was unsuccessful:' + error.message);
        }
    });

    it('Get Allow Token', async () => {
        try {
            const allowTokens = await sdk.getAllowedTokens();
            expect(allowTokens.length).toBeGreaterThan(0);
            expect([MOCK_ADDRESS]).toEqual(expect.arrayContaining(allowTokens));
        } catch (error) {
            fail('The allow token operation failed');
        }
    });

    it('Is Allow Token', async () => {
        try {
            const allowTokens = await sdk.isAllowedToken(MOCK_TOKEN_ADDRESS);
            expect(allowTokens).toBeTruthy();
        } catch (error) {
            fail('The token is not allow');
        }
    });

    it('Smart Wallet', async () => {
        try {
            await sdk.deploySmartWallet(
                {
                    address: MOCK_SMART_WALLET_ADDRESS,
                    index: 0,
                    deployed: true
                },
                MOCK_TOKEN_ADDRESS
            );
            fail('The small wallet this not already deployed');
        } catch (error: any) {
            expect(error.message).toBe('Smart Wallet already deployed');
        }
    });

    it('Generate Smart Wallet', async () => {
        const smallWalletIndex = 0;
        const smartWallet = await sdk.generateSmartWallet(smallWalletIndex);
        expect(smartWallet.deployed).toBeTruthy();
        expect(smartWallet.address).toEqual(MOCK_SMART_WALLET_ADDRESS);
        expect(smartWallet.index).toEqual(smallWalletIndex);
    });

    it('Deployed Smart Wallet already deployed', async () => {
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
            fail("Smart wallet deployment expected to fail, but it didn't");
        } catch (error: any) {
            expect(error.message).toBe('Smart Wallet already deployed');
        }
    });

    it('Is Smart Wallet Deployed', async () => {
        const deployed = await sdk.isSmartWalletDeployed(
            MOCK_SMART_WALLET_ADDRESS
        );
        expect(deployed).toBeTruthy();
    });
});

describe('SDK not deployed', () => {
    let sdk: RelayingServices;

    beforeEach(async () => {
        sdk = new MockRelayingServices(
            new Web3Mock({
                getCodeEmpty: true
            }) as any
        );
        await sdk.initialize({});
    });

    it('Is Smart Wallet not deployed', async () => {
        const deployed = await sdk.isSmartWalletDeployed(
            MOCK_SMART_WALLET_ADDRESS
        );
        expect(deployed).toBeFalsy();
    });

    it('Deploy Smart Wallet', async () => {
        const smartWallet: SmartWallet = await sdk.deploySmartWallet(
            {
                address: MOCK_SMART_WALLET_ADDRESS,
                index: 0,
                deployed: true
            },
            MOCK_TOKEN_ADDRESS
        );
        expect(smartWallet.address).toBe(MOCK_SMART_WALLET_ADDRESS);
        expect(smartWallet.index).toBe(0);
        expect(smartWallet.deployed).toBeTruthy();
        expect(smartWallet.tokenAddress).toBe(MOCK_TOKEN_ADDRESS);
        expect(smartWallet.deployTransaction).toBe(MOCK_TRANSACTION_HASH);
    });

    it('Relay Transaction', async () => {
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
