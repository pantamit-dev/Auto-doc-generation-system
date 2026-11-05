/**
 * Helper to invoke the calculate API and update the salary store.
 */
import { useSalaryStore } from '@/lib/store/useSalaryStore';

export async function recalculateAndStore() {
  const { contract, currentPeriod } = useSalaryStore.getState();
  try {
    const payload = {
      ...contract,
      year_be: currentPeriod?.year_be ?? 2569,
      month: currentPeriod?.month ?? 10,
      public_holidays: currentPeriod?.public_holidays ?? [],
      absent_days: currentPeriod?.absent_days ?? [],
    };
    const resp = await fetch('/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await resp.json();
    if (json.success) {
      useSalaryStore.setState({ salaryResult: json.data });
    } else {
      console.error('Calculate API error', json.error);
    }
  } catch (e) {
    console.error('Network error calling calculate API', e);
  }
}
