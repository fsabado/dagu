import { NodeStatus, Status } from '@/api/v1/schema';

export function isActiveNodeStatus(status?: NodeStatus): boolean {
  return status === NodeStatus.Running || status === NodeStatus.Retrying;
}

/**
 * Get Tailwind CSS utility class for Status or NodeStatus enum.
 * Uses utility classes defined in global.css.
 *
 * @param status - The Status or NodeStatus enum value
 * @returns The corresponding CSS utility class name
 */
export function getStatusClass(status?: Status | NodeStatus): string {
  switch (status) {
    case Status.Success:
    case NodeStatus.Success:
      return 'status-success';

    case Status.Failed:
    case Status.Rejected:
    case NodeStatus.Failed:
    case NodeStatus.Rejected:
      return 'status-failed';

    case Status.Running:
    case NodeStatus.Running:
      return 'status-running';

    case NodeStatus.Retrying:
      return 'status-warning';

    case Status.Queued:
    case Status.NotStarted:
    case NodeStatus.NotStarted:
    case NodeStatus.Skipped:
      return 'status-neutral';

    case Status.PartialSuccess:
    case Status.Waiting:
    case NodeStatus.PartialSuccess:
    case NodeStatus.Waiting:
      return 'status-warning';

    case Status.Aborted:
    case NodeStatus.Aborted:
      return 'status-aborted';

    default:
      return 'status-muted';
  }
}

/**
 * Get separate background, text, border, and animation classes for status.
 * Useful for components that need granular control over styling.
 *
 * @param status - The Status or NodeStatus enum value
 * @returns Object with bgClass, textClass, borderClass, and animation
 */
export function getStatusColors(
  status?: Status | NodeStatus
): {
  bgClass: string;
  textClass: string;
  borderClass: string;
  animation: string;
} {
  const baseClass = getStatusClass(status);
  const isPulsingWarning =
    status === Status.Waiting ||
    status === NodeStatus.Waiting ||
    status === NodeStatus.Retrying;

  switch (baseClass) {
    case 'status-success':
      return {
        bgClass: 'bg-[var(--status-success)]',
        textClass: 'text-[var(--status-success)]',
        borderClass: 'border-[var(--status-success)]',
        animation: '',
      };

    case 'status-failed':
      return {
        bgClass: 'bg-[var(--status-error)]',
        textClass: 'text-[var(--status-error)]',
        borderClass: 'border-[var(--status-error)]',
        animation: '',
      };

    case 'status-running':
      return {
        bgClass: 'bg-[var(--status-running)]',
        textClass: 'text-[var(--status-running)]',
        borderClass: 'border-[var(--status-running)]',
        animation: '',
      };

    case 'status-neutral':
      return {
        bgClass: 'bg-[var(--status-neutral)]',
        textClass: 'text-[var(--status-neutral)]',
        borderClass: 'border-[var(--status-neutral)]',
        animation: '',
      };

    case 'status-warning':
      return {
        bgClass: 'bg-[var(--status-warning)]',
        textClass: 'text-[var(--status-warning)]',
        borderClass: 'border-[var(--status-warning)]',
        animation: isPulsingWarning ? 'animate-pulse' : '',
      };

    case 'status-aborted':
      return {
        bgClass: 'bg-[var(--status-aborted)]',
        textClass: 'text-[var(--status-aborted)]',
        borderClass: 'border-[var(--status-aborted)]',
        animation: '',
      };

    default:
      return {
        bgClass: 'bg-[var(--status-neutral)]',
        textClass: 'text-[var(--status-neutral)]',
        borderClass: 'border-[var(--status-neutral)]',
        animation: '',
      };
  }
}

/**
 * Get the display icon for a NodeStatus value.
 *
 * @param status - The NodeStatus enum value
 * @returns Unicode character representing the status
 */
export function getNodeStatusIcon(status: NodeStatus): string {
  switch (status) {
    case NodeStatus.Success:
      return '✓';
    case NodeStatus.Failed:
      return '✕';
    case NodeStatus.Rejected:
      return '⊘';
    case NodeStatus.Retrying:
      return '↻';
    case NodeStatus.NotStarted:
      return '○';
    case NodeStatus.Skipped:
      return '―';
    case NodeStatus.PartialSuccess:
      return '◐';
    case NodeStatus.Waiting:
      return '□';
    case NodeStatus.Aborted:
      return '■';
    case NodeStatus.Running:
      return ''; // Running uses BrailleSpinner
    default:
      return '○';
  }
}
