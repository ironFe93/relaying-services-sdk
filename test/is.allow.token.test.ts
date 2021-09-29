import { RelayingServices } from '../src';
import { MockRelayingServices } from './mock';
import { MOCK_TOKEN_ADDRESS } from './constants';
import Expect = jest.Expect;
declare const expect: Expect;

describe('Tests for is allow token', () => {
    let sdk: RelayingServices;

    beforeEach(async () => {
        sdk = new MockRelayingServices();
        await sdk.initialize({});
    });

    it('Should run is allow token', async () => {
        try {
            const allowTokens = await sdk.isAllowedToken(MOCK_TOKEN_ADDRESS);
            expect(allowTokens).toBeTruthy();
        } catch (error) {
            fail('The token is not allow');
        }
    });
});
