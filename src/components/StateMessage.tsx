// Shared empty-state/error-state presentational component — FR-013/FR-014.
import * as React from 'react';
import { ZeroData } from 'azure-devops-ui/ZeroData';
import { strings } from '../common/strings';

export interface StateMessageProps {
  kind: 'empty' | 'error';
  primaryText: string;
  secondaryText?: string;
  onRetry?: () => void;
}

export const StateMessage: React.FC<StateMessageProps> = ({ kind, primaryText, secondaryText, onRetry }) => {
  return (
    <ZeroData
      primaryText={primaryText}
      secondaryText={secondaryText}
      imageAltText=""
      actionText={kind === 'error' && onRetry ? strings.retryActionText : undefined}
      onActionClick={kind === 'error' ? onRetry : undefined}
    />
  );
};
