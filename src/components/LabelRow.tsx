// Two-line label row: name, then created date + creator persona/name — FR-002.
import * as React from 'react';
import { VssPersona } from 'azure-devops-ui/VssPersona';
import type { TfvcLabel } from '../models/types';
import { formatCreatedDate } from '../common/formatting';

export interface LabelRowProps {
  label: TfvcLabel;
}

export const LabelRow: React.FC<LabelRowProps> = ({ label }) => {
  return (
    <div className="tfvc-label-row">
      <div className="tfvc-label-row-name body-m font-weight-semibold">{label.name}</div>
      <div className="tfvc-label-row-meta body-s secondary-text flex-row flex-center">
        <span className="tfvc-label-row-date">{formatCreatedDate(label.createdDate)}</span>
        <VssPersona
          size="small"
          imageUrl={label.creator.avatarUrl ?? undefined}
          displayName={label.creator.displayName}
        />
        <span className="tfvc-label-row-creator-name">{label.creator.displayName}</span>
      </div>
    </div>
  );
};
