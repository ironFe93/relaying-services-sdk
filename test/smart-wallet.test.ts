import { RelayingServices, SmartWallet } from '../src';
import { MockRelayingServices, Web3Mock } from './mock';
import { TransactionConfig, TransactionReceipt } from 'web3-core';
import Expect = jest.Expect;
import {
    MOCK_CONTRACT_ADDRESS,
    MOCK_ADDRESS,
    MOCK_SMART_WALLET_ADDRESS,
    MOCK_TOKEN_ADDRESS,
    MOCK_TRANSACTION_RECEIPT
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

    it('Should return is deployed smart wallet', async () => {
        const deployed = await sdk.isSmartWalletDeployed(
            MOCK_SMART_WALLET_ADDRESS
        );
        expect(deployed).toBeTruthy();
    });

    it('Should relay transaction successfully', async () => {
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
        const transactionReceipt: TransactionReceipt =
            await sdk.relayTransaction(transaction, smartWallet, 0);
        expect(transactionReceipt).toBe(MOCK_TRANSACTION_RECEIPT);
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
        expect(smartWallet.deployTransaction).toBe(MOCK_TRANSACTION_RECEIPT);
    });

    it('Should return is not deployed smart wallet', async () => {
        const deployed = await sdk.isSmartWalletDeployed(
            MOCK_SMART_WALLET_ADDRESS
        );
        expect(deployed).toBeFalsy();
    });

    it('Should fail to relay transaction', async () => {
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
        } catch (error) {
            expect(error.message).toBe(
                `Smart Wallet is not deployed or the address ${smartWallet.address} is not a smart wallet.`
            );
        }
    });
});
