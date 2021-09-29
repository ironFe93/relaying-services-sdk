import { RelayingServices } from '../src';
import { MockRelayingServices } from './mock';
import Expect = jest.Expect;

declare const expect: Expect;

describe('Tests for get allow token', () => {
    let sdk: RelayingServices;

    beforeEach(async () => {
        sdk = new MockRelayingServices();
        await sdk.initialize({});
    });

    it('Should run get allow token', async () => {
        try {
            const allowTokens = await sdk.getAllowedTokens();
            expect(allowTokens.length).toBeGreaterThan(0);
            expect.arrayContaining(allowTokens);
        } catch (error) {
            fail('The token is not allow');
        }
    });
});
