// Copyright (C) 2026 Yota Hamada
// SPDX-License-Identifier: GPL-3.0-or-later

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useBoundedDAGRunDetails } from '../../../hooks/useBoundedDAGRunDetails';
import DAGRunDetailsModal from '../DAGRunDetailsModal';

vi.mock('../../../hooks/useBoundedDAGRunDetails', () => ({
  useBoundedDAGRunDetails: vi.fn(),
}));

vi.mock('../DAGRunDetailsContent', () => ({
  default: ({
    initialTab,
    fillHeight,
  }: {
    initialTab: string;
    fillHeight?: boolean;
  }) => (
    <div
      data-fill-height={String(fillHeight)}
      data-initial-tab={initialTab}
      data-testid="dag-run-content"
    />
  ),
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('DAGRunDetailsModal', () => {
  it('fills the modal content height when artifacts are opened from the status tab', () => {
    vi.mocked(useBoundedDAGRunDetails).mockReturnValue({
      data: { dagRunId: 'run-1', name: 'example' },
      error: undefined,
      isLoading: false,
      isValidating: false,
      refresh: vi.fn(),
    } as unknown as ReturnType<typeof useBoundedDAGRunDetails>);

    render(
      <MemoryRouter>
        <DAGRunDetailsModal
          name="example"
          dagRunId="run-1"
          isOpen
          onClose={() => {}}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId('dag-run-content')).toHaveAttribute(
      'data-initial-tab',
      'status'
    );
    expect(screen.getByTestId('dag-run-content')).toHaveAttribute(
      'data-fill-height',
      'true'
    );
  });
});
