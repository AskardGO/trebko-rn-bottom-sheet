import { Dimensions } from 'react-native';

/**
 * Resolve a snap point value to absolute pixels.
 *
 * @param value        - A pixel value (number), a percentage string like `'50%'`,
 *                       or a numeric string like `'300'`.
 * @param screenHeight - The current window height used for percentage calculations.
 * @param fallback     - Returned when `value` is `undefined`.
 */
export function resolveSize(
  value: number | string | undefined,
  screenHeight: number,
  fallback?: number
): number {
  if (value === undefined) {
    return fallback ?? screenHeight;
  }

  if (typeof value === 'number') {
    return value;
  }

  // Percentage string: '50%', '92%', etc.
  if (value.endsWith('%')) {
    const pct = parseFloat(value);
    // Guard against malformed strings like 'abc%' → NaN
    if (!isNaN(pct)) {
      return screenHeight * (pct / 100);
    }
    return fallback ?? screenHeight;
  }

  // Plain numeric string: '300', '150.5', etc.
  const asNumber = parseFloat(value);
  if (!isNaN(asNumber)) {
    return asNumber;
  }

  // Unrecognised format — return fallback
  return fallback ?? screenHeight;
}

/**
 * One-time screen height snapshot used only for the initial SharedValue
 * seed in BottomSheet (before the first useWindowDimensions render).
 * All reactive calculations inside the component use `useWindowDimensions`.
 */
export const INITIAL_SCREEN_HEIGHT = Dimensions.get('window').height;
