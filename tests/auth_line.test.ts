import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createSessionToken, verifySessionToken, isAdminUser } from '../src/lib/auth/session';
import { getMockUserProfile, buildLineAuthUrl } from '../src/lib/auth/lineAuth';
import type { AuthUser } from '../src/types/auth';

describe('LINE Authentication & Session Management', () => {
  it('generates valid LINE OAuth URL with query parameters', () => {
    const url = buildLineAuthUrl('test_state_123', 'http://localhost:3000/callback');
    assert.ok(url.includes('https://access.line.me/oauth2/v2.1/authorize'));
    assert.ok(url.includes('state=test_state_123'));
    assert.ok(url.includes('response_type=code'));
    assert.ok(url.includes('scope=profile+openid+email') || url.includes('scope=profile%20openid%20email'));
  });

  it('creates and verifies a signed session token successfully', () => {
    const mockUser: AuthUser = {
      id: '00000000-0000-0000-0000-000000000001',
      role: 'admin',
      status: 'active',
      display_name: 'Admin Tester',
      email: 'admin@test.gov.th',
    };

    const token = createSessionToken(mockUser);
    assert.ok(typeof token === 'string' && token.includes('.'));

    const decoded = verifySessionToken(token);
    assert.ok(decoded !== null);
    assert.equal(decoded.user.id, mockUser.id);
    assert.equal(decoded.user.role, 'admin');
    assert.equal(decoded.user.display_name, 'Admin Tester');
    assert.ok(decoded.expires_at > Math.floor(Date.now() / 1000));
  });

  it('fails verification when token signature is tampered', () => {
    const mockUser: AuthUser = {
      id: 'test-user-id',
      role: 'member',
      status: 'active',
      display_name: 'Member Tester',
    };

    const token = createSessionToken(mockUser);
    const tampered = token.slice(0, -4) + 'abcd';
    const decoded = verifySessionToken(tampered);
    assert.equal(decoded, null);
  });

  it('correctly validates admin status with isAdminUser', () => {
    const adminSession = {
      user: getMockUserProfile('admin'),
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };
    const memberSession = {
      user: getMockUserProfile('member'),
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };

    assert.equal(isAdminUser(adminSession), true);
    assert.equal(isAdminUser(memberSession), false);
    assert.equal(isAdminUser(null), false);
  });
});
