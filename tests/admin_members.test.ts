import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Admin Membership Logic', () => {
  const members = [
    { id: '1', full_name: 'นายพันธมิตร สำเภามาตา', citizen_id: '1769900123456', role: 'admin', status: 'active' },
    { id: '2', full_name: 'นายสมชาย รักชาติ', citizen_id: '3769900987654', role: 'member', status: 'active' },
    { id: '3', full_name: 'นางสาววิภาดา แสงจันทร์', citizen_id: '1769900554433', role: 'member', status: 'suspended' },
  ];

  it('filters members by search query accurately across full name and citizen ID', () => {
    const query = 'พันธมิตร';
    const filtered = members.filter((m) => m.full_name.includes(query) || m.citizen_id.includes(query));
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, '1');

    const idQuery = '987654';
    const filteredId = members.filter((m) => m.full_name.includes(idQuery) || m.citizen_id.includes(idQuery));
    assert.equal(filteredId.length, 1);
    assert.equal(filteredId[0].id, '2');
  });

  it('filters members by role and status', () => {
    const admins = members.filter((m) => m.role === 'admin');
    assert.equal(admins.length, 1);

    const suspended = members.filter((m) => m.status === 'suspended');
    assert.equal(suspended.length, 1);
    assert.equal(suspended[0].id, '3');
  });
});
