<div align="center">

### ☕ Support the project

If this library saves you time, consider buying me a coffee!

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/askard)

<a href="https://buymeacoffee.com/askard">
  <img src="docs/bmc-qr.png" width="160" alt="Scan to buy me a coffee" />
</a>

**[buymeacoffee.com/askard](https://buymeacoffee.com/askard)**

</div>

---

# @trebko/rn-bottom-sheet

A modern, performant bottom sheet library for **React Native 0.86+** with full **New Architecture (Fabric)** support.

Built on top of [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/) and [react-native-gesture-handler](https://docs.swmansion.com/react-native-gesture-handler/) — all animations and gesture handling run on the UI thread at 60 FPS.

---

## Features

- **Dynamic sizing** — auto-sizes to content height, no manual calculations needed
- **Snap points** — fixed percentage/pixel snap positions with smooth transitions
- **Keyboard avoidance** — sheet lifts above the software keyboard frame-perfectly
- **Picker component** — single-select, multi-select, searchable, fully customisable rows
- **Custom scroll indicator** — animated thumb, no native flicker
- **Immersive mode (Android)** — hide the navigation bar; `InsetScreen` + `useImmersiveMode` handle insets automatically
- **Edge-to-edge (Android 15+)** — robust bottom-inset resolution; `BottomSheet` reads `navBarHeight` automatically — zero boilerplate
- **iOS safe-area insets** — `InsetScreen` reads `UIWindow.safeAreaInsets` natively (no third-party deps); home indicator / notch / Dynamic Island handled automatically
- **TypeScript** — fully typed API, generic `BottomSheetFlatList<T>`
- **New Architecture ready** — Fabric + Turbo Modules compatible

---

## Table of Contents

- [Installation](#installation)
- [Quick start](#quick-start)
- [BottomSheet](#bottomsheet)
  - [Props](#bottomsheetprops)
  - [Imperative API (ref)](#imperative-api-ref)
- [BottomSheetScrollView](#bottomsheetscrollview)
- [BottomSheetFlatList](#bottomsheetflatlist)
- [BottomSheetPicker](#bottomsheetpicker)
  - [Single select](#single-select)
  - [Multi select](#multi-select)
  - [Search](#search)
  - [Custom rows](#custom-rows)
  - [BottomSheetPicker props](#bottomsheetpickerprops)
- [ScrollIndicator](#scrollindicator)
- [Immersive mode (Android)](#immersive-mode-android)
  - [Native setup](#native-setup)
  - [InsetScreen](#insetscreen)
  - [useImmersiveMode](#useimmersivemode)
  - [useImmersiveModeChange](#useimmersivemodechange)
  - [Low-level utilities](#low-level-utilities)
- [BottomSheetPortal (global portal)](#bottomsheetportal-global-portal)
- [Animation config](#animation-config)
- [Tips & patterns](#tips--patterns)

---

## Installation

```sh
yarn add @trebko/rn-bottom-sheet react-native-reanimated react-native-gesture-handler
```

Complete the peer dependency setup:

- **Reanimated** → [getting started guide](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started)
- **Gesture Handler** → [installation guide](https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/installation)

> iOS safe-area insets (home indicator, notch, Dynamic Island) are handled automatically by the library's own native code — no additional packages needed.

---

## Quick start

Wrap your app root with `GestureHandlerRootView`. Render sheets as siblings of your main content so they cover the full screen.

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheet, BottomSheetScrollView } from '@trebko/rn-bottom-sheet';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <MyScreen />

      {/* Sheet renders on top via absoluteFill */}
      <BottomSheet snapPoints={['40%', '90%']} onClose={() => {}}>
        <BottomSheetScrollView>
          <Text>Content here</Text>
        </BottomSheetScrollView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
}
```

---

## BottomSheet

The core component. Conditionally render it to open/close — it mounts with an entry animation and closes via the `onClose` callback (after the exit animation completes).

```tsx
import { useRef, useState } from 'react';
import { BottomSheet } from '@trebko/rn-bottom-sheet';
import type { BottomSheetMethods } from '@trebko/rn-bottom-sheet';

function Example() {
  const [open, setOpen] = useState(false);
  const ref = useRef<BottomSheetMethods>(null);

  return (
    <>
      <Button title="Open" onPress={() => setOpen(true)} />

      {open && (
        <BottomSheet
          ref={ref}
          snapPoints={['50%', '90%']}
          initialSnapPointIndex={0}
          enableBackdrop
          backdropOpacity={0.5}
          enablePanDownToClose
          onClose={() => setOpen(false)}
        >
          <BottomSheetScrollView>
            <Text>Hello!</Text>
          </BottomSheetScrollView>
        </BottomSheet>
      )}
    </>
  );
}
```

### BottomSheetProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | — | Content rendered inside the sheet. |
| `snapPoints` | `SnapPoint[]` | — | Array of snap positions as pixel values or percentage strings (`'50%'`). When provided, `dynamicSizing` is disabled. |
| `dynamicSizing` | `boolean` | `true` (when no `snapPoints`) | Auto-size the sheet to fit its content. |
| `maxHeight` | `SnapPoint` | `'90%'` | Maximum sheet height. The sheet top never goes above `screenHeight - maxHeight`. |
| `contentHeight` | `number` | — | Pre-calculated content height in px. Skips the layout-measurement round-trip in dynamic mode. |
| `initialSnapPointIndex` | `number` | `0` | Snap point index to animate to on mount. |
| `headerComponent` | `ReactNode` | — | Rendered below the handle, above the scrollable area. Great for titles or search bars. |
| `enableBackdrop` | `boolean` | `true` | Render a dimmed backdrop behind the sheet. |
| `backdropOpacity` | `number` | `0.5` | Max backdrop opacity (0–1). Driven by sheet position — no extra animation. |
| `enablePanDownToClose` | `boolean` | `true` | Allow the handle to be dragged down to close the sheet. |
| `enableHandlePanningGesture` | `boolean` | `true` | Enable the pan gesture on the handle. |
| `bottomInset` | `number` | auto¹ | Bottom safe-area inset in dp. Auto-read from `useImmersiveMode()` — only pass explicitly to override (e.g. iOS `useSafeAreaInsets().bottom`). |
| `isImmersive` | `boolean` | auto¹ | Whether Android immersive mode (nav bar hidden) is active. Auto-read from `useImmersiveMode()`. |
| `navBarHeight` | `number` | auto¹ | Physical nav-bar height in dp. Auto-read from `useImmersiveMode()`. Used to pad scroll content when immersive + keyboard opens. |
| `enableKeyboardAvoid` | `boolean` | `true` | Lift the sheet above the software keyboard. The sheet top stays fixed; only the content area shrinks. |
| `animationConfigs` | `AnimationConfig` | — | Fine-tune open/close animation (spring or timing). |
| `animatedPosition` | `SharedValue<number>` | — | External shared value mirroring the sheet's `translateY`. Drive parallel animations from it. |
| `animatedIndex` | `SharedValue<number>` | — | External shared value mirroring the current snap index. |
| `onChange` | `(index: number) => void` | — | Fires when the sheet settles at a new snap point (zero-based index). |
| `onClose` | `() => void` | — | Fires after the sheet has fully animated off-screen. Unmount the sheet here. |
| `style` | `StyleProp<ViewStyle>` | — | Extra styles on the sheet container. Override `backgroundColor`, `borderTopLeftRadius`, shadows, etc. |

> `SnapPoint` is `number | string`. Examples: `300`, `'50%'`, `'90%'`.
>
> ¹ **auto** — value is read automatically from the module-level `useImmersiveMode()` singleton. Wrap your app root in `<InsetScreen>` once and these props never need to be passed explicitly on Android.

### Imperative API (ref)

Attach a `ref` to control the sheet programmatically.

```tsx
const ref = useRef<BottomSheetMethods>(null);

ref.current?.snapToIndex(1);   // animate to snap point 1
ref.current?.expand();         // animate to the largest snap point
ref.current?.collapse();       // animate to the smallest snap point
ref.current?.close();          // animate off-screen → triggers onClose
ref.current?.snapToPosition(400); // set sheet height to 400 px
```

| Method | Signature | Description |
|--------|-----------|-------------|
| `snapToIndex` | `(index: number) => void` | Animate to a snap point by index. No-op in dynamic mode (always index 0). |
| `snapToPosition` | `(position: number) => void` | Set sheet height to `position` px. |
| `expand` | `() => void` | Animate to the largest snap point (or dynamic height). |
| `collapse` | `() => void` | Animate to the smallest snap point (or dynamic height). |
| `close` | `() => void` | Animate off-screen and fire `onClose`. |

---

## BottomSheetScrollView

A gesture-handler-aware `ScrollView` for use inside `BottomSheet`. Automatically picks up `bottomInset` from the sheet context and shows a smooth custom scroll indicator.

```tsx
import { BottomSheetScrollView } from '@trebko/rn-bottom-sheet';

<BottomSheet>
  <BottomSheetScrollView
    showsCustomScrollIndicator       // default: true
    scrollIndicatorProps={{ color: '#999', width: 4 }}
  >
    {/* content */}
  </BottomSheetScrollView>
</BottomSheet>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showsCustomScrollIndicator` | `boolean` | `true` | Show the custom animated indicator. `false` falls back to the native indicator. |
| `scrollIndicatorProps` | `ScrollIndicatorProps` | — | Appearance overrides for the custom indicator (see [ScrollIndicator](#scrollindicator)). |
| All `ScrollViewProps` | — | — | Forwarded verbatim to the underlying gesture-handler `ScrollView`. |

---

## BottomSheetFlatList

A gesture-handler-aware generic `FlatList<T>` for use inside `BottomSheet`.

```tsx
import { BottomSheetFlatList } from '@trebko/rn-bottom-sheet';

<BottomSheet>
  <BottomSheetFlatList<string>
    data={items}
    keyExtractor={(item) => item}
    renderItem={({ item }) => <Text>{item}</Text>}
    showsCustomScrollIndicator
  />
</BottomSheet>
```

Accepts all `FlatListProps<T>` plus the same `showsCustomScrollIndicator` / `scrollIndicatorProps` as `BottomSheetScrollView`.

---

## BottomSheetPicker

A fully-featured picker built on top of `BottomSheet`. Handles sizing, search, single/multi select, and custom row rendering out of the box.

### Single select

```tsx
import { BottomSheetPicker } from '@trebko/rn-bottom-sheet';

<BottomSheetPicker
  title="Select city"
  items={['Kyiv', 'Lviv', 'Odesa']}
  value={selected}
  onSelect={(item) => setSelected(item)}
  onClose={() => setOpen(false)}
/>
```

### Multi select

```tsx
<BottomSheetPicker
  title="Select cities"
  multiple
  items={['Kyiv', 'Lviv', 'Odesa']}
  values={selection}
  onValuesChange={setSelection}
  onApply={(items) => console.log('confirmed:', items)}
  applyButtonLabel="Confirm"
  onClose={() => setOpen(false)}
/>
```

### Search

```tsx
<BottomSheetPicker
  title="Select city"
  items={cities}
  enableSearch
  searchPlaceholder="Search cities…"
  onSelect={setSelected}
  onClose={() => setOpen(false)}
/>
```

### Custom rows

Provide `renderItem` to replace the default row. You receive `{ item, index, isSelected, onSelect }`.

```tsx
import type { PickerRenderItemInfo } from '@trebko/rn-bottom-sheet';

function CityRow({ item, isSelected, onSelect }: PickerRenderItemInfo<string>) {
  return (
    <Pressable onPress={onSelect} style={isSelected && styles.active}>
      <Text style={{ fontWeight: isSelected ? '700' : '400' }}>{item}</Text>
    </Pressable>
  );
}

<BottomSheetPicker
  items={cities}
  renderItem={CityRow}
  onSelect={setSelected}
  onClose={() => setOpen(false)}
/>
```

### BottomSheetPickerProps

`BottomSheetPicker` accepts all `BottomSheetProps` (except `snapPoints`, `dynamicSizing`, `children`) plus the following:

#### Data

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `TItem[]` | **required** | Array of items to display. |

#### Single select

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `TItem` | — | Currently selected item. |
| `onSelect` | `(item, index) => void` | — | Fired on item tap. Sheet closes automatically. |

#### Multi select

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `multiple` | `boolean` | `false` | Enable multi-select mode. |
| `values` | `TItem[]` | — | Currently selected items (controlled). |
| `onValuesChange` | `(items) => void` | — | Fired on every item toggle. |
| `onApply` | `(items) => void` | — | Fired when the "Done" button is tapped. Sheet closes automatically. |
| `applyButtonLabel` | `string` | `'Done'` | Label for the confirmation button. |
| `applyButtonStyle` | `StyleProp<ViewStyle>` | — | Extra style for the button container. |
| `applyButtonTextStyle` | `StyleProp<TextStyle>` | — | Extra style for the button label. |

#### Search

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enableSearch` | `boolean` | `false` | Render a search input above the list. |
| `searchPlaceholder` | `string` | `'Search...'` | Placeholder text. |
| `searchInputProps` | `TextInputProps` | — | Extra props forwarded to the `TextInput` (excluding `value` and `onChangeText`). |

#### Header

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | — | Title text shown above the list (and above the search input if enabled). |

#### Rendering

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `renderItem` | `(info: PickerRenderItemInfo<TItem>) => ReactNode` | — | Replace the default row component. |
| `keyExtractor` | `(item, index) => string` | `String(item) + '-' + index` | Unique key per item. |
| `getItemLabel` | `(item) => string` | `String(item)` | Convert item to display label. Also used for search matching and multi-select identity. |
| `itemHeight` | `number` | `52` | Row height used for pre-calculating sheet height. Only relevant for the default renderer. |
| `flatListProps` | `FlatListProps<TItem>` | — | Extra props forwarded to the internal `BottomSheetFlatList`. |
| `listEmptyComponent` | `ReactNode` | `'No results'` text | Shown when the filtered list is empty. |

#### Scroll indicator

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showsCustomScrollIndicator` | `boolean` | `true` | Custom animated indicator. |
| `scrollIndicatorProps` | `ScrollIndicatorProps` | — | Appearance overrides. |

#### Selected indicator

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `selectedIndicatorComponent` | `ReactNode \| null` | Indigo dot | Trailing element shown when the row is selected. Pass `null` to hide. |

#### Style overrides

| Prop | Type | Description |
|------|------|-------------|
| `titleStyle` | `StyleProp<TextStyle>` | Title text style. |
| `itemStyle` | `StyleProp<ViewStyle>` | Default row container style. |
| `itemPressedStyle` | `StyleProp<ViewStyle>` | Style applied when a row is pressed or selected. |
| `itemTextStyle` | `StyleProp<TextStyle>` | Row label style. |
| `searchInputStyle` | `StyleProp<TextStyle>` | Search input style. |

---

## ScrollIndicator

Animated scroll indicator used inside `BottomSheetScrollView` and `BottomSheetFlatList`. Can also be used standalone.

```tsx
import { ScrollIndicator } from '@trebko/rn-bottom-sheet';
import { useSharedValue } from 'react-native-reanimated';

const scrollY = useSharedValue(0);
const contentHeight = useSharedValue(0);
const visibleHeight = useSharedValue(0);

<ScrollIndicator
  scrollY={scrollY}
  contentHeight={contentHeight}
  visibleHeight={visibleHeight}
  color="#C7C7CC"
  width={3}
  insetRight={2}
  insetTop={4}
  insetBottom={4}
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `scrollY` | `SharedValue<number>` | **required** | Current scroll position. |
| `contentHeight` | `SharedValue<number>` | **required** | Full content height. |
| `visibleHeight` | `SharedValue<number>` | **required** | Visible area height. |
| `width` | `number` | `3` | Width of the track and thumb. |
| `color` | `string` | `'#C7C7CC'` | Thumb colour. |
| `insetRight` | `number` | `2` | Right offset from the container edge. |
| `insetTop` | `number` | `4` | Top offset of the track. |
| `insetBottom` | `number` | `4` | Bottom offset of the track. |
| `style` | `StyleProp<ViewStyle>` | — | Extra styles for the track container. |
| `thumbStyle` | `StyleProp<ViewStyle>` | — | Extra styles for the animated thumb. |

---

## Immersive mode (Android)

`rn-bottom-sheet` ships a native Android module (`ImmersiveModule`) that hides the navigation bar and correctly re-applies the mode after dialogs, permission prompts, and dev-menu events.

### Native setup

#### 1. Register the package

In `MainApplication.kt`:

```kotlin
import com.rnbottomsheet.ImmersivePackage

override fun getPackages(): List<ReactPackage> =
    PackageList(this).packages + ImmersivePackage()
```

#### 2. Keep immersive sticky across focus changes

In `MainActivity.kt`:

```kotlin
import com.rnbottomsheet.ImmersiveModule

override fun onWindowFocusChanged(hasFocus: Boolean) {
    super.onWindowFocusChanged(hasFocus)
    if (hasFocus) ImmersiveModule.reapplyIfNeeded(this)
}
```

This handles the case where Android resets the nav bar after a dialog, permission prompt, or the React Native dev menu.

---

### `InsetScreen`

A screen wrapper that measures system-bar insets and broadcasts them to every `BottomSheet` in the tree — wrap your root once and all sheets adjust automatically, with zero prop drilling.

| Platform | How insets are measured |
|----------|------------------------|
| **Android** | `WindowInsetsCompat` in Kotlin — handles immersive mode, edge-to-edge, Android 15+ nav bar |
| **iOS** | `UIWindow.safeAreaInsets` in Objective-C — handles home indicator, notch, Dynamic Island, iPad |

No third-party dependencies required on either platform.

```tsx
import { InsetScreen } from '@trebko/rn-bottom-sheet';

<GestureHandlerRootView style={{ flex: 1 }}>
  <InsetScreen style={{ flex: 1 }}>
    <YourApp />
  </InsetScreen>

  {/* Sheets auto-read insets on both Android and iOS */}
  {open && <BottomSheetPicker items={items} onSelect={pick} onClose={close} />}
</GestureHandlerRootView>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `applyTopInset` | `boolean` | `true` | Apply `paddingTop` equal to the status-bar / cutout / notch height. |
| `applyBottomInset` | `boolean` | `true` | Apply `paddingBottom` equal to the nav-bar / home-indicator height. |
| All `ViewProps` | — | — | Forwarded to the underlying View. |

---

### `useImmersiveMode`

The primary hook. Manages immersive state globally — toggling in one component instantly updates every other subscriber.

```tsx
import { InsetScreen, useImmersiveMode, BottomSheetPicker } from '@trebko/rn-bottom-sheet';

function App() {
  const { isImmersive, setImmersive, isSupported } = useImmersiveMode();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* InsetScreen applies paddingTop/paddingBottom for system bars */}
      <InsetScreen style={{ flex: 1 }}>
        <MyContent />
        {isSupported && (
          <Switch value={isImmersive} onValueChange={setImmersive} />
        )}
      </InsetScreen>

      {/* BottomSheet auto-reads isImmersive, bottomInset, navBarHeight — no props needed */}
      {open && (
        <BottomSheetPicker
          items={cities}
          onSelect={setCity}
          onClose={() => setOpen(false)}
        />
      )}
    </GestureHandlerRootView>
  );
}
```

#### Return values

| Field | Type | Description |
|-------|------|-------------|
| `isImmersive` | `boolean` | Whether the navigation bar is currently hidden. |
| `setImmersive` | `(enabled: boolean) => void` | Enable or disable immersive mode. All other hook instances update immediately. |
| `toggle` | `() => void` | Toggle the current state. |
| `topInset` | `number` | `paddingTop` to apply to the root layout. Non-zero when the window extends behind the status bar. |
| `bottomInset` | `number` | `paddingBottom` for bottom sheets and scroll views. Non-zero when edge-to-edge is active and the nav bar is visible (immersive OFF). |
| `isSupported` | `boolean` | `true` on Android when the native module is linked. Use this to guard the UI toggle. |

#### `topInset` and `bottomInset` explained

On Android, enabling immersive mode calls `setDecorFitsSystemWindows(false)`, which extends the window behind both the status bar and the navigation bar.

- **`topInset`** prevents content from rendering behind the status bar. Apply it as `paddingTop` on your root `View`.
- **`bottomInset`** prevents list items from being hidden behind the nav bar (when it is visible). Pass it to `<BottomSheet bottomInset={bottomInset}>` — the sheet forwards it to its scroll children automatically.

```
                    ┌──────────────────────────┐  ◄── physical top
                    │   status bar  (topInset)  │
paddingTop: topInset├──────────────────────────┤  ◄── content starts here
                    │                          │
                    │      your content        │
                    │                          │
bottomInset = 0 ───►├──────────────────────────┤  ◄── physical bottom (immersive ON)
  (nav bar hidden)  │                          │
                    └──────────────────────────┘
```

---

### `useImmersiveModeChange`

Fires a callback whenever immersive mode is toggled by **any** component. Use for side effects (analytics, parallel animations, etc.) without consuming state.

```tsx
import { useImmersiveModeChange } from '@trebko/rn-bottom-sheet';

useImmersiveModeChange((enabled) => {
  // Always up-to-date — no need to add callback to a dep array
  Analytics.track('immersive_mode_changed', { enabled });
});
```

The callback reference is kept current on every render internally — pass an inline function freely.

---

### Low-level utilities

These are exported for advanced use cases. `useImmersiveMode` wraps them internally.

```tsx
import {
  setImmersiveMode,
  getBottomInset,
  getTopInset,
  isImmersiveModeSupported,
} from '@trebko/rn-bottom-sheet';
```

| Export | Signature | Description |
|--------|-----------|-------------|
| `setImmersiveMode` | `(enabled: boolean) => void` | Directly call the native module to hide/show the nav bar. |
| `getBottomInset` | `() => Promise<number>` | Returns the hardware nav-bar height in dp (`getInsetsIgnoringVisibility`). Resolves to `0` on iOS. |
| `getTopInset` | `() => Promise<number>` | Returns the hardware status-bar height in dp, including display cutouts. Resolves to `0` on iOS. |
| `isImmersiveModeSupported` | `boolean` | `true` on Android when the native module is available. |

---

## Animation config

Pass `animationConfigs` to customise the open/close animation. Spring and timing parameters can be mixed.

```tsx
// Lively spring (default)
<BottomSheet
  animationConfigs={{ damping: 14, stiffness: 150, mass: 0.9 }}
>

// Timing animation
<BottomSheet
  animationConfigs={{ duration: 300, easing: Easing.out(Easing.cubic) }}
>
```

| Field | Type | Description |
|-------|------|-------------|
| `damping` | `number` | Spring damping coefficient. Higher = less oscillation. Default: `14`. |
| `stiffness` | `number` | Spring stiffness. Higher = faster response. Default: `150`. |
| `mass` | `number` | Spring mass. Higher = more inertia. Default: `0.9`. |
| `duration` | `number` | Animation duration in ms. When provided, switches from `withSpring` to `withTiming`. |
| `easing` | `EasingFunction` | Easing function from `react-native-reanimated`. Only used when `duration` is set. |

---

## BottomSheetPortal (global portal)

By default `BottomSheet` uses `absoluteFill` relative to its **parent** in the React tree. If your sheet is rendered inside a `ScrollView`, a form, or a navigation screen, it will only cover that container — not the full screen.

`BottomSheetPortal` solves this with a single setup change: wrap your app root once, then open any sheet from anywhere in the tree with `useSheet().open()`.

### Setup (once per app)

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetPortal, InsetScreen } from '@trebko/rn-bottom-sheet';

// index.tsx / App.tsx — root of your application
export default function Root() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetPortal>
        <InsetScreen style={{ flex: 1 }}>
          <YourNavigator />
        </InsetScreen>
      </BottomSheetPortal>
    </GestureHandlerRootView>
  );
}
```

> `BottomSheetPortal` must be a direct child of `GestureHandlerRootView` so that
> gestures inside the sheet work correctly and the full-screen bounding box is respected.

### Open a sheet from any component

```tsx
import { useSheet, BottomSheetPicker } from '@trebko/rn-bottom-sheet';

function CityField() {
  const { open } = useSheet();
  const [city, setCity] = useState<string>();

  return (
    <TouchableOpacity
      onPress={() =>
        open((close) => (
          <BottomSheetPicker
            title="Місто"
            items={cities}
            value={city}
            onSelect={(item) => { setCity(item); close(); }}
            onClose={close}
          />
        ))
      }
    >
      <Text>{city ?? 'Оберіть місто'}</Text>
    </TouchableOpacity>
  );
}
```

`open()` receives a **render function** `(close) => ReactNode`. Pass `close` to `onClose` and `onSelect`/`onApply` — the sheet closes itself. All existing props (`renderItem`, `enableSearch`, `multiple`, etc.) work exactly as before.

### Programmatic close

```tsx
const { close } = useSheet();
// close the current sheet from anywhere
<Button title="Cancel" onPress={close} />
```

### `BottomSheetPortal` props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | — | Your app tree (navigation, screens, etc.). |
| `style` | `StyleProp<ViewStyle>` | — | Extra styles for the root container View. |

### `useSheet` return value

| Property | Type | Description |
|----------|------|-------------|
| `open` | `(render: (close: () => void) => ReactNode) => void` | Open any sheet at the portal level. |
| `close` | `() => void` | Programmatically close the current sheet. |

---

## Tips & patterns

### Conditionally mount the sheet

The sheet mounts with an entry spring and exits via `onClose`. The cleanest pattern is to conditionally render it and unmount on close:

```tsx
const [open, setOpen] = useState(false);

{open && (
  <BottomSheet onClose={() => setOpen(false)}>
    ...
  </BottomSheet>
)}
```

### Drive a sticky header from the sheet position

```tsx
const sheetPosition = useSharedValue(0);

const rHeaderStyle = useAnimatedStyle(() => ({
  opacity: interpolate(sheetPosition.value, [screenH, screenH * 0.5], [0, 1]),
}));

<BottomSheet animatedPosition={sheetPosition}>...</BottomSheet>
<Animated.View style={rHeaderStyle}>...</Animated.View>
```

### Pre-calculate picker height (avoid layout flash)

When you know the item count ahead of time, pass `contentHeight` to skip the measurement round-trip:

```tsx
const ITEM_H = 52;
const OVERHEAD = 32 + 16 + 36; // handle + chrome + title
const height = Math.min(items.length * ITEM_H + OVERHEAD, screenHeight * 0.9);

<BottomSheetPicker contentHeight={height} items={items} ... />
```

### Using `animatedIndex` to fade a backdrop

```tsx
const idx = useSharedValue(0);

const rBackdrop = useAnimatedStyle(() => ({
  opacity: interpolate(idx.value, [0, snapPoints.length - 1], [0.3, 0.7]),
}));

<BottomSheet snapPoints={['40%', '90%']} animatedIndex={idx}>...</BottomSheet>
<Animated.View style={[StyleSheet.absoluteFill, rBackdrop, { backgroundColor: 'black' }]} />
```

---

## License

MIT

---

Made with ❤️ by [Trebko](https://github.com/AskardGO) · [☕ Buy me a coffee](https://buymeacoffee.com/askard)
