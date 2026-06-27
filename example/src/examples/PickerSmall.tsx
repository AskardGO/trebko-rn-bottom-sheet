/**
 * PickerSmall — demonstrates BottomSheetPicker with a small list (2 items),
 * dynamic sizing, and no search bar.
 *
 * Usage:
 *   <PickerSmallSheet
 *     value={city}
 *     onSelect={(city) => setCity(city)}
 *     onClose={() => setOpen(false)}
 *   />
 */
import React from 'react';
import { BottomSheetPicker } from '@trebko/rn-bottom-sheet';
import { CITIES_2 } from '../shared/data/cities';
import { SHEET_STYLE } from '../shared/utils/sheetStyle';

// ─── Demo catalogue entry ────────────────────────────────────────────────────

export const PICKER_SMALL_DEMO = {
  title: 'Picker · 2 items',
  subtitle: 'Dynamic sizing · no search',
};

// ─── Sheet component ─────────────────────────────────────────────────────────

interface Props {
  value?: string;
  onSelect: (item: string) => void;
  onClose: () => void;
}

export function PickerSmallSheet({ value, onSelect, onClose }: Props) {
  return (
    <BottomSheetPicker
      title="Select city"
      items={[...CITIES_2]}
      value={value}
      onSelect={onSelect}
      onClose={onClose}
      style={SHEET_STYLE}
    />
  );
}
