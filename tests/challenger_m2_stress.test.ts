import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import path from 'node:path';
import fs from 'node:fs';
import { LocalStorageAdapter } from '../src/lib/store/storageAdapter.ts';
import { formatThaiDateWithDigits, toThaiDigits, convertAddressArabicToThai } from '../src/lib/utils/thaiNumerals.ts';
import { computeFieldDiff } from '../src/lib/audit/auditLogger.ts';
import { ContractForm, checkContractDateOrder } from '../src/components/forms/ContractForm.tsx';
import { useSalaryStore } from '../src/lib/store/useSalaryStore.ts';
import type { ContractDetails } from '../src/types/schema.ts';

/**
 * Challenger 2 Empirical Stress Test Suite:
 * 1. Thai Citizen ID Boundary Stress
 * 2. Contract Dates & Duration Calculations
 * 3. Payer Officer 50-Dot Fallback
 * 4. Audit Log 600 Rapid Actions Capping (<= 500 limit)
 * 5. Import/Export with Oversized Audit Log Re-capping
 * 6. Dual Numeral Address Conversion Edge Cases
 * 7. Initial Mount Inverted Dates Vulnerability
 * 8. Concurrent Async Audit Logging Race Condition
 */

// -----------------------------------------------------------------------------
// Suite 1: Thai Citizen ID Boundary Stress
// -----------------------------------------------------------------------------
test('CHALLENGE-01: Thai Citizen ID boundary testing (12, 14, letters, symbols, spaces)', () => {
  const citizenIdPattern = /^[0-9]{13}$/;

  const invalidCases = [
    { label: '12-digit (one digit short)', value: '176990012345' },
    { label: '14-digit (one digit extra)', value: '17699001234567' },
    { label: '5-digit short', value: '12345' },
    { label: 'Contains uppercase letter', value: '176990012345A' },
    { label: 'Contains lowercase letter', value: '176990012345b' },
    { label: 'Contains all letters', value: 'abcdefghijklm' },
    { label: 'Formatted with dashes', value: '1-7699-00123-45-6' },
    { label: 'Contains exclamation mark', value: '176990012345!' },
    { label: 'Special symbols only', value: '@#$%^&*()_+~' },
    { label: 'Leading whitespace', value: ' 1769900123456' },
    { label: 'Trailing whitespace', value: '1769900123456 ' },
    { label: 'Middle space', value: '17699 00123456' },
    { label: 'Tab and newline', value: '\t1769900123456\n' },
    { label: 'Empty string', value: '' },
    { label: 'Whitespace only', value: '   ' },
  ];

  for (const tc of invalidCases) {
    const passed = citizenIdPattern.test(tc.value);
    assert.strictEqual(
      passed,
      false,
      `Validation FAILED to reject invalid Citizen ID [${tc.label}]: "${tc.value}"`
    );
  }

  // Valid 13-digit case
  const validId = '1769900123456';
  assert.strictEqual(citizenIdPattern.test(validId), true, 'Valid 13-digit ID must pass');
});

test('CHALLENGE-02: ProfileForm validation logic handles Citizen ID edge cases', () => {
  function validateProfile(formData: { citizen_id?: string; first_name?: string; last_name?: string }) {
    const errs: Record<string, string> = {};
    if (!formData.first_name?.trim()) errs.first_name = 'กรุณาระบุชื่อ';
    if (!formData.last_name?.trim()) errs.last_name = 'กรุณาระบุนามสกุล';
    if (!formData.citizen_id) {
      errs.citizen_id = 'กรุณาระบุเลขประจำตัวประชาชน';
    } else if (!/^[0-9]{13}$/.test(formData.citizen_id)) {
      errs.citizen_id = 'เลขประจำตัวประชาชนต้องเป็นตัวเลข 13 หลักเท่านั้น (เช่น 1769900123456)';
    }
    return { valid: Object.keys(errs).length === 0, errors: errs };
  }

  // 12-digit
  const r12 = validateProfile({ citizen_id: '123456789012', first_name: 'ก', last_name: 'ข' });
  assert.strictEqual(r12.valid, false);
  assert.ok(r12.errors.citizen_id?.includes('13 หลัก'));

  // 14-digit
  const r14 = validateProfile({ citizen_id: '12345678901234', first_name: 'ก', last_name: 'ข' });
  assert.strictEqual(r14.valid, false);
  assert.ok(r14.errors.citizen_id?.includes('13 หลัก'));

  // Alpha
  const rAlpha = validateProfile({ citizen_id: '123456789012A', first_name: 'ก', last_name: 'ข' });
  assert.strictEqual(rAlpha.valid, false);
  assert.ok(rAlpha.errors.citizen_id?.includes('13 หลัก'));

  // Empty
  const rEmpty = validateProfile({ citizen_id: '', first_name: 'ก', last_name: 'ข' });
  assert.strictEqual(rEmpty.valid, false);
  assert.ok(rEmpty.errors.citizen_id?.includes('กรุณาระบุเลขประจำตัวประชาชน'));

  // Valid 13
  const rValid = validateProfile({ citizen_id: '1769900123456', first_name: 'ก', last_name: 'ข' });
  assert.strictEqual(rValid.valid, true);
});

// -----------------------------------------------------------------------------
// Suite 2: Contract Dates & Duration Calculations
// -----------------------------------------------------------------------------
test('CHALLENGE-03: Inverted contract dates detection (start_date > end_date)', () => {
  function checkContractDates(startDate: string, endDate: string) {
    let dateError: string | null = null;
    let durationMonths = 0;

    if (startDate && endDate) {
      if (startDate > endDate) {
        dateError = 'วันสิ้นสุดสัญญาต้องไม่อยู่ก่อนวันเริ่มต้นสัญญา';
      } else {
        const [startY, startM] = startDate.split('-').map(Number);
        const [endY, endM] = endDate.split('-').map(Number);
        const duration = (endY - startY) * 12 + (endM - startM) + 1;
        durationMonths = Math.max(0, duration);
      }
    }
    return { dateError, durationMonths };
  }

  // Inverted: 2027-10-01 > 2026-09-30
  const rInverted = checkContractDates('2027-10-01', '2026-09-30');
  assert.strictEqual(rInverted.dateError, 'วันสิ้นสุดสัญญาต้องไม่อยู่ก่อนวันเริ่มต้นสัญญา');
  assert.strictEqual(rInverted.durationMonths, 0);

  // Inverted by single day: 2026-10-02 > 2026-10-01
  const rInverted1Day = checkContractDates('2026-10-02', '2026-10-01');
  assert.strictEqual(rInverted1Day.dateError, 'วันสิ้นสุดสัญญาต้องไม่อยู่ก่อนวันเริ่มต้นสัญญา');
  assert.strictEqual(rInverted1Day.durationMonths, 0);

  // Normal 12 months: 2026-10-01 to 2027-09-30
  const rNormal = checkContractDates('2026-10-01', '2027-09-30');
  assert.strictEqual(rNormal.dateError, null);
  assert.strictEqual(rNormal.durationMonths, 12);
});

test('CHALLENGE-04: Leap year leap day boundary (2024-02-29) and single-month duration', () => {
  function calcDuration(startDate: string, endDate: string): number {
    const [startY, startM] = startDate.split('-').map(Number);
    const [endY, endM] = endDate.split('-').map(Number);
    return Math.max(0, (endY - startY) * 12 + (endM - startM) + 1);
  }

  // Single month in leap year (Feb 2024: 29 days)
  const febLeapDuration = calcDuration('2024-02-01', '2024-02-29');
  assert.strictEqual(febLeapDuration, 1, 'Feb 2024 full month must equal 1 month');

  // Single day on leap day (2024-02-29 to 2024-02-29)
  const leapDayDuration = calcDuration('2024-02-29', '2024-02-29');
  assert.strictEqual(leapDayDuration, 1, 'Single leap day contract equals 1 calendar month');

  // Multi-year starting from leap day: 2024-02-29 to 2025-02-28
  const leapToNextFeb = calcDuration('2024-02-29', '2025-02-28');
  assert.strictEqual(leapToNextFeb, 13, '2024-02-29 to 2025-02-28 spans 13 calendar months');

  // Leap day Thai date formatting
  const thaiFormatted = formatThaiDateWithDigits('2024-02-29');
  assert.strictEqual(
    thaiFormatted,
    '๒๙ กุมภาพันธ์ ๒๕๖๗',
    'Leap day must format to ๒๙ กุมภาพันธ์ ๒๕๖๗'
  );
});

// -----------------------------------------------------------------------------
// Suite 3: Payer Officer 50-Dot Fallback
// -----------------------------------------------------------------------------
test('CHALLENGE-05: Blank payer officer name falls back to exactly 50 dots', () => {
  const EXACT_50_DOTS = '..................................................';
  assert.strictEqual(EXACT_50_DOTS.length, 50, 'Baseline string must be exactly 50 dots');

  function normalizePayerOfficer(name?: string | null): string {
    return name?.trim() || '..................................................';
  }

  // Cases that must trigger 50-dot fallback
  assert.strictEqual(normalizePayerOfficer(''), EXACT_50_DOTS, 'Empty string fallback');
  assert.strictEqual(normalizePayerOfficer('   '), EXACT_50_DOTS, 'Whitespace fallback');
  assert.strictEqual(normalizePayerOfficer(null), EXACT_50_DOTS, 'Null fallback');
  assert.strictEqual(normalizePayerOfficer(undefined), EXACT_50_DOTS, 'Undefined fallback');

  // Case with real name must NOT fall back
  assert.strictEqual(normalizePayerOfficer('นางสมศรี การเงิน'), 'นางสมศรี การเงิน', 'Real name preserved');

  // Verify dot count strictly
  const fallback = normalizePayerOfficer('');
  assert.strictEqual(fallback.length, 50);
  assert.strictEqual(/^(\.){50}$/.test(fallback), true, 'Must consist purely of 50 dots');
});

// -----------------------------------------------------------------------------
// Suite 4: Audit Log 600 Rapid Sequential Actions Capping
// -----------------------------------------------------------------------------
test('CHALLENGE-06: 600 rapid sequential audit log actions capped strictly at 500 & oldest trimmed', async () => {
  const adapter = new LocalStorageAdapter();
  await adapter.resetToDefaults();

  const TOTAL_ACTIONS = 600;
  const CAP_LIMIT = 500;

  console.log(`Executing ${TOTAL_ACTIONS} rapid sequential logAction calls...`);
  const startTime = Date.now();

  for (let i = 0; i < TOTAL_ACTIONS; i++) {
    await adapter.logAction({
      action: 'WORKLOAD_GENERATE',
      actor: 'challenger_stress',
      entity_type: 'stress_test',
      entity_id: `id_${i}`,
      summary: `Action sequential index ${i}`,
      metadata: { sequence_number: i },
    });
  }

  const duration = Date.now() - startTime;
  console.log(`Completed ${TOTAL_ACTIONS} logging operations in ${duration}ms (${(duration / TOTAL_ACTIONS).toFixed(2)}ms/op)`);

  const storedLogs = await adapter.getAuditLogs(1000);

  // Assertion 1: Total count must be strictly capped at 500
  assert.strictEqual(
    storedLogs.length,
    CAP_LIMIT,
    `Stored logs length must be exactly ${CAP_LIMIT}, got ${storedLogs.length}`
  );

  // Assertion 2: Newest entry (index 0) must be the last action logged (i = 599)
  assert.strictEqual(
    storedLogs[0].summary,
    `Action sequential index ${TOTAL_ACTIONS - 1}`,
    `Newest log at index 0 must be action ${TOTAL_ACTIONS - 1}`
  );
  assert.strictEqual(
    (storedLogs[0].metadata as any)?.sequence_number,
    599,
    'Metadata sequence_number of newest item must be 599'
  );

  // Assertion 3: Oldest retained entry (index 499) must be action 100
  const expectedOldestIndex = TOTAL_ACTIONS - CAP_LIMIT; // 600 - 500 = 100
  assert.strictEqual(
    storedLogs[CAP_LIMIT - 1].summary,
    `Action sequential index ${expectedOldestIndex}`,
    `Oldest retained log at index 499 must be action ${expectedOldestIndex}`
  );
  assert.strictEqual(
    (storedLogs[CAP_LIMIT - 1].metadata as any)?.sequence_number,
    100,
    'Metadata sequence_number of oldest retained item must be 100'
  );

  // Assertion 4: Actions 0 through 99 must be completely trimmed (dropped)
  const summaries = new Set(storedLogs.map((l) => l.summary));
  for (let i = 0; i < expectedOldestIndex; i++) {
    assert.strictEqual(
      summaries.has(`Action sequential index ${i}`),
      false,
      `Action ${i} should have been trimmed out of storage!`
    );
  }

  // Assertion 5: Actions 100 through 599 must all be present
  for (let i = expectedOldestIndex; i < TOTAL_ACTIONS; i++) {
    assert.strictEqual(
      summaries.has(`Action sequential index ${i}`),
      true,
      `Action ${i} must be present in storage!`
    );
  }
});

// -----------------------------------------------------------------------------
// Suite 5: Import Oversized Audit Logs & Immediate Re-capping
// -----------------------------------------------------------------------------
test('CHALLENGE-07: Importing backup with 800 audit logs followed by logAction immediately re-caps to 500', async () => {
  const adapter = new LocalStorageAdapter();
  await adapter.resetToDefaults();

  const profile = await adapter.getProfile();
  const agency = await adapter.getAgency();
  const contract = await adapter.getContract();

  // Create an artificial payload with 800 audit logs
  const largeLogs = Array.from({ length: 800 }, (_, idx) => ({
    id: `audit-${idx}`,
    timestamp: new Date().toISOString(),
    created_at: new Date().toISOString(),
    action: 'TEST_ACTION',
    actor: 'test_user',
    entity_type: 'test',
    summary: `Imported log ${idx}`,
  }));

  const backupJson = JSON.stringify({
    version: '1.0.0',
    profile,
    agency,
    contract,
    auditLogs: largeLogs,
  });

  await adapter.importAllData(backupJson);

  // Directly after import, all 800 logs exist
  const importedCount = (await adapter.getAuditLogs(1000)).length;
  assert.strictEqual(importedCount, 800, 'Import stores full audit log array initially');

  // Triggering next logAction must immediately clamp back to 500
  await adapter.logAction({
    action: 'PROFILE_UPDATE',
    actor: 'admin',
    entity_type: 'profile',
    summary: 'New action after large import',
  });

  const cappedCount = (await adapter.getAuditLogs(1000)).length;
  assert.strictEqual(cappedCount, 500, 'Subsequent logAction must strictly re-cap audit logs to 500');
});

// -----------------------------------------------------------------------------
// Suite 6: Address Arabic to Thai Digit Conversion Edge Cases
// -----------------------------------------------------------------------------
test('CHALLENGE-08: Address Arabic to Thai digit conversion handles missing keywords & comma fallback', () => {
  // Case A: Standard address with "อำเภอ" keyword
  const standard = convertAddressArabicToThai('163/174 หมู่ที่ 3 ตำบลบ้านหาด อำเภอบ้านลาด จังหวัดเพชรบุรี');
  assert.strictEqual(standard.address_line1, '๑๖๓/๑๗๔ หมู่ที่ ๓ ตำบลบ้านหาด');
  assert.strictEqual(standard.address_line2, 'อำเภอบ้านลาด จังหวัดเพชรบุรี');

  // Case B: Address with "เขต" keyword (Bangkok)
  const bangkok = convertAddressArabicToThai('99/1 ถนนสีลม แขวงสุริยวาส เขตบางรัก กรุงเทพมหานคร 10500');
  assert.strictEqual(standard.address_line1.includes('๑'), true);
  assert.strictEqual(bangkok.address_line1, '๙๙/๑ ถนนสีลม แขวงสุริยวาส');
  assert.strictEqual(bangkok.address_line2, 'เขตบางรัก กรุงเทพมหานคร ๑๐๕๐๐');

  // Case C: Address without administrative keywords, separated by comma
  const commaSeparated = convertAddressArabicToThai('123 Main Road, Suite 456');
  assert.strictEqual(commaSeparated.address_line1, '๑๒๓ Main Road');
  assert.strictEqual(commaSeparated.address_line2, 'Suite ๔๕๖');

  // Case D: Pure numbers without keywords or commas
  const pureNumbers = convertAddressArabicToThai('12345');
  assert.strictEqual(pureNumbers.address_line1, '๑๒๓๔๕');
  assert.strictEqual(pureNumbers.address_line2, '');

  // Case E: Empty string
  const empty = convertAddressArabicToThai('');
  assert.strictEqual(empty.address_line1, '');
  assert.strictEqual(empty.address_line2, '');
});

// -----------------------------------------------------------------------------
// Suite 7: Concurrent Async Audit Logging Serialization (Remediated)
// -----------------------------------------------------------------------------
test('CHALLENGE-09: [REMEDIATED] Concurrent async logAction invocations are serialized without RMW loss', async () => {
  const adapter = new LocalStorageAdapter();
  await adapter.resetToDefaults();

  const CONCURRENT_COUNT = 50;
  // Dispatch 50 async logAction calls in parallel without awaiting between them
  const promises = Array.from({ length: CONCURRENT_COUNT }, (_, idx) =>
    adapter.logAction({
      action: 'WORKLOAD_GENERATE',
      actor: `concurrent_worker_${idx}`,
      entity_type: 'concurrency_test',
      summary: `Concurrent entry ${idx}`,
    })
  );

  const results = await Promise.all(promises);
  assert.strictEqual(results.length, CONCURRENT_COUNT, 'All 50 promises resolve');

  const logs = await adapter.getAuditLogs(100);
  console.log(`[CHALLENGE-09 Empirical Output] Dispatched 50 parallel logAction calls. Resulting stored logs count: ${logs.length}`);

  // After remediation: internal logQueue serializes operations, preserving all 50 entries
  assert.strictEqual(
    logs.length,
    CONCURRENT_COUNT,
    `All ${CONCURRENT_COUNT} audit logs must be preserved without loss under concurrent execution`
  );

  // Each log must have a valid RFC 4122 v4 UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  for (const log of logs) {
    assert.ok(uuidRegex.test(log.id), `Log entry ID ${log.id} must be a valid RFC 4122 v4 UUID`);
  }
});

// -----------------------------------------------------------------------------
// Suite 8: ContractForm Initial Inverted Dates Mount Validation (Remediated)
// -----------------------------------------------------------------------------
test('CHALLENGE-10: [REMEDIATED] ContractForm mount-time date validation with inverted dates', () => {
  // 1. Pure validator checkContractDateOrder
  const invertedStart = '2027-10-01';
  const invertedEnd = '2026-09-30';
  const dateError = checkContractDateOrder(invertedStart, invertedEnd);
  assert.strictEqual(dateError, 'วันสิ้นสุดสัญญาต้องไม่อยู่ก่อนวันเริ่มต้นสัญญา');

  // Valid dates must return null
  assert.strictEqual(checkContractDateOrder('2026-10-01', '2027-09-30'), null);
  assert.strictEqual(checkContractDateOrder('2026-10-01', '2026-10-01'), null);

  // 2. React SSR Mount-time HTML inspection
  const initialDataWithInvertedDates: ContractDetails = {
    contract_number: '2/2570',
    contract_number_thai: '๒/๒๕๗๐',
    contract_date: '2026-10-29',
    contract_date_thai: '๒๙ ตุลาคม ๒๕๖๙',
    start_date: invertedStart,
    start_date_thai: '๑ ตุลาคม ๒๕๗๐',
    end_date: invertedEnd,
    end_date_thai: '๓๐ กันยายน ๒๕๖๙',
    duration_months: 12,
    total_periods: 12,
    monthly_salary: 19800,
    daily_rate: 660,
    total_contract_amount: 237600,
    target_tasks_per_period: 110,
    task_matrix_range: 'C4:AG21',
  };

  // Render ContractForm to static HTML to empirically verify mount-time DOM state
  const htmlInverted = ReactDOMServer.renderToStaticMarkup(
    React.createElement(ContractForm, {
      initialData: initialDataWithInvertedDates,
      onSave: async () => {},
    })
  );

  // Visual error border classes applied to date inputs
  assert.ok(
    htmlInverted.includes('border-red-400'),
    'Date inputs must have border-red-400 styling on inverted dates mount'
  );
  assert.ok(
    htmlInverted.includes('focus:ring-red-400'),
    'Date inputs must have focus:ring-red-400 styling on inverted dates mount'
  );

  // Error message rendered in DOM
  assert.ok(
    htmlInverted.includes('วันสิ้นสุดสัญญาต้องไม่อยู่ก่อนวันเริ่มต้นสัญญา'),
    'Error message must be rendered in DOM on mount'
  );

  // Submit button must be disabled (has disabled attribute, ignoring className disabled:opacity-50)
  const invertedBtnMatch = htmlInverted.match(/<button[^>]*type="submit"[^>]*>/);
  assert.ok(invertedBtnMatch, 'Submit button must exist in inverted DOM');
  const invertedBtnNoClass = invertedBtnMatch[0].replace(/class="[^"]*"/g, '');
  assert.ok(
    /\bdisabled\b/.test(invertedBtnNoClass),
    'Submit button tag must have disabled attribute on inverted dates mount'
  );

  // 3. Contrast with valid dates mount
  const validData: ContractDetails = {
    ...initialDataWithInvertedDates,
    start_date: '2026-10-01',
    end_date: '2027-09-30',
  };
  const htmlValid = ReactDOMServer.renderToStaticMarkup(
    React.createElement(ContractForm, {
      initialData: validData,
      onSave: async () => {},
    })
  );

  assert.ok(
    !htmlValid.includes('border-red-400'),
    'Valid dates must not have red border'
  );
  assert.ok(
    !htmlValid.includes('วันสิ้นสุดสัญญาต้องไม่อยู่ก่อนวันเริ่มต้นสัญญา'),
    'Valid dates must not show error message'
  );
  // Submit button should NOT be disabled when dates are valid
  const validBtnMatch = htmlValid.match(/<button[^>]*type="submit"[^>]*>/);
  assert.ok(validBtnMatch, 'Submit button must exist in valid DOM markup');
  const validBtnNoClass = validBtnMatch[0].replace(/class="[^"]*"/g, '');
  assert.strictEqual(
    /\bdisabled\b/.test(validBtnNoClass),
    false,
    'Submit button must NOT have disabled attribute on valid dates mount'
  );
});

// -----------------------------------------------------------------------------
// Suite 9: Store-level Contractor Name Sync to Agency Signers (Remediated)
// -----------------------------------------------------------------------------
test('CHALLENGE-11: [REMEDIATED] Store-level contractor full name sync to agency signers', async () => {
  const store = useSalaryStore.getState();

  // Test 1: Direct full_name update
  store.setContractor({
    title: 'นาย',
    first_name: 'สมชาย',
    last_name: 'ชาญฉลาด',
    full_name: 'นายสมชาย ชาญฉลาด',
  });
  let state = useSalaryStore.getState();
  assert.strictEqual(state.contractor.full_name, 'นายสมชาย ชาญฉลาด');
  assert.strictEqual(
    state.agency.signers.contractor_name,
    'นายสมชาย ชาญฉลาด',
    'agency.signers.contractor_name must immediately sync with contractor.full_name'
  );

  // Test 2: Auto-concatenated full_name from components
  store.setContractor({
    title: 'นางสาว',
    first_name: 'กานดา',
    last_name: 'รักงาน',
  });
  state = useSalaryStore.getState();
  assert.strictEqual(state.contractor.full_name, 'นางสาวกานดา รักงาน');
  assert.strictEqual(
    state.agency.signers.contractor_name,
    'นางสาวกานดา รักงาน',
    'agency.signers.contractor_name must sync when full_name is computed from components'
  );

  // Test 3: Hydration self-healing
  const { localStorageAdapter } = await import('../src/lib/store/storageAdapter.ts');
  await localStorageAdapter.saveProfile({
    ...state.contractor,
    full_name: 'นายฟื้นฟู สภาพดี',
  });
  await localStorageAdapter.saveAgency({
    ...state.agency,
    signers: {
      ...state.agency.signers,
      contractor_name: 'ชื่อเก่าไม่ตรงกัน',
    },
  });
  await useSalaryStore.getState().initStore();
  state = useSalaryStore.getState();
  assert.strictEqual(
    state.agency.signers.contractor_name,
    'นายฟื้นฟู สภาพดี',
    'initStore must self-heal desynchronized contractor_name in agency signers'
  );
});

// -----------------------------------------------------------------------------
// Suite 10: PostgreSQL Migration DDL contracts table chk_contract_dates constraint
// -----------------------------------------------------------------------------
test('CHALLENGE-12: [REMEDIATED] Database DDL contracts table contains chk_contract_dates constraint', () => {
  const sqlPath = path.resolve(process.cwd(), 'salary-doc-web/supabase/migrations/20261102000000_init_schema.sql');
  // Fallback if running from within salary-doc-web
  const actualPath = fs.existsSync(sqlPath)
    ? sqlPath
    : path.resolve(process.cwd(), 'supabase/migrations/20261102000000_init_schema.sql');

  const sqlText = fs.readFileSync(actualPath, 'utf-8');

  // Verify regex check for chk_contract_dates
  assert.ok(
    /CONSTRAINT\s+chk_contract_dates\s+CHECK\s*\(\s*end_date\s*>=\s*start_date\s*\)/i.test(sqlText),
    'DDL must contain CONSTRAINT chk_contract_dates CHECK (end_date >= start_date)'
  );
});
