import { RelayingServices } from '../src';
import { MockRelayingServices } from './mock';
import { MOCK_ACCOUNT, MOCK_TOKEN_ADDRESS } from './constants';
import Expect = jest.Expect;

declare const expect: Expect;

describe('Tests for allow token', () => {
    let sdk: RelayingServices;

    beforeEach(async () => {
        sdk = new MockRelayingServices();
        await sdk.initialize({});
    });

    it('Should run allow token', async () => {
        try {
            const allowdToken = await sdk.allowToken(
                MOCK_TOKEN_ADDRESS,
                MOCK_ACCOUNT.address
            );
            expect(allowdToken).toEqual(MOCK_TOKEN_ADDRESS);
        } catch (error: any) {
            fail('The allowToken is not success:' + error.message);
        }
    });
});
