'use client';

import React from 'react';
import type { DocumentId } from '@/types/schema';
import { Doc01ReceiptVoucher } from './Doc01ReceiptVoucher';
import { Doc02aDeliveryNoteFull } from './Doc02aDeliveryNoteFull';
import { Doc02bDeliveryNoteDeduct } from './Doc02bDeliveryNoteDeduct';
import { Doc03WorkloadMatrix } from './Doc03WorkloadMatrix';
import { Doc04AttendanceSheet } from './Doc04AttendanceSheet';

export interface DocumentRendererProps {
  docId: string;
  highlightMockup?: boolean;
}

export function normalizeDocId(rawId: string): DocumentId {
  const norm = rawId.trim().toUpperCase().replace(/[-_]/g, '');
  if (norm === 'DOC1' || norm === 'DOC01') return 'DOC-01';
  if (norm === 'DOC2A' || norm === 'DOC02A') return 'DOC-02A';
  if (norm === 'DOC2B' || norm === 'DOC02B') return 'DOC-02B';
  if (norm === 'DOC3' || norm === 'DOC03') return 'DOC-03';
  if (norm === 'DOC4' || norm === 'DOC04') return 'DOC-04';
  return 'DOC-01';
}

export function resolveDeliveryDocId(absentDaysCount: number): DocumentId {
  return absentDaysCount > 0 ? 'DOC-02B' : 'DOC-02A';
}

export function DocumentRenderer({ docId, highlightMockup = false }: DocumentRendererProps) {
  const normalized = normalizeDocId(docId);

  switch (normalized) {
    case 'DOC-01':
      return <Doc01ReceiptVoucher highlightMockup={highlightMockup} />;
    case 'DOC-02A':
      return <Doc02aDeliveryNoteFull highlightMockup={highlightMockup} />;
    case 'DOC-02B':
      return <Doc02bDeliveryNoteDeduct highlightMockup={highlightMockup} />;
    case 'DOC-03':
      return <Doc03WorkloadMatrix highlightMockup={highlightMockup} />;
    case 'DOC-04':
      return <Doc04AttendanceSheet highlightMockup={highlightMockup} />;
    default:
      return <Doc01ReceiptVoucher highlightMockup={highlightMockup} />;
  }
}
