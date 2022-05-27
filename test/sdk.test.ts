import Web3 from 'web3';
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
import {
    MockRelayingServices,
    Web3EthMock,
    Web3UtilsMock
} from './mock';
import Expect = jest.Expect;

declare const expect: Expect;

describe('Deployed SDK tests', () => {
    let sdk: RelayingServices;

    beforeEach(async () => {
        sdk = new MockRelayingServices();
        await sdk.initialize({});
    });

    it('Should perform a claim operation', async () => {
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

    it('Should Allow a Token', async () => {
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

    it('Should Get the Allowed Tokens', async () => {
        try {
            const allowTokens = await sdk.getAllowedTokens();
            expect(allowTokens.length).toBeGreaterThan(0);
            expect([MOCK_ADDRESS]).toEqual(expect.arrayContaining(allowTokens));
        } catch (error) {
            fail('The allow token operation failed');
        }
    });

    it('Should return True if provided token is Allowed', async () => {
        try {
            const allowTokens = await sdk.isAllowedToken(MOCK_TOKEN_ADDRESS);
            expect(allowTokens).toBeTruthy();
        } catch (error) {
            fail('The token is not allow');
        }
    });

    it('Should fail when deploying a Smart Wallet', async () => {
        try {
            await sdk.deploySmartWallet(
                {
                    address: MOCK_SMART_WALLET_ADDRESS,
                    index: 0,
                },
                {
                    tokenAddress: MOCK_TOKEN_ADDRESS
                }
                
            );
            fail('The smart wallet is already deployed');
        } catch (error: any) {
            expect(error.message).toBe('Smart Wallet already deployed');
        }
    });

    it('Should Generate a Smart Wallet', async () => {
        const smallWalletIndex = 0;
        const smartWallet = await sdk.generateSmartWallet(smallWalletIndex);
        expect(smartWallet.address).toEqual(MOCK_SMART_WALLET_ADDRESS);
        expect(smartWallet.index).toEqual(smallWalletIndex);
    });

    it('Should not let Deploy a Smart Wallet that is already deployed', async () => {
        try {
            await sdk.deploySmartWallet(
                {
                    address: MOCK_SMART_WALLET_ADDRESS,
                    index: 0,
                },
                {
                    tokenAddress: MOCK_TOKEN_ADDRESS,
                    tokenAmount: 0
                }
            );
            fail("Smart wallet deployment expected to fail, but it didn't");
        } catch (error: any) {
            expect(error.message).toBe('Smart Wallet already deployed');
        }
    });

    it('Should return true if Smart Wallet is Deployed', async () => {
        const deployed = await sdk.isSmartWalletDeployed(
            MOCK_SMART_WALLET_ADDRESS
        );
        expect(deployed).toBeTruthy();
    });
});

describe('SDK not deployed tests', () => {
    let sdk: RelayingServices;

    beforeEach(async () => {
        const web3 = new Web3();
        web3.eth = new Web3EthMock({
            getCodeEmpty: true
        }) as any;
        web3.utils = new Web3UtilsMock({
            getCodeEmpty: true
        }) as any;

        sdk = new MockRelayingServices(web3);
        await sdk.initialize({});
    });

    it('Should return False if Smart Wallet not deployed', async () => {
        const deployed = await sdk.isSmartWalletDeployed(
            MOCK_SMART_WALLET_ADDRESS
        );
        expect(deployed).toBeFalsy();
    });

    it('Should Deploy a Smart Wallet', async () => {
        const smartWallet: SmartWallet = await sdk.deploySmartWallet(
            {
                address: MOCK_SMART_WALLET_ADDRESS,
                index: 0,
            },
            {
                tokenAddress: MOCK_TOKEN_ADDRESS
            }
        );
        expect(smartWallet.contract.address).toBe(MOCK_SMART_WALLET_ADDRESS);
        expect(smartWallet.contract.index).toBe(0);
        expect(smartWallet.tokenAddress).toBe(MOCK_TOKEN_ADDRESS);
        expect(smartWallet.deployTransaction).toBe(MOCK_TRANSACTION_HASH);
    });

    it('Should Fail when relaying a Transaction', async () => {
        const transaction: TransactionConfig = {
            from: MOCK_ADDRESS,
            to: MOCK_CONTRACT_ADDRESS,
            value: 1
        };
        const smartWallet: SmartWallet = {
            contract: { 
                address: MOCK_SMART_WALLET_ADDRESS,
                index: 0,
            },
            deployTransaction: '0',
            tokenAddress: '0'
        };
        try {
            await sdk.relayTransaction(transaction, smartWallet, 0);
            fail('Relay transaction should have failed.');
        } catch (error: any) {
            expect(error.message).toBe(
                `Smart Wallet is not deployed or the address ${smartWallet.contract.address} is not a smart wallet.`
            );
        }
    });
});
