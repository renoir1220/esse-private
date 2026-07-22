import { describe, expect, it } from 'vitest';
import { retryAllFailedSelection } from './batch-actions';
import type { BatchJob } from './types';

describe('Batch actions', () => {
  it('selects every retryable failed job and carries explicit unknown-charge approval', () => {
    const jobs = [
      job('failed-safe', 'failed', true, 'not_charged'),
      job('failed-unknown', 'failed', true, 'unknown'),
      job('failed-terminal', 'failed', false, 'not_charged'),
      job('completed', 'succeeded', false, 'charged'),
    ];

    expect(retryAllFailedSelection({ jobs })).toEqual({
      jobIds: ['failed-safe', 'failed-unknown'],
      includesUnknownCharge: true,
    });
  });
});

function job(id: string, status: BatchJob['status'], retryable: boolean, chargeState: BatchJob['chargeState']): BatchJob {
  return {
    id,
    index: 0,
    name: id,
    prompt: id,
    requestKey: id,
    operation: 'generate',
    status,
    progress: status === 'succeeded' ? 100 : 0,
    attempt: 1,
    retryable,
    chargeState,
    referenceImageIds: [],
    backups: [],
    createdAt: '2026-07-22T00:00:00.000Z',
    callHistory: [],
  };
}
