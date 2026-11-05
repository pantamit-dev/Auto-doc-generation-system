/**
 * salary-doc-web/tests/storage_stress_corruption.challenge.ts
 * ==============================================================================
 * ADVERSARIAL CHALLENGER TEST SUITE: Storage Stress, Corruption & Fallback
 * Empirical investigation of LocalStorageAdapter, useSalaryStore, and dataExportImport
 * ==============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalStorageAdapter } from '../src/lib/store/storageAdapter.ts';
import {
  validateImportPayload,
  exportAndDownloadBackup,
  importFromFile,
} from '../src/lib/store/dataExportImport.ts';
import { useSalaryStore } from '../src/lib/store/useSalaryStore.ts';
import { STORAGE_KEYS } from '../src/lib/store/types.ts';
import type {
  ContractorProfile,
  AgencyProfile,
  ContractDetails,
  MonthlyPeriod,
  AuditLogEntry,
} from '../src/lib/store/types.ts';

// ==============================================================================
// 1. CORRUPTED & MALFORMED PAYLOAD INGESTION (ADAPTER & EXPORT/IMPORT)
// ==============================================================================

test('CHALLENGE-01: Malformed JSON syntax rejected by validateImportPayload and importAllData', async () => {
  const malformedInputs = [
    '',
    '   ',
    '{"unclosed_brace": true',
    '{"key": undefined}',
    '<xml>not json</xml>',
    '{"invalid_unicode": "\uD800"}',
    '{"trailing_comma": [1, 2, 3,]}',
  ];

  const adapter = new LocalStorageAdapter();

  for (const input of malformedInputs) {
    const validation = validateImportPayload(input);
    assert.strictEqual(validation.valid, false, `Expected validation failure for: ${input}`);
    assert.ok(validation.error && validation.error.length > 0);

    await assert.rejects(
      async () => adapter.importAllData(input),
      /(Invalid JSON payload|missing required entities)/,
      `Expected importAllData to reject malformed input: ${input}`
    );
  }
});

test('CHALLENGE-02: Non-object root primitives rejected by validation', async () => {
  const primitiveInputs = [
    'null',
    '12345',
    '"just a string"',
    'true',
    'false',
    '[1, 2, 3]',
    '[]',
  ];

  const adapter = new LocalStorageAdapter();

  for (const input of primitiveInputs) {
    const validation = validateImportPayload(input);
    assert.strictEqual(validation.valid, false, `Expected primitive rejected: ${input}`);

    await assert.rejects(
      async () => adapter.importAllData(input),
      /(Invalid JSON payload|missing required entities)/,
      `Expected importAllData to reject primitive: ${input}`
    );
  }
});

test('CHALLENGE-03: Incomplete payloads missing required entities rejected', async () => {
  const incompletePayloads = [
    {},
    { profile: {} },
    { agency: {} },
    { contract: {} },
    { profile: {}, agency: {} }, // missing contract
    { agency: {}, contract: {} }, // missing profile
    { profile: {}, contract: {} }, // missing agency
    { contractor: null, agency: null, contract: null },
  ];

  const adapter = new LocalStorageAdapter();

  for (const payload of incompletePayloads) {
    const jsonStr = JSON.stringify(payload);
    const validation = validateImportPayload(jsonStr);
    assert.strictEqual(validation.valid, false, `Expected validation failure for: ${jsonStr}`);
    assert.match(validation.error || '', /(missing required entities|expected root object)/);

    await assert.rejects(
      async () => adapter.importAllData(jsonStr),
      /(missing required entities|Invalid JSON payload)/,
      `Expected adapter rejection for: ${jsonStr}`
    );
  }
});

test('CHALLENGE-04: Schema entity field-level validation (invalid types & missing core fields)', () => {
  const validBase = {
    profile: {
      first_name: 'สมชาย',
      last_name: 'ใจดี',
    },
    agency: {
      agency_name: 'วิทยาลัยทดสอบ',
    },
    contract: {
      monthly_salary: 19800.0,
    },
  };

  // Missing profile.first_name
  const noFirstName = {
    ...validBase,
    profile: { last_name: 'ใจดี' },
  };
  const r1 = validateImportPayload(JSON.stringify(noFirstName));
  assert.strictEqual(r1.valid, false);
  assert.match(r1.error || '', /missing first_name or last_name/);

  // Missing agency_name
  const noAgency = {
    ...validBase,
    agency: { department: 'กองกลาง' },
  };
  const r2 = validateImportPayload(JSON.stringify(noAgency));
  assert.strictEqual(r2.valid, false);
  assert.match(r2.error || '', /missing agency_name/);

  // Negative salary
  const negSalary = {
    ...validBase,
    contract: { monthly_salary: -500 },
  };
  const r3 = validateImportPayload(JSON.stringify(negSalary));
  assert.strictEqual(r3.valid, false);
  assert.match(r3.error || '', /monthly_salary must be a positive number/);

  // Non-number salary
  const strSalary = {
    ...validBase,
    contract: { monthly_salary: '19800' },
  };
  const r4 = validateImportPayload(JSON.stringify(strSalary));
  assert.strictEqual(r4.valid, false);
  assert.match(r4.error || '', /monthly_salary must be a positive number/);
});

// ==============================================================================
// 2. CORRUPTED STORAGE STATE RECOVERY & RESILIENCE
// ==============================================================================

test('CHALLENGE-05A: Adapter survives syntax errors in storage keys by falling back to defaults', async () => {
  const memory = new Map<string, string>();
  memory.set(STORAGE_KEYS.PROFILE, '{"corrupted_json_syntax: true');
  memory.set(STORAGE_KEYS.AGENCY, '{syntax error');
  memory.set(STORAGE_KEYS.CONTRACT, '{syntax error');
  memory.set(STORAGE_KEYS.PERIOD, '{syntax error');
  memory.set(STORAGE_KEYS.AUDIT_LOGS, '{syntax error');

  const adapter = new LocalStorageAdapter(memory);

  // Syntax error throws during JSON.parse -> caught by try/catch -> returns default fixtures
  const profile = await adapter.getProfile();
  assert.strictEqual(profile.first_name, '[ชื่อผู้รับจ้าง]');

  const agency = await adapter.getAgency();
  assert.strictEqual(agency.agency_name, 'วิทยาลัยนักบริหารสาธารณสุข');

  const contract = await adapter.getContract();
  assert.strictEqual(contract.monthly_salary, 19800.0);

  const period = await adapter.getCurrentPeriod();
  assert.strictEqual(period.days_in_month, 31);

  const logs = await adapter.getAuditLogs();
  assert.strictEqual(logs.length, 0);
});

test('CHALLENGE-05B: [REMEDIATED] Storing "null" or non-object in storage keys falls back to default fixtures and prevents save crashes', async () => {
  const memory = new Map<string, string>();
  memory.set(STORAGE_KEYS.AGENCY, 'null');
  memory.set(STORAGE_KEYS.CONTRACT, '123456');

  const adapter = new LocalStorageAdapter(memory);

  // 1. JSON.parse("null") produces null; safeParseObject returns deep-cloned DEFAULT_AGENCY_PROFILE
  const agency = await adapter.getAgency();
  assert.ok(agency && typeof agency === 'object', 'getAgency() must return object');
  assert.strictEqual(agency.agency_name, 'วิทยาลัยนักบริหารสาธารณสุข');

  // 2. Subsequent saveAgency executes safely without throwing
  await assert.doesNotReject(
    async () => {
      await adapter.saveAgency({ agency_name: 'ชื่อใหม่' });
    },
    'CONFIRMED: saveAgency executes safely when agency was initialized with "null"'
  );

  // 3. getContract() returns ContractDetails object
  const contract = await adapter.getContract();
  assert.ok(contract && typeof contract === 'object');
  assert.strictEqual(contract.monthly_salary, 19800.0);
});

// ==============================================================================
// 3. PARTIAL UPDATE DEEP-MERGING RIGOR
// ==============================================================================

test('CHALLENGE-06: Profile partial update preserves existing fields and recomputes full_name', async () => {
  const adapter = new LocalStorageAdapter();

  // Initial update
  await adapter.saveProfile({
    title: 'นาย',
    first_name: 'กล้าหาญ',
    last_name: 'ชาญชัย',
    phone_number: '0812345678',
    bank_account_no: '123-4-56789-0',
  });

  const updated1 = await adapter.getProfile();
  assert.strictEqual(updated1.full_name, 'นายกล้าหาญ ชาญชัย');
  assert.strictEqual(updated1.phone_number, '0812345678');
  assert.strictEqual(updated1.citizen_id, '1234567890123'); // Preserved default

  // Update only phone_number — must NOT clobber names or recompute full_name into undefined
  await adapter.saveProfile({
    phone_number: '0899999999',
  });

  const updated2 = await adapter.getProfile();
  assert.strictEqual(updated2.phone_number, '0899999999');
  assert.strictEqual(updated2.first_name, 'กล้าหาญ');
  assert.strictEqual(updated2.last_name, 'ชาญชัย');
  assert.strictEqual(updated2.full_name, 'นายกล้าหาญ ชาญชัย');
  assert.strictEqual(updated2.bank_account_no, '123-4-56789-0');

  // Explicit full_name override must be respected
  await adapter.saveProfile({
    full_name: 'ดร.กล้าหาญ ชาญชัย กองพิเศษ',
  });
  const updated3 = await adapter.getProfile();
  assert.strictEqual(updated3.full_name, 'ดร.กล้าหาญ ชาญชัย กองพิเศษ');
});

test('CHALLENGE-07: Agency partial update deep-merges signers without clobbering sibling signers', async () => {
  const adapter = new LocalStorageAdapter();

  const originalAgency = await adapter.getAgency();
  const originalSupervisor = originalAgency.signers.supervisor_name;
  const originalChairman = originalAgency.signers.inspection_chairman_name;

  // Update contractor_name inside signers
  await adapter.saveAgency({
    signers: {
      contractor_name: 'นายผู้รับจ้าง คนใหม่',
    } as any,
  });

  const updated1 = await adapter.getAgency();
  assert.strictEqual(updated1.signers.contractor_name, 'นายผู้รับจ้าง คนใหม่');
  assert.strictEqual(updated1.signers.supervisor_name, originalSupervisor, 'Supervisor must not be wiped');
  assert.strictEqual(updated1.signers.inspection_chairman_name, originalChairman, 'Chairman must not be wiped');
  assert.strictEqual(updated1.agency_name, originalAgency.agency_name, 'Agency name must not be wiped');

  // Update agency_name without signers
  await adapter.saveAgency({
    agency_name: 'กรมการแพทย์ กระทรวงสาธารณสุข',
  });

  const updated2 = await adapter.getAgency();
  assert.strictEqual(updated2.agency_name, 'กรมการแพทย์ กระทรวงสาธารณสุข');
  assert.strictEqual(updated2.signers.contractor_name, 'นายผู้รับจ้าง คนใหม่', 'Contractor signer must remain');
  assert.strictEqual(updated2.signers.supervisor_name, originalSupervisor, 'Supervisor must remain');
});

// ==============================================================================
// 4. BROWSER LOCALSTORAGE SIMULATION & QUOTA / IN-MEMORY FALLBACK
// ==============================================================================

test('CHALLENGE-08A: QuotaExceededError is caught and writes to in-memory fallback without throwing uncaught exception', async () => {
  const store = new Map<string, string>();
  let throwOnSet = false;

  const mockLocalStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (throwOnSet) {
        const error = new Error('QuotaExceededError: The quota has been exceeded');
        error.name = 'QuotaExceededError';
        throw error;
      }
      store.set(key, value);
    },
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };

  const originalWindow = (globalThis as any).window;
  (globalThis as any).window = { localStorage: mockLocalStorage };

  try {
    const adapter = new LocalStorageAdapter();
    await adapter.saveProfile({ first_name: 'ก่อนเต็ม' });
    assert.strictEqual(store.get(STORAGE_KEYS.PROFILE)?.includes('ก่อนเต็ม'), true);

    // Trigger quota failure on next setItem
    throwOnSet = true;

    // setItem must not throw
    await assert.doesNotReject(async () => {
      await adapter.saveProfile({ first_name: 'หลังโควต้าเต็ม' });
    });
  } finally {
    (globalThis as any).window = originalWindow;
  }
});

test('CHALLENGE-08B: [REMEDIATED] QuotaExceededError causes fallbackKeys tracking so getItem returns fresh memory fallback data', async () => {
  const store = new Map<string, string>();
  let throwOnSet = false;

  const mockLocalStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (throwOnSet) {
        const error = new Error('QuotaExceededError: The quota has been exceeded');
        error.name = 'QuotaExceededError';
        throw error;
      }
      store.set(key, value);
    },
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };

  const originalWindow = (globalThis as any).window;
  (globalThis as any).window = { localStorage: mockLocalStorage };

  try {
    const adapter = new LocalStorageAdapter();
    // 1. Initial write to localStorage succeeds
    await adapter.saveProfile({ first_name: 'ก่อนเต็ม' });

    // 2. LocalStorage quota becomes exhausted
    throwOnSet = true;

    // 3. User updates profile; setItem fails on localStorage, writes to this.memoryStorage
    await adapter.saveProfile({ first_name: 'หลังโควต้าเต็ม' });

    // 4. Read profile: fallbackKeys routes to memoryStorage, returning fresh data
    const reloaded = await adapter.getProfile();

    assert.strictEqual(
      reloaded.first_name,
      'หลังโควต้าเต็ม',
      'CONFIRMED: getItem returns fresh memory fallback update after quota exhaustion'
    );
  } finally {
    (globalThis as any).window = originalWindow;
  }
});

test('CHALLENGE-09: Adapter operates purely in-memory when window is undefined (SSR)', async () => {
  const originalWindow = (globalThis as any).window;
  delete (globalThis as any).window;

  try {
    const adapter = new LocalStorageAdapter();
    await adapter.saveProfile({ first_name: 'SSRโหมด' });
    const profile = await adapter.getProfile();
    assert.strictEqual(profile.first_name, 'SSRโหมด');

    await adapter.logAction({
      action: 'SSR_TEST',
      actor: 'SSR_Worker',
      entity_type: 'ssr',
      summary: 'Running without window',
    });
    const logs = await adapter.getAuditLogs();
    assert.strictEqual(logs.length, 1);
    assert.strictEqual(logs[0].action, 'SSR_TEST');
  } finally {
    (globalThis as any).window = originalWindow;
  }
});

// ==============================================================================
// 5. AUDIT LOG CAPPING & STRESS TESTING
// ==============================================================================

test('CHALLENGE-10: Audit log caps at exactly 500 entries under continuous insertion', async () => {
  const adapter = new LocalStorageAdapter();

  // Rapidly insert 550 entries
  for (let i = 1; i <= 550; i++) {
    await adapter.logAction({
      action: 'STRESS_LOG',
      actor: `User-${i}`,
      entity_type: 'stress_test',
      summary: `Stress log entry #${i}`,
    });
  }

  const logs50 = await adapter.getAuditLogs(50);
  assert.strictEqual(logs50.length, 50, 'Default/specified limit 50 respected');

  const allLogs = await adapter.getAuditLogs(1000);
  assert.strictEqual(allLogs.length, 500, 'Audit logs must be strictly capped at 500');

  // Most recent entry should be #550 (reverse chronological)
  assert.strictEqual(allLogs[0].actor, 'User-550');
  assert.strictEqual(allLogs[499].actor, 'User-51'); // 550 - 500 + 1 = 51

  // resetToDefaults clears all logs
  await adapter.resetToDefaults();
  const cleared = await adapter.getAuditLogs();
  assert.strictEqual(cleared.length, 0);
});

// ==============================================================================
// 6. EXPORT / IMPORT ROUNDTRIP STATE PRESERVATION
// ==============================================================================

test('CHALLENGE-11: Full state export and import roundtrip preserves all entity fields', async () => {
  const adapter1 = new LocalStorageAdapter();

  // Custom data setup
  const customProfile: Partial<ContractorProfile> = {
    title: 'นางสาว',
    first_name: 'กานดา',
    last_name: 'งามยิ่ง',
    full_name: 'นางสาวกานดา งามยิ่ง',
    citizen_id: '1234567890123',
    phone_number: '0819876543',
    email: 'kanda.n@moph.mail.go.th',
    address_line1: '๑๒๓/๔๕ หมู่ ๖ ตำบลตลาดขวัญ',
    address_full_arabic: '123/45 Moo 6 Talat Khwan',
    bank_account_no: '987-6-54321-0',
    bank_name: 'ธนาคารกรุงไทย',
  };

  const customAgency: Partial<AgencyProfile> = {
    agency_name: 'ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร',
    department: 'สำนักงานปลัดกระทรวงสาธารณสุข',
    signers: {
      contractor_name: 'นางสาวกานดา งามยิ่ง',
      supervisor_name: 'นายหัวหน้า กองงาน',
      supervisor_position: 'ผู้อำนวยการศูนย์ฯ',
      inspection_chairman_name: 'นายประธาน ตรวจรับ',
      committee_members: [
        { name: 'กรรมการ คนที่หนึ่ง', position: 'นักวิชาการคอมพิวเตอร์' },
        { name: 'กรรมการ คนที่สอง', position: 'เจ้าพนักงานธุรการ' },
      ],
      payer_officer_name: 'นางการเงิน ประจำศูนย์',
      payer_officer_position: 'นักวิชาการเงินและบัญชี',
    },
  };

  const customContract: Partial<ContractDetails> = {
    contract_number: 'ICT-77/2569',
    monthly_salary: 21500.0,
    total_periods: 6,
    total_contract_amount: 129000.0,
    start_date: '2026-10-01',
    end_date: '2027-03-31',
    duration_months: 6,
  };

  const customPeriod: MonthlyPeriod = {
    period_number: 2,
    month: 11,
    year_ad: 2026,
    year_be: 2569,
    days_in_month: 30,
    public_holidays: [5, 10],
    absent_days: [12],
    actual_working_days: 19,
    absent_days_count: 1,
    daily_rate: 716.67,
    deduction_amount: 716.67,
    net_payable: 20783.33,
    monthly_salary_bahttext: 'สองหมื่นหนึ่งพันห้าร้อยบาทถ้วน',
    net_payable_bahttext: 'สองหมื่นเจ็ดร้อยแปดสิบสามบาทสามสิบสามสตางค์',
    total_contract_amount_bahttext: 'หนึ่งแสนสองหมื่นเก้าพันบาทถ้วน',
  };

  await adapter1.saveProfile(customProfile);
  await adapter1.saveAgency(customAgency);
  await adapter1.saveContract(customContract);
  await adapter1.saveCurrentPeriod(customPeriod);
  await adapter1.logAction({
    action: 'TEST_ROUNDTRIP',
    actor: 'นางสาวกานดา งามยิ่ง',
    entity_type: 'contractor',
    summary: 'รอบทดสอบ Export/Import',
  });

  // Export
  const exportedJson = await adapter1.exportAllData();

  // Validate
  const validation = validateImportPayload(exportedJson);
  assert.strictEqual(validation.valid, true);

  // Import into clean second adapter
  const adapter2 = new LocalStorageAdapter();
  await adapter2.importAllData(exportedJson);

  // Compare all entities
  const importedProfile = await adapter2.getProfile();
  assert.strictEqual(importedProfile.first_name, 'กานดา');
  assert.strictEqual(importedProfile.citizen_id, '1234567890123');
  assert.strictEqual(importedProfile.bank_account_no, '987-6-54321-0');

  const importedAgency = await adapter2.getAgency();
  assert.strictEqual(importedAgency.agency_name, 'ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร');
  assert.strictEqual(importedAgency.signers.supervisor_name, 'นายหัวหน้า กองงาน');
  assert.strictEqual(importedAgency.signers.committee_members.length, 2);
  assert.strictEqual(importedAgency.signers.committee_members[0].name, 'กรรมการ คนที่หนึ่ง');

  const importedContract = await adapter2.getContract();
  assert.strictEqual(importedContract.contract_number, 'ICT-77/2569');
  assert.strictEqual(importedContract.monthly_salary, 21500.0);
  assert.strictEqual(importedContract.duration_months, 6);

  const importedPeriod = await adapter2.getCurrentPeriod();
  assert.strictEqual(importedPeriod.period_number, 2);
  assert.deepStrictEqual(importedPeriod.public_holidays, [5, 10]);
  assert.deepStrictEqual(importedPeriod.absent_days, [12]);
  assert.strictEqual(importedPeriod.net_payable, 20783.33);

  const importedLogs = await adapter2.getAuditLogs();
  assert.strictEqual(importedLogs.length, 1);
  assert.strictEqual(importedLogs[0].action, 'TEST_ROUNDTRIP');
});

// ==============================================================================
// 7. ZUSTAND STORE (useSalaryStore) ADVERSARIAL STRESS
// ==============================================================================

test('CHALLENGE-12: useSalaryStore importStateJson handles invalid and corrupted input safely', () => {
  const store = useSalaryStore.getState();
  const initialFirstName = store.contractor.first_name;

  // 1. Malformed JSON returns false and sets store error
  const success1 = store.importStateJson('{"broken json');
  assert.strictEqual(success1, false);
  assert.ok(useSalaryStore.getState().error !== null);
  // State must not be corrupted
  assert.strictEqual(useSalaryStore.getState().contractor.first_name, initialFirstName);

  // 2. Incomplete JSON returns false
  const success2 = store.importStateJson('{}');
  assert.strictEqual(success2, false);
  assert.ok(useSalaryStore.getState().error !== null);
  assert.strictEqual(useSalaryStore.getState().contractor.first_name, initialFirstName);

  // 3. Null primitive string returns false safely without throwing uncaught exception
  const success3 = store.importStateJson('null');
  assert.strictEqual(success3, false);
  assert.strictEqual(useSalaryStore.getState().contractor.first_name, initialFirstName);

  // 4. Valid JSON import updates store and recomputes calculations
  const validJson = JSON.stringify({
    profile: {
      ...store.contractor,
      first_name: 'นำเข้าสำเร็จ',
    },
    agency: store.agency,
    contract: {
      ...store.contract,
      monthly_salary: 24000.0,
    },
  });

  const success4 = store.importStateJson(validJson);
  assert.strictEqual(success4, true);
  assert.strictEqual(useSalaryStore.getState().error, null);
  assert.strictEqual(useSalaryStore.getState().contractor.first_name, 'นำเข้าสำเร็จ');
  assert.strictEqual(useSalaryStore.getState().contract.monthly_salary, 24000.0);
  // Recomputed daily rate: 24000 / 30 = 800
  assert.strictEqual(useSalaryStore.getState().currentPeriod.daily_rate, 800.0);
});

// ==============================================================================
// 8. ADVERSARIAL SECURITY & SPECIAL CHARACTERS
// ==============================================================================

test('CHALLENGE-13: Special characters, XSS vectors, and Unicode are safely stored without corruption', async () => {
  const adapter = new LocalStorageAdapter();

  const adversarialPayload = {
    first_name: '<script>alert("XSS")</script>',
    last_name: "O'Connor & Sons \"><img src=x onerror=alert(1)>",
    address_line1: '๑๒๓ ริมคลอง 💖 🏥 🇹🇭 \u0000\u001F',
    email: 'test+special@domain-hyphen.co.th',
  };

  await adapter.saveProfile(adversarialPayload);
  const reloaded = await adapter.getProfile();

  assert.strictEqual(reloaded.first_name, adversarialPayload.first_name);
  assert.strictEqual(reloaded.last_name, adversarialPayload.last_name);
  assert.strictEqual(reloaded.address_line1, adversarialPayload.address_line1);
  assert.strictEqual(reloaded.email, adversarialPayload.email);

  // Roundtrip through export/import
  const exported = await adapter.exportAllData();
  const adapter2 = new LocalStorageAdapter();
  await adapter2.importAllData(exported);

  const reloaded2 = await adapter2.getProfile();
  assert.strictEqual(reloaded2.first_name, adversarialPayload.first_name);
  assert.strictEqual(reloaded2.last_name, adversarialPayload.last_name);
});

// ==============================================================================
// 9. IMPORT ENTITY TYPE VALIDATION & CORRUPT DATA INGESTION
// ==============================================================================

test('CHALLENGE-14: [REMEDIATED] LocalStorageAdapter.importAllData validates entity types, rejecting primitives with Error', async () => {
  const adapter = new LocalStorageAdapter();

  // Payload with non-object entities
  const corruptPayload = JSON.stringify({
    profile: 'not_an_object',
    agency: 12345,
    contract: true,
  });

  // LocalStorageAdapter.importAllData checks that profile, agency, and contract are valid plain objects
  await assert.rejects(
    async () => {
      await adapter.importAllData(corruptPayload);
    },
    /Payload missing required entities: profile, agency, contract must be valid objects/,
    'CONFIRMED: importAllData strictly rejects primitive entities'
  );
});

// ==============================================================================
// 10. CONCURRENCY & RACE CONDITIONS
// ==============================================================================

test('CHALLENGE-15: Rapid concurrent profile updates resolve without race condition crashes', async () => {
  const adapter = new LocalStorageAdapter();

  // Execute 50 concurrent writes
  const writes = Array.from({ length: 50 }, (_, i) =>
    adapter.saveProfile({ phone_number: `08100000${String(i).padStart(2, '0')}` })
  );

  await Promise.all(writes);

  const finalProfile = await adapter.getProfile();
  assert.ok(finalProfile.phone_number.startsWith('08100000'));
  assert.strictEqual(finalProfile.first_name, '[ชื่อผู้รับจ้าง]', 'Baseline fields preserved during concurrent writes');
});
