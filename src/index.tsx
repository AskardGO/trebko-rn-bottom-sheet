export { BottomSheet } from './BottomSheet';
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
export { useImmersiveMode, useImmersiveModeChange } from './useImmersiveMode';
export type { UseImmersiveModeReturn } from './useImmersiveMode';
