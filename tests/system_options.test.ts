import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SYSTEM_OPTIONS, DEFAULT_SYSTEM_SETTINGS } from '../src/lib/systemOptions/defaultOptions';

describe('Dynamic System Options & Settings Fixtures', () => {
  it('contains valid options across all 6 core categories', () => {
    const categories = ['title', 'position', 'agency', 'payer_agency', 'bank', 'leave_type'];
    for (const cat of categories) {
      const items = DEFAULT_SYSTEM_OPTIONS.filter((opt) => opt.category === cat);
      assert.ok(items.length > 0, `Category ${cat} must contain at least 1 option`);
      assert.ok(items.some((opt) => opt.is_default), `Category ${cat} must have a default option`);
    }
  });

  it('contains valid system settings with statutory 30 divisor and 110 tasks target', () => {
    const divisor = DEFAULT_SYSTEM_SETTINGS['statutory_divisor'];
    assert.ok(divisor);
    assert.equal(divisor.setting_value, 30);

    const targetTasks = DEFAULT_SYSTEM_SETTINGS['target_tasks_per_period'];
    assert.ok(targetTasks);
    assert.equal(targetTasks.setting_value, 110);

    const workingHours = DEFAULT_SYSTEM_SETTINGS['working_hours'];
    assert.ok(workingHours);
    assert.equal(workingHours.setting_value.time_in_min, '07:30');
    assert.equal(workingHours.setting_value.time_out_min, '16:30');
  });
});
