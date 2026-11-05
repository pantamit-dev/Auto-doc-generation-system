import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import path from 'node:path';
import fs from 'node:fs';
import { ContractForm, checkContractDateOrder } from '../src/components/forms/ContractForm.tsx';
import { useSalaryStore } from '../src/lib/store/useSalaryStore.ts';
import { LocalStorageAdapter, localStorageAdapter, generateUUID } from '../src/lib/store/storageAdapter.ts';
import { STORAGE_KEYS } from '../src/lib/store/types.ts';
import { DEFAULT_CONTRACT_DETAILS } from '../src/lib/store/defaultData.ts';
import type { ContractDetails } from '../src/types/schema.ts';

/**
 * Milestone 2 Re-check Challenger 2 Empirical Stress & Adversarial Suite:
 * Focus Areas:
 * 1. ContractForm Mount-Time Inverted Date Validation, Submit Guard, Error Borders
 * 2. PostgreSQL DDL AST Constraint Validation (chk_contract_dates)
 * 3. Store-Level Contractor Full Name Sync to Agency Signers (Mutations, Hydration, Import)
 * 4. Concurrent Audit Log Mutex Serialization & RFC 4122 v4 UUID
 */

// -----------------------------------------------------------------------------
// Test Group 1: ContractForm Mount-Time Validation & Boundary Stress
// -----------------------------------------------------------------------------
test('RECHECK-01: checkContractDateOrder boundary tests', () => {
  // Inverted dates: start after end
  assert.strictEqual(
    checkContractDateOrder('2027-10-01', '2026-09-30'),
    'วันสิ้นสุดสัญญาต้องไม่อยู่ก่อนวันเริ่มต้นสัญญา'
  );
  assert.strictEqual(
    checkContractDateOrder('2026-10-02', '2026-10-01'),
    'วันสิ้นสุดสัญญาต้องไม่อยู่ก่อนวันเริ่มต้นสัญญา'
  );

  // Chronologically valid dates
  assert.strictEqual(checkContractDateOrder('2026-10-01', '2027-09-30'), null);
  assert.strictEqual(checkContractDateOrder('2026-10-01', '2026-10-02'), null);
  assert.strictEqual(checkContractDateOrder('2026-10-01', '2026-10-01'), null); // Same-day contract

  // Incomplete / undefined dates
  assert.strictEqual(checkContractDateOrder(undefined, '2027-09-30'), null);
  assert.strictEqual(checkContractDateOrder('2026-10-01', undefined), null);
  assert.strictEqual(checkContractDateOrder(undefined, undefined), null);
  assert.strictEqual(checkContractDateOrder('', ''), null);
});

test('RECHECK-02: ContractForm mount with inverted dates immediately applies error state in DOM', () => {
  const invertedContract: ContractDetails = {
    ...DEFAULT_CONTRACT_DETAILS,
    start_date: '2027-10-01',
    end_date: '2026-09-30',
    start_date_thai: '๑ ตุลาคม ๒๕๗๐',
    end_date_thai: '๓๐ กันยายน ๒๕๖๙',
  };

  let savedData: ContractDetails | null = null;
  const onSave = (data: ContractDetails) => {
    savedData = data;
  };

  // Render to static HTML representing initial component mount
  const html = ReactDOMServer.renderToStaticMarkup(
    React.createElement(ContractForm, {
      initialData: invertedContract,
      onSave,
      isLoading: false,
    })
  );

  // 1. Visual error border classes applied to both inputs
  assert.ok(
    html.includes('border-red-400 focus:ring-red-400'),
    'Input fields must have border-red-400 and focus:ring-red-400 classes'
  );

  // 2. Thai error text rendered
  assert.ok(
    html.includes('วันสิ้นสุดสัญญาต้องไม่อยู่ก่อนวันเริ่มต้นสัญญา'),
    'Thai error message must appear in the rendered HTML'
  );

  // 3. Submit button disabled attribute
  const submitBtnMatch = html.match(/<button[^>]*type="submit"[^>]*>/);
  assert.ok(submitBtnMatch, 'Submit button must exist in HTML');
  const submitBtnNoClass = submitBtnMatch[0].replace(/class="[^"]*"/g, '');
  assert.ok(
    /\bdisabled\b/.test(submitBtnNoClass),
    'Submit button tag must possess the disabled attribute on inverted mount'
  );

  // 4. OnSave must NOT have been called
  assert.strictEqual(savedData, null, 'onSave must not be executed during mount');
});

test('RECHECK-03: ContractForm mount with valid dates has clean DOM without error borders', () => {
  const validContract: ContractDetails = {
    ...DEFAULT_CONTRACT_DETAILS,
    start_date: '2026-10-01',
    end_date: '2027-09-30',
  };

  const html = ReactDOMServer.renderToStaticMarkup(
    React.createElement(ContractForm, {
      initialData: validContract,
      onSave: () => {},
      isLoading: false,
    })
  );

  assert.ok(!html.includes('border-red-400'), 'Must not contain border-red-400 class');
  assert.ok(
    !html.includes('วันสิ้นสุดสัญญาต้องไม่อยู่ก่อนวันเริ่มต้นสัญญา'),
    'Must not contain error message'
  );

  const submitBtnMatch = html.match(/<button[^>]*type="submit"[^>]*>/);
  assert.ok(submitBtnMatch, 'Submit button must exist in HTML');
  const submitBtnNoClass = submitBtnMatch[0].replace(/class="[^"]*"/g, '');
  assert.strictEqual(
    /\bdisabled\b/.test(submitBtnNoClass),
    false,
    'Submit button must NOT have disabled attribute on valid mount'
  );
});

// -----------------------------------------------------------------------------
// Test Group 2: PostgreSQL DDL Migration AST Check Constraint
// -----------------------------------------------------------------------------
test('RECHECK-04: PostgreSQL migration DDL defines chk_contract_dates check constraint', () => {
  const possiblePaths = [
    path.resolve(process.cwd(), 'salary-doc-web/supabase/migrations/20261102000000_init_schema.sql'),
    path.resolve(process.cwd(), 'supabase/migrations/20261102000000_init_schema.sql'),
  ];
  const migrationPath = possiblePaths.find((p) => fs.existsSync(p));
  assert.ok(migrationPath, 'Migration SQL file must exist');

  const sqlContent = fs.readFileSync(migrationPath, 'utf-8');

  // Regex asserting chk_contract_dates constraint in CREATE TABLE contracts
  const constraintRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?contracts\s*\([\s\S]*?CONSTRAINT\s+chk_contract_dates\s+CHECK\s*\(\s*end_date\s*>=\s*start_date\s*\)[\s\S]*?\);/i;
  assert.ok(
    constraintRegex.test(sqlContent),
    'Table contracts must define CONSTRAINT chk_contract_dates CHECK (end_date >= start_date)'
  );
});

// -----------------------------------------------------------------------------
// Test Group 3: Store-Level Contractor Name Synchronization to Agency Signers
// -----------------------------------------------------------------------------
test('RECHECK-05: Store synchronizes contractor full_name with agency.signers.contractor_name', async () => {
  const store = useSalaryStore.getState();

  // 1. Direct full_name update
  store.setContractor({
    full_name: 'นายกิตติศักดิ์ เจริญผล',
  });
  let state = useSalaryStore.getState();
  assert.strictEqual(state.contractor.full_name, 'นายกิตติศักดิ์ เจริญผล');
  assert.strictEqual(
    state.agency.signers.contractor_name,
    'นายกิตติศักดิ์ เจริญผล',
    'agency.signers.contractor_name must immediately match contractor.full_name'
  );

  // 2. Component-level update (title, first_name, last_name without full_name)
  store.setContractor({
    title: 'นางสาว',
    first_name: 'สิริพร',
    last_name: 'มั่นคงดี',
    full_name: undefined,
  });
  state = useSalaryStore.getState();
  assert.strictEqual(state.contractor.full_name, 'นางสาวสิริพร มั่นคงดี');
  assert.strictEqual(
    state.agency.signers.contractor_name,
    'นางสาวสิริพร มั่นคงดี',
    'Derived full_name must sync to agency.signers.contractor_name'
  );

  // 3. setAgency preserving contractor_name if omitted
  store.setAgency({
    agency_name: 'กรมวิทยาศาสตร์การแพทย์',
    signers: {
      supervisor_name: 'นายแพทย์หัวหน้างาน',
    } as any,
  });
  state = useSalaryStore.getState();
  assert.strictEqual(
    state.agency.signers.contractor_name,
    'นางสาวสิริพร มั่นคงดี',
    'setAgency must preserve contractor_name from contractor profile'
  );
});

test('RECHECK-06: Store self-heals desynchronized signers upon hydration and JSON backup import', async () => {
  await localStorageAdapter.resetToDefaults();

  // Artificially inject desynchronized data in storage
  const profile = await localStorageAdapter.getProfile();
  profile.full_name = 'นายมานะ มีสติ';
  await localStorageAdapter.saveProfile(profile);

  const agency = await localStorageAdapter.getAgency();
  agency.signers.contractor_name = 'ชื่อเก่ายังไม่แก้';
  await localStorageAdapter.saveAgency(agency);

  // Initialize store: should self-heal agency.signers.contractor_name
  await useSalaryStore.getState().initStore();
  const state = useSalaryStore.getState();

  assert.strictEqual(state.contractor.full_name, 'นายมานะ มีสติ');
  assert.strictEqual(
    state.agency.signers.contractor_name,
    'นายมานะ มีสติ',
    'Store hydration (initStore) must self-heal mismatch in agency.signers.contractor_name'
  );

  // Test importStateJson with desynchronized contractor names
  const backupJson = JSON.stringify({
    version: '1.0.0',
    profile: { ...profile, full_name: 'นายชูใจ ใฝ่เรียน' },
    agency: { ...agency, signers: { ...agency.signers, contractor_name: 'ชื่อต่างคนต่างมา' } },
    contract: await localStorageAdapter.getContract(),
    currentPeriod: await localStorageAdapter.getCurrentPeriod(),
  });

  const importResult = useSalaryStore.getState().importStateJson(backupJson);
  assert.strictEqual(importResult, true, 'importStateJson must succeed');

  const importedState = useSalaryStore.getState();
  assert.strictEqual(importedState.contractor.full_name, 'นายชูใจ ใฝ่เรียน');
  assert.strictEqual(
    importedState.agency.signers.contractor_name,
    'นายชูใจ ใฝ่เรียน',
    'importStateJson must reconcile contractor_name in agency.signers'
  );
});

// -----------------------------------------------------------------------------
// Test Group 4: Concurrent Audit Logging & Storage Integrity
// -----------------------------------------------------------------------------
test('RECHECK-07: Concurrent logAction calls are serialized without loss and generate RFC 4122 v4 UUIDs', async () => {
  const adapter = new LocalStorageAdapter();
  await adapter.resetToDefaults();

  const CONCURRENT_DISPATCHES = 50;
  const dispatchPromises = Array.from({ length: CONCURRENT_DISPATCHES }, (_, i) =>
    adapter.logAction({
      action: 'ATTENDANCE_GENERATE',
      actor: `challenger_worker_${i}`,
      entity_type: 'stress_test',
      summary: `Concurrent entry #${i}`,
      metadata: { dispatch_index: i },
    })
  );

  await Promise.all(dispatchPromises);

  const storedLogs = await adapter.getAuditLogs(100);
  assert.strictEqual(
    storedLogs.length,
    CONCURRENT_DISPATCHES,
    `All ${CONCURRENT_DISPATCHES} concurrent logs must be stored without any RMW drop`
  );

  // RFC 4122 v4 UUID regex
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  for (const log of storedLogs) {
    assert.ok(uuidV4Regex.test(log.id), `Log id "${log.id}" must be a valid RFC 4122 v4 UUID`);
  }
});
