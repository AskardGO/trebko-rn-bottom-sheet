/**
 * MultiPicker — demonstrates BottomSheetPicker in multi-select mode.
 * The sheet stays open while items are toggled; it closes when the user
 * taps the "Done" button (onApply).
 *
 * Usage:
 *   <MultiPickerSheet
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

export const MULTI_PICKER_DEMO = {
  key: 'multi' as const,
  title: 'Multi-select · 20 items',
  subtitle: 'Sheet stays open · tap Done to confirm',
};

// ─── Sheet component ─────────────────────────────────────────────────────────

interface Props {
  values: string[];
  onValuesChange: (items: string[]) => void;
  onClose: () => void;
  bottomInset?: number;
  isImmersive?: boolean;
}

export function MultiPickerSheet({
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
      applyButtonLabel="Done"
      onClose={onClose}
      bottomInset={bottomInset}
      isImmersive={isImmersive}
      style={SHEET_STYLE}
    />
  );
}
