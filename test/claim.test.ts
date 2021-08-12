import { RelayingServices } from '../src';
import { MockRelayingServices } from './mock';
import Expect = jest.Expect;

declare const expect: Expect;

describe('Tests for claim operation', () => {
    let sdk: RelayingServices;

    beforeEach(async () => {
        sdk = new MockRelayingServices();
    });

    it('Should fail by not implemented error', async () => {
        try {
            await sdk.claim({});
        } catch (error) {
            expect(error.message).toBe(
                'NOT IMPLEMENTED: this will be available with arbiter integration.'
            );
        }
    });
});
