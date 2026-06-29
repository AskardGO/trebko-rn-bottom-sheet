export { BottomSheet } from './BottomSheet';
export { BottomSheetPortal, useSheet } from './BottomSheetPortal';
export type { BottomSheetPortalProps, SheetContextValue } from './BottomSheetPortal';
export { BottomSheetPicker } from './BottomSheetPicker';
export { BottomSheetScrollView } from './BottomSheetScrollView';
export { BottomSheetFlatList } from './BottomSheetFlatList';
export { ScrollIndicator } from './ScrollIndicator';
export type {
  BottomSheetProps,
  BottomSheetMethods,
  SnapPoint,
  AnimationConfig,
  SpringAnimationConfig,
  TimingAnimationConfig,
} from './types';
export type {
  BottomSheetPickerProps,
  PickerRenderItemInfo,
} from './BottomSheetPicker';
export type { BottomSheetScrollViewProps } from './BottomSheetScrollView';
export type { BottomSheetFlatListProps } from './BottomSheetFlatList';
export type { ScrollIndicatorProps } from './ScrollIndicator';

// ── Immersive mode (Android) ──────────────────────────────────────────────────
export {
  setImmersiveMode,
  getBottomInset,
  getTopInset,
  isImmersiveModeSupported,
} from './ImmersiveMode';
export {
  useImmersiveMode,
  useImmersiveModeChange,
  getNavBarHeight,
} from './useImmersiveMode';
export type { UseImmersiveModeReturn } from './useImmersiveMode';
export { InsetScreen } from './InsetScreen';
export type { InsetScreenProps } from './InsetScreen';
