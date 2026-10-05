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
    <div className="tfvc-label-row" style={{ width: "100%", paddingTop: "10px", paddingBottom: "10px", borderBottom: "solid lightgray 1px" }}>
      <div className="tfvc-label-row-name body-m font-weight-semibold" style={{ paddingBottom: "7px" }}>{label.name} - {formatCreatedDate(label.createdDate)}</div>
      <div className="tfvc-label-row-meta body-s secondary-text flex-row flex-center">
        <VssPersona
          size="small"
          imageUrl={label.creator.avatarUrl ?? undefined}
          displayName={label.creator.displayName}
        />
        <span className="tfvc-label-row-creator-name" style={{ paddingLeft: "5px" }}>{label.creator.displayName}</span>
      </div>
    </div>
  );
};
