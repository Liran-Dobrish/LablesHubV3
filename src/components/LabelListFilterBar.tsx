// Free-text (name+description) + creator dropdown filter bar — FR-003/FR-004/FR-005.
import * as React from 'react';
import { Filter, FILTER_CHANGE_EVENT } from 'azure-devops-ui/Utilities/Filter';
import { FilterBar } from 'azure-devops-ui/FilterBar';
import { KeywordFilterBarItem } from 'azure-devops-ui/TextFilterBarItem';
import { DropdownFilterBarItem } from 'azure-devops-ui/Dropdown';
import { DropdownMultiSelection } from 'azure-devops-ui/Utilities/DropdownSelection';
import type { IListBoxItem } from 'azure-devops-ui/ListBox';
import type { LabelCreator } from '../models/types';
import { strings } from '../common/strings';

export interface LabelListFilterBarProps {
  creators: LabelCreator[];
  onFilterChanged: (searchText: string, creatorId: string | null) => void;
}

const SEARCH_TEXT_KEY = 'searchText';
const CREATOR_KEY = 'creator';

export const LabelListFilterBar: React.FC<LabelListFilterBarProps> = ({ creators, onFilterChanged }) => {
  const filter = React.useMemo(() => new Filter(), []);
  const creatorSelection = React.useMemo(() => new DropdownMultiSelection(), []);

  React.useEffect(() => {
    const listener = () => {
      const state = filter.getState();
      const searchText = (state[SEARCH_TEXT_KEY]?.value as string) ?? '';
      const creatorValues = (state[CREATOR_KEY]?.value as string[]) ?? [];
      onFilterChanged(searchText, creatorValues.length > 0 ? creatorValues[0] : null);
    };
    filter.subscribe(listener, FILTER_CHANGE_EVENT);
    return () => filter.unsubscribe(listener, FILTER_CHANGE_EVENT);
  }, [filter, onFilterChanged]);

  const creatorItems: IListBoxItem[] = creators.map((creator) => ({
    id: creator.id,
    text: creator.displayName,
  }));

  return (
    <FilterBar filter={filter}>
      <KeywordFilterBarItem filterItemKey={SEARCH_TEXT_KEY} placeholder={strings.labelListSearchPlaceholder} />
      <DropdownFilterBarItem
        filterItemKey={CREATOR_KEY}
        filter={filter}
        items={creatorItems}
        selection={creatorSelection}
        placeholder={strings.labelListCreatorPlaceholder}
        showFilterBox={creators.length > 8}
        noItemsText={strings.labelListNoCreators}
      />
    </FilterBar>
  );
};
