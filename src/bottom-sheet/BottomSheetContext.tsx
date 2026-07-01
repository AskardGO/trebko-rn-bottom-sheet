import React, { createContext, useContext } from 'react';

export interface BottomSheetContextValue {
  contentScrollEnabled: boolean;
  /** Bottom safe-area inset (nav bar height) passed down from BottomSheet. */
  bottomInset: number;
}

export const BottomSheetContext = createContext<BottomSheetContextValue>({
  contentScrollEnabled: true,
  bottomInset: 0,
});

export function useBottomSheetContext() {
  return useContext(BottomSheetContext);
}
