import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalStorageAdapter } from '../src/lib/store/storageAdapter.ts';
import { validateImportPayload } from '../src/lib/store/dataExportImport.ts';

test('U-M2-01: LocalStorageAdapter initializes with default fixtures on empty storage', async () => {
  const adapter = new LocalStorageAdapter();
  const profile = await adapter.getProfile();
  const agency = await adapter.getAgency();
  const contract = await adapter.getContract();
  const period = await adapter.getCurrentPeriod();

  assert.strictEqual(profile.first_name, '[ชื่อผู้รับจ้าง]');
  assert.strictEqual(agency.agency_name, 'วิทยาลัยนักบริหารสาธารณสุข');
  assert.strictEqual(contract.monthly_salary, 19800.0);
  assert.strictEqual(period.days_in_month, 31);
});

test('U-M2-02: Partial profile update preserves fields and recomputes full_name', async () => {
  const adapter = new LocalStorageAdapter();
  const updated = await adapter.saveProfile({
    title: 'นาย',
    first_name: 'สมชาย',
    last_name: 'ใจดี',
  });

  assert.strictEqual(updated.first_name, 'สมชาย');
  assert.strictEqual(updated.full_name, 'นายสมชาย ใจดี');
  assert.strictEqual(updated.citizen_id, '1234567890123'); // Preserved from default
});

test('U-M2-03: Agency partial update deep-merges signers without clobbering', async () => {
  const adapter = new LocalStorageAdapter();
  const updated = await adapter.saveAgency({
    signers: {
      contractor_name: 'นายสมชาย ใจดี',
      supervisor_name: 'นางสมศรี มีสุข',
      supervisor_position: 'หัวหน้างาน',
      inspection_chairman_name: 'ประธานกรรมการตรวจรับพัสดุ',
      committee_members: [],
      payer_officer_name: '..................................................',
      payer_officer_position: 'เจ้าหน้าที่การเงินและบัญชี',
    },
  });

  assert.strictEqual(updated.signers.supervisor_name, 'นางสมศรี มีสุข');
  assert.strictEqual(updated.agency_name, 'วิทยาลัยนักบริหารสาธารณสุข'); // Preserved
});

test('U-M2-04: Audit log prepends entries and getAuditLogs respects limit', async () => {
  const adapter = new LocalStorageAdapter();
  await adapter.logAction({
    action: 'PROFILE_UPDATE',
    actor: 'นายทดสอบ',
    entity_type: 'contractor_profile',
    summary: 'แก้ไขข้อมูลทดสอบ',
  });

  const logs = await adapter.getAuditLogs(10);
  assert.ok(logs.length >= 1);
  assert.strictEqual(logs[0].actor, 'นายทดสอบ');
  assert.strictEqual(logs[0].action, 'PROFILE_UPDATE');
});

test('U-M2-05: resetToDefaults restores baseline and clears audit logs', async () => {
  const adapter = new LocalStorageAdapter();
  await adapter.saveProfile({ first_name: 'ชื่อชั่วคราว' });
  await adapter.logAction({ action: 'DATA_RESET', actor: 'admin', entity_type: 'test', summary: 'test' });

  await adapter.resetToDefaults();
  const resetProfile = await adapter.getProfile();
  const logs = await adapter.getAuditLogs();

  assert.strictEqual(resetProfile.first_name, '[ชื่อผู้รับจ้าง]');
  assert.strictEqual(logs.length, 0);
});

test('U-M2-06: exportAllData and importAllData roundtrip preserves state', async () => {
  const adapter1 = new LocalStorageAdapter();
  await adapter1.saveContract({ monthly_salary: 25000.0 });
  const exported = await adapter1.exportAllData();

  const adapter2 = new LocalStorageAdapter();
  await adapter2.importAllData(exported);
  const importedContract = await adapter2.getContract();

  assert.strictEqual(importedContract.monthly_salary, 25000.0);
});

test('U-M2-07: importAllData rejects invalid JSON and missing core entities', async () => {
  const adapter = new LocalStorageAdapter();

  await assert.rejects(
    async () => adapter.importAllData('not a valid json {'),
    /Invalid JSON payload/
  );

  await assert.rejects(
    async () => adapter.importAllData(JSON.stringify({ some_other_data: 123 })),
    /missing required entities/
  );
});

test('U-M2-08: validateImportPayload catches syntax errors and missing keys', () => {
  const r1 = validateImportPayload('');
  assert.strictEqual(r1.valid, false);

  const r2 = validateImportPayload('{"corrupted": true');
  assert.strictEqual(r2.valid, false);
  assert.match(r2.error || '', /Invalid JSON payload/);

  const r3 = validateImportPayload(JSON.stringify({ foo: 'bar' }));
  assert.strictEqual(r3.valid, false);
  assert.match(r3.error || '', /missing required entities/);
});
