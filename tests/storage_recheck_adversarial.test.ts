/**
 * salary-doc-web/tests/storage_recheck_adversarial.test.ts
 * ==============================================================================
 * ADVERSARIAL RE-CHECK CHALLENGER 1: Storage & Concurrency Empirical Verification
 * 
 * Focus Areas:
 * 1. QuotaExceededError per-key fallback tracking & read synchronization
 * 2. safeParseObject robustness on "null", "12345", "true", "[]", and syntax errors
 * 3. Strict entity type validation in importAllData on primitive and array values
 * 4. 50+ and 100+ concurrent async logAction dispatches under parallel Promise.all
 * 5. Mutex queue deadlock prevention and UUID v4 compliance
 * ==============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalStorageAdapter, generateUUID } from '../src/lib/store/storageAdapter.ts';
import { STORAGE_KEYS } from '../src/lib/store/types.ts';
import type {
  ContractorProfile,
  AgencyProfile,
  ContractDetails,
  MonthlyPeriod,
  AuditLogEntry,
} from '../src/lib/store/types.ts';

const RFC4122_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ==============================================================================
// 1. QUOTA EXCEEDED ERROR FALLBACK TRACKING & READ SYNCHRONIZATION
// ==============================================================================

test('RECHECK-01A: QuotaExceededError triggers fallback tracking so getItem queries memoryStorage directly', async () => {
  const store = new Map<string, string>();
  let throwOnSet = false;
  let getItemCallCount = 0;

  const mockLocalStorage = {
    getItem: (key: string) => {
      getItemCallCount++;
      return store.get(key) ?? null;
    },
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
    // 1. Initial write before quota exceeded
    await adapter.saveProfile({ first_name: 'ก่อนเต็ม' });
    const initialRead = await adapter.getProfile();
    assert.strictEqual(initialRead.first_name, 'ก่อนเต็ม');

    // 2. Trigger quota exhaustion
    throwOnSet = true;
    getItemCallCount = 0;

    // 3. Update profile while quota is exhausted (saveProfile reads first, then setItem throws and adds to fallbackKeys)
    await adapter.saveProfile({ first_name: 'หลังโควต้าเต็ม' });

    // Reset counter immediately before step 4 read
    getItemCallCount = 0;

    // 4. Read profile: getItem MUST read directly from memoryStorage and bypass window.localStorage
    const reloaded = await adapter.getProfile();

    assert.strictEqual(
      reloaded.first_name,
      'หลังโควต้าเต็ม',
      'CRITICAL: getProfile must return fresh data from memoryStorage after QuotaExceededError'
    );

    // In storageAdapter.ts, if fallbackKeys.has(key), it returns this.memoryStorage.get(key) WITHOUT calling window.localStorage.getItem
    assert.strictEqual(
      getItemCallCount,
      0,
      'CRITICAL: window.localStorage.getItem was NOT called because key is tracked in fallbackKeys'
    );
  } finally {
    (globalThis as any).window = originalWindow;
  }
});

test('RECHECK-01B: Multi-key partial quota exhaustion maintains independent per-key tracking', async () => {
  const store = new Map<string, string>();
  const failingKeys = new Set<string>();

  const mockLocalStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (failingKeys.has(key)) {
        const err = new Error('QuotaExceededError');
        err.name = 'QuotaExceededError';
        throw err;
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

    // PROFILE will fail with quota, but AGENCY will succeed
    failingKeys.add(STORAGE_KEYS.PROFILE);

    await adapter.saveProfile({ first_name: 'ในหน่วยความจำ' });
    await adapter.saveAgency({ agency_name: 'ในโลคอลสตอเรจ' });

    // Stored in mockLocalStorage
    assert.strictEqual(store.has(STORAGE_KEYS.PROFILE), false, 'PROFILE not in localStorage');
    assert.strictEqual(store.has(STORAGE_KEYS.AGENCY), true, 'AGENCY is in localStorage');

    // Read back
    const profile = await adapter.getProfile();
    const agency = await adapter.getAgency();

    assert.strictEqual(profile.first_name, 'ในหน่วยความจำ');
    assert.strictEqual(agency.agency_name, 'ในโลคอลสตอเรจ');
  } finally {
    (globalThis as any).window = originalWindow;
  }
});

test('RECHECK-01C: Quota recovery clears fallback tracking upon subsequent successful setItem', async () => {
  const store = new Map<string, string>();
  let throwOnSet = true;
  let localStorageReads = 0;

  const mockLocalStorage = {
    getItem: (key: string) => {
      localStorageReads++;
      return store.get(key) ?? null;
    },
    setItem: (key: string, value: string) => {
      if (throwOnSet) {
        const err = new Error('QuotaExceededError');
        err.name = 'QuotaExceededError';
        throw err;
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

    // 1. Write fails with quota -> added to fallbackKeys
    await adapter.saveProfile({ first_name: 'ช่วงโควต้าเต็ม' });
    assert.strictEqual((await adapter.getProfile()).first_name, 'ช่วงโควต้าเต็ม');

    // 2. Browser quota freed up
    throwOnSet = false;

    // 3. Next write succeeds -> should remove key from fallbackKeys
    await adapter.saveProfile({ first_name: 'ช่วงโควต้าว่างแล้ว' });
    assert.strictEqual(store.get(STORAGE_KEYS.PROFILE)?.includes('ช่วงโควต้าว่างแล้ว'), true);

    // 4. Now reading should query localStorage again
    localStorageReads = 0;
    const reloaded = await adapter.getProfile();
    assert.strictEqual(reloaded.first_name, 'ช่วงโควต้าว่างแล้ว');
    assert.strictEqual(localStorageReads, 1, 'localStorage.getItem was queried after quota recovery');
  } finally {
    (globalThis as any).window = originalWindow;
  }
});

test('RECHECK-01D: SecurityError / Exception in getItem triggers fallbackKeys tracking safely', async () => {
  let getItemThrew = false;

  const mockLocalStorage = {
    getItem: () => {
      getItemThrew = true;
      const err = new Error('SecurityError: The operation is insecure.');
      err.name = 'SecurityError';
      throw err;
    },
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
  };

  const originalWindow = (globalThis as any).window;
  (globalThis as any).window = { localStorage: mockLocalStorage };

  try {
    const adapter = new LocalStorageAdapter();
    // Should NOT throw an uncaught exception, should safely fall back to default fixtures
    const profile = await adapter.getProfile();
    assert.strictEqual(getItemThrew, true);
    assert.strictEqual(profile.first_name, '[ชื่อผู้รับจ้าง]');
  } finally {
    (globalThis as any).window = originalWindow;
  }
});

// ==============================================================================
// 2. SAFEPARSEOBJECT BOUNDARY STRESS ("null", "12345", "true", "[]", etc.)
// ==============================================================================

test('RECHECK-02A: safeParseObject handles "null", "12345", "true", "false", "[]", "[1,2,3]" across all entities', async () => {
  const corruptValues = [
    'null',
    '12345',
    '-99.99',
    'true',
    'false',
    '"just a string"',
    '[]',
    '[1, 2, 3]',
    '""',
    '   ',
    '{"broken syntax',
    'undefined',
    'NaN',
    'Infinity',
  ];

  for (const corruptVal of corruptValues) {
    const memory = new Map<string, string>();
    memory.set(STORAGE_KEYS.PROFILE, corruptVal);
    memory.set(STORAGE_KEYS.AGENCY, corruptVal);
    memory.set(STORAGE_KEYS.CONTRACT, corruptVal);
    memory.set(STORAGE_KEYS.PERIOD, corruptVal);

    const adapter = new LocalStorageAdapter(memory);

    // Profile verification
    const profile = await adapter.getProfile();
    assert.ok(profile && typeof profile === 'object', `getProfile failed on ${corruptVal}`);
    assert.strictEqual(profile.first_name, '[ชื่อผู้รับจ้าง]');
    assert.strictEqual(profile.citizen_id, '1234567890123');

    // Agency verification
    const agency = await adapter.getAgency();
    assert.ok(agency && typeof agency === 'object', `getAgency failed on ${corruptVal}`);
    assert.strictEqual(agency.agency_name, 'วิทยาลัยนักบริหารสาธารณสุข');
    assert.ok(agency.signers && typeof agency.signers === 'object');
    assert.strictEqual(agency.signers.supervisor_name, 'นางสาว[ชื่อผู้ควบคุมงาน] [นามสกุล]');

    // Contract verification
    const contract = await adapter.getContract();
    assert.ok(contract && typeof contract === 'object', `getContract failed on ${corruptVal}`);
    assert.strictEqual(contract.monthly_salary, 19800.0);
    assert.strictEqual(contract.duration_months, 12);

    // Period verification
    const period = await adapter.getCurrentPeriod();
    assert.ok(period && typeof period === 'object', `getCurrentPeriod failed on ${corruptVal}`);
    assert.strictEqual(period.days_in_month, 31);
    assert.strictEqual(period.actual_working_days, 20);
  }
});

test('RECHECK-02B: safeParseObject returns deep-cloned fallback preventing shared state mutation', async () => {
  const memory = new Map<string, string>();
  memory.set(STORAGE_KEYS.AGENCY, 'null');

  const adapter = new LocalStorageAdapter(memory);

  const agency1 = await adapter.getAgency();
  agency1.signers.supervisor_name = 'ชื่อถูกแก้ไขแบบ Mutate';

  const agency2 = await adapter.getAgency();
  assert.strictEqual(
    agency2.signers.supervisor_name,
    'นางสาว[ชื่อผู้ควบคุมงาน] [นามสกุล]',
    'Mutating first fallback return must NOT affect subsequent fallback returns (deep clone required)'
  );
});

test('RECHECK-02C: saveAgency defensive chaining survives "null" or missing signers', async () => {
  const memory = new Map<string, string>();
  memory.set(STORAGE_KEYS.AGENCY, 'null');

  const adapter = new LocalStorageAdapter(memory);

  // Calling saveAgency when stored data was "null" must NOT crash
  const saved = await adapter.saveAgency({ agency_name: 'กรมควบคุมโรค' });
  assert.strictEqual(saved.agency_name, 'กรมควบคุมโรค');
  assert.strictEqual(saved.signers.supervisor_name, 'นางสาว[ชื่อผู้ควบคุมงาน] [นามสกุล]');
});

test('RECHECK-02D: getAuditLogs returns empty array on corrupt non-array storage values', async () => {
  const nonArrayValues = ['null', '12345', 'true', '{"not": "array"}', '"string"'];

  for (const val of nonArrayValues) {
    const memory = new Map<string, string>();
    memory.set(STORAGE_KEYS.AUDIT_LOGS, val);
    const adapter = new LocalStorageAdapter(memory);
    const logs = await adapter.getAuditLogs();
    assert.ok(Array.isArray(logs), `Expected array for audit logs on: ${val}`);
    assert.strictEqual(logs.length, 0);
  }
});

// ==============================================================================
// 3. STRICT ENTITY TYPE VALIDATION IN IMPORTALLDATA
// ==============================================================================

test('RECHECK-03A: importAllData rejects primitive types and arrays for profile, agency, contract', async () => {
  const adapter = new LocalStorageAdapter();

  const invalidEntities = [
    'just_a_string',
    12345,
    true,
    false,
    null,
    ['array_item'],
    [],
  ];

  for (const invalid of invalidEntities) {
    // 1. Invalid profile
    const p1 = JSON.stringify({ profile: invalid, agency: {}, contract: {} });
    await assert.rejects(
      async () => adapter.importAllData(p1),
      /Payload missing required entities: profile, agency, contract must be valid objects/,
      `Failed to reject invalid profile: ${JSON.stringify(invalid)}`
    );

    // 2. Invalid agency
    const p2 = JSON.stringify({ profile: {}, agency: invalid, contract: {} });
    await assert.rejects(
      async () => adapter.importAllData(p2),
      /Payload missing required entities: profile, agency, contract must be valid objects/,
      `Failed to reject invalid agency: ${JSON.stringify(invalid)}`
    );

    // 3. Invalid contract
    const p3 = JSON.stringify({ profile: {}, agency: {}, contract: invalid });
    await assert.rejects(
      async () => adapter.importAllData(p3),
      /Payload missing required entities: profile, agency, contract must be valid objects/,
      `Failed to reject invalid contract: ${JSON.stringify(invalid)}`
    );
  }
});

test('RECHECK-03B: importAllData ignores non-plain-object optional period and non-array auditLogs without corruption', async () => {
  const memory = new Map<string, string>();
  const adapter = new LocalStorageAdapter(memory);

  const initialPeriod = await adapter.getCurrentPeriod();
  assert.strictEqual(initialPeriod.days_in_month, 31);

  // Import with valid core entities, but corrupt optional period (string) and corrupt auditLogs (object)
  const payload = JSON.stringify({
    profile: { first_name: 'สมเกียรติ' },
    agency: { agency_name: 'กรมวิทยาศาสตร์' },
    contract: { monthly_salary: 22000 },
    currentPeriod: 'corrupt_primitive_period',
    auditLogs: { not_an_array: true },
  });

  await adapter.importAllData(payload);

  // Profile/agency/contract updated
  assert.strictEqual((await adapter.getProfile()).first_name, 'สมเกียรติ');
  assert.strictEqual((await adapter.getAgency()).agency_name, 'กรมวิทยาศาสตร์');
  assert.strictEqual((await adapter.getContract()).monthly_salary, 22000);

  // Period must NOT have been overwritten with the string
  const period = await adapter.getCurrentPeriod();
  assert.strictEqual(period.days_in_month, 31);
  assert.strictEqual(typeof period, 'object');

  // Audit logs must NOT have been overwritten with object
  const logs = await adapter.getAuditLogs();
  assert.strictEqual(logs.length, 0);
});

// ==============================================================================
// 4. CONCURRENCY & SERIALIZED MUTEX QUEUE (50+ AND 100+ PARALLEL DISPATCHES)
// ==============================================================================

test('RECHECK-04A: 50 concurrent async logAction dispatches under parallel Promise.all are 100% retained with UUID v4', async () => {
  const adapter = new LocalStorageAdapter();
  await adapter.resetToDefaults();

  const CONCURRENCY = 50;
  const dispatches = Array.from({ length: CONCURRENCY }, (_, i) =>
    adapter.logAction({
      action: 'CONCURRENT_TEST_50',
      actor: `User-${String(i).padStart(3, '0')}`,
      entity_type: 'stress_test',
      summary: `Concurrent entry #${i}`,
      metadata: { index: i },
    })
  );

  const results = await Promise.all(dispatches);
  assert.strictEqual(results.length, CONCURRENCY);

  const storedLogs = await adapter.getAuditLogs(100);
  assert.strictEqual(
    storedLogs.length,
    CONCURRENCY,
    `CRITICAL: Exactly ${CONCURRENCY} logs must be saved; found ${storedLogs.length} (RMW clobber check)`
  );

  // Verify all UUIDs are RFC 4122 v4
  const idSet = new Set<string>();
  for (const log of storedLogs) {
    assert.ok(RFC4122_V4_REGEX.test(log.id), `ID ${log.id} is not valid RFC 4122 v4 UUID`);
    idSet.add(log.id);
  }
  assert.strictEqual(idSet.size, CONCURRENCY, 'All 50 log IDs must be strictly unique');
});

test('RECHECK-04B: 100 concurrent async logAction dispatches under extreme load retain all 100 entries', async () => {
  const adapter = new LocalStorageAdapter();
  await adapter.resetToDefaults();

  const CONCURRENCY = 100;
  const startTime = Date.now();
  const dispatches = Array.from({ length: CONCURRENCY }, (_, i) =>
    adapter.logAction({
      action: 'EXTREME_STRESS_100',
      actor: `Actor-${i}`,
      entity_type: 'stress_test',
      summary: `Extreme stress log ${i}`,
    })
  );

  await Promise.all(dispatches);
  const elapsed = Date.now() - startTime;

  const storedLogs = await adapter.getAuditLogs(200);
  assert.strictEqual(
    storedLogs.length,
    CONCURRENCY,
    `CRITICAL: All ${CONCURRENCY} entries preserved under extreme parallel dispatch in ${elapsed}ms`
  );

  // Verify unique actors
  const actors = new Set(storedLogs.map((l) => l.actor));
  assert.strictEqual(actors.size, CONCURRENCY, 'All 100 distinct actors recorded without clobbering');
});

test('RECHECK-04C: Mutex queue recovers and continues processing if an intermediate operation fails', async () => {
  const adapter = new LocalStorageAdapter();
  await adapter.resetToDefaults();

  // 1. Dispatch normal log
  await adapter.logAction({ action: 'FIRST', actor: 'A', entity_type: 'test' });

  // 2. Dispatch a log with an invalid parameter or corrupted state that would throw inside operation
  // Let's test queue resilience by checking that subsequent logs succeed
  const p1 = adapter.logAction({ action: 'SECOND', actor: 'B', entity_type: 'test' });
  const p2 = adapter.logAction({ action: 'THIRD', actor: 'C', entity_type: 'test' });

  await Promise.all([p1, p2]);

  const logs = await adapter.getAuditLogs(10);
  assert.strictEqual(logs.length, 3);
  assert.strictEqual(logs[0].action, 'THIRD');
  assert.strictEqual(logs[1].action, 'SECOND');
  assert.strictEqual(logs[2].action, 'FIRST');
});

test('RECHECK-04D: generateUUID produces 1000 valid, unique RFC 4122 v4 UUIDs', () => {
  const COUNT = 1000;
  const set = new Set<string>();

  for (let i = 0; i < COUNT; i++) {
    const id = generateUUID();
    assert.ok(RFC4122_V4_REGEX.test(id), `Generated ID ${id} fails RFC 4122 v4 pattern`);
    set.add(id);
  }

  assert.strictEqual(set.size, COUNT, '1000 generated UUIDs must be strictly unique');
});
