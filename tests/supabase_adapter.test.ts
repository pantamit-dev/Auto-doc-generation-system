import test from 'node:test';
import assert from 'node:assert/strict';
import { SupabaseStorageAdapter, isSupabaseConfigured } from '../src/lib/store/supabaseAdapter';

test('SupabaseStorageAdapter: handles unconfigured environment gracefully with local fallback', async () => {
  const adapter = new SupabaseStorageAdapter();
  const profile = await adapter.getProfile();
  const agency = await adapter.getAgency();
  const contract = await adapter.getContract();
  const period = await adapter.getCurrentPeriod();

  assert.ok(profile);
  assert.ok(agency);
  assert.ok(contract);
  assert.ok(period);
  assert.strictEqual(typeof profile.full_name, 'string');
});

test('SupabaseStorageAdapter: saveProfile preserves fields and fallback works offline', async () => {
  const adapter = new SupabaseStorageAdapter();
  const updated = await adapter.saveProfile({
    title: 'นาย',
    first_name: 'ทดสอบ',
    last_name: 'ระบบ',
  });

  assert.strictEqual(updated.first_name, 'ทดสอบ');
  assert.strictEqual(updated.full_name, 'นายทดสอบ ระบบ');
});

test('SupabaseStorageAdapter: logAction creates audit entry correctly', async () => {
  const adapter = new SupabaseStorageAdapter();
  const entry = await adapter.logAction({
    action: 'PROFILE_UPDATE',
    actor: 'นายทดสอบ ระบบ',
    entity_type: 'contractor_profile',
    summary: 'ทดสอบการบันทึก Audit Log',
  });

  assert.ok(entry.id);
  assert.strictEqual(entry.summary, 'ทดสอบการบันทึก Audit Log');
});
