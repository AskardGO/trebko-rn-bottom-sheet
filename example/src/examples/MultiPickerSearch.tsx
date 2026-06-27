/**
 * MultiPickerSearch — demonstrates BottomSheetPicker in multi-select mode
 * with an integrated search bar. The list filters as you type.
 *
 * Usage:
 *   <MultiPickerSearchSheet
 *     values={cities}
 *     onValuesChange={setCities}
 *     onClose={() => setOpen(false)}
 *   />
 */
import React from 'react';
import { BottomSheetPicker } from '@trebko/rn-bottom-sheet';
import { CITIES_20 } from '../shared/data/cities';
import { SHEET_STYLE } from '../shared/utils/sheetStyle';

// ─── Demo catalogue entry ────────────────────────────────────────────────────

export const MULTI_PICKER_SEARCH_DEMO = {
  key: 'multiSearch' as const,
  title: 'Multi-select + search',
  subtitle: 'Filterable list · multiple selection',
};

// ─── Sheet component ─────────────────────────────────────────────────────────

interface Props {
  values: string[];
  onValuesChange: (items: string[]) => void;
  onClose: () => void;
  bottomInset?: number;
  isImmersive?: boolean;
}

export function MultiPickerSearchSheet({
  values,
  onValuesChange,
  onClose,
  bottomInset = 0,
  isImmersive = false,
}: Props) {
  return (
    <BottomSheetPicker
      title="Select cities"
      multiple
      items={[...CITIES_20]}
      values={values}
      onValuesChange={onValuesChange}
      enableSearch
      searchPlaceholder="Search cities..."
      applyButtonLabel="Done"
      onClose={onClose}
      bottomInset={bottomInset}
      isImmersive={isImmersive}
      style={SHEET_STYLE}
    />
  );
}
