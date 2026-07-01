import { Easing } from 'react-native-reanimated';

/** handle paddingTop(12) + handle(4) + paddingBottom(8) + gap(8) */
export const HANDLE_AREA = 32;

/** paddingBottom on the sheet container */
export const CHROME_PADDING = 16;

export const MIN_CONTENT_HEIGHT = 40;

/** Extra pixels the sheet extends below the keyboard top during keyboard animation. */
export const KEYBOARD_OVERLAP = 100;

/** Extra pixels the sheet view extends below the screen bottom (covers spring bounce). */
export const BOTTOM_OVERFLOW = 80;

/** Open: lively spring with a small natural overshoot */
export const OPEN_SPRING = { damping: 14, stiffness: 150, mass: 0.9 };

/** Close: ease-out cubic, slightly faster than the open */
export const CLOSE_DURATION = 260;
export const CLOSE_EASING = Easing.out(Easing.cubic);
