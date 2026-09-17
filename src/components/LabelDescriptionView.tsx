// Read-only description display with a fallback for unset descriptions — FR-009.
import * as React from 'react';
import { strings } from '../common/strings';

export interface LabelDescriptionViewProps {
  description: string | null;
}

export const LabelDescriptionView: React.FC<LabelDescriptionViewProps> = ({ description }) => {
  const hasDescription = Boolean(description && description.length > 0);
  return (
    <div className="tfvc-label-description body-m" style={{ maxHeight: 160, overflowY: 'auto' }}>
      {hasDescription ? description : <span className="secondary-text">{strings.labelDescriptionEmpty}</span>}
    </div>
  );
};
