import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  BottomSheetPortal,
  BottomSheetPicker,
  InsetScreen,
  useImmersiveMode,
  useSheet,
} from '@trebko/rn-bottom-sheet';
import type { PickerRenderItemInfo } from '@trebko/rn-bottom-sheet';

import { DemoButton } from '../shared/ui/DemoButton';
import { CITIES_2, CITIES_20 } from '../shared/data/cities';
import { SHEET_STYLE } from '../shared/utils/sheetStyle';

import { CLASSIC_DEMO, ClassicSheet } from '../examples/ClassicSheet';
import { PICKER_LARGE_DEMO } from '../examples/PickerLarge';
import { PICKER_SMALL_DEMO } from '../examples/PickerSmall';
import { PICKER_SMALL_SEARCH_DEMO } from '../examples/PickerSmallSearch';
import { PICKER_LARGE_SEARCH_DEMO } from '../examples/PickerLargeSearch';
import { MULTI_PICKER_DEMO } from '../examples/MultiPicker';
import { MULTI_PICKER_SEARCH_DEMO } from '../examples/MultiPickerSearch';
import {
  REAL_WORLD_FORM_DEMO,
  PackageFormDemo,
} from '../examples/RealWorldForm';

// ─── Root ─────────────────────────────────────────────────────────────────────
// BottomSheetPortal must be a direct child of GestureHandlerRootView.
// AppContent lives inside the Portal so useSheet() works there.

export function App() {
  return (
    <GestureHandlerRootView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />
      <BottomSheetPortal>
        <AppContent />
      </BottomSheetPortal>
    </GestureHandlerRootView>
  );
}

// ─── AppContent ───────────────────────────────────────────────────────────────

function AppContent() {
  const { open } = useSheet();

  // ── Per-picker selected values ──────────────────────────────────────────────
  const [picker2,       setPicker2]       = useState<string | undefined>();
  const [picker20,      setPicker20]      = useState<string | undefined>();
  const [picker2search, setPicker2search] = useState<string | undefined>();
  const [picker20search,setPicker20search]= useState<string | undefined>();
  const [multi,         setMulti]         = useState<string[]>([]);
  const [multiSearch,   setMultiSearch]   = useState<string[]>([]);

  // ── "Real-world form" demo ──────────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false);

  // ── Immersive mode (Android only) ───────────────────────────────────────────
  const { isImmersive, setImmersive, isSupported } = useImmersiveMode();

  // ── Badge helpers ───────────────────────────────────────────────────────────
  const pickerBadge = (v?: string)  => v ?? 'None';
  const multiBadge  = (v: string[]) => v.length > 0 ? `${v.length} selected` : 'None';

  // ── Handlers — each opens a sheet via Portal ─────────────────────────────────
  // All state (value, onSelect) is captured at open() call time.
  // For single-select this is fine — sheet closes immediately after selection.
  // For multi-select onApply receives the final result; intermediate toggles
  // are handled by BottomSheetPicker's own internal state.

  function openClassic() {
    open((close) => <ClassicSheet onClose={close} />);
  }

  function openPicker2() {
    open((close) => (
      <BottomSheetPicker
        title="Select city"
        items={[...CITIES_2]}
        value={picker2}
        onSelect={(v) => { setPicker2(v); close(); }}
        onClose={close}
        style={SHEET_STYLE}
      />
    ));
  }

  function openPicker20() {
    open((close) => (
      <BottomSheetPicker
        title="Select city"
        items={[...CITIES_20]}
        value={picker20}
        renderItem={CustomCityRow}
        onSelect={(v) => { setPicker20(v); close(); }}
        onClose={close}
        style={SHEET_STYLE}
      />
    ));
  }

  function openPicker2Search() {
    open((close) => (
      <BottomSheetPicker
        title="Select city"
        items={[...CITIES_2]}
        value={picker2search}
        enableSearch
        searchPlaceholder="Search cities…"
        onSelect={(v) => { setPicker2search(v); close(); }}
        onClose={close}
        style={SHEET_STYLE}
      />
    ));
  }

  function openPicker20Search() {
    open((close) => (
      <BottomSheetPicker
        title="Select city"
        items={[...CITIES_20]}
        value={picker20search}
        enableSearch
        searchPlaceholder="Search cities…"
        renderItem={CustomCityRow}
        onSelect={(v) => { setPicker20search(v); close(); }}
        onClose={close}
        style={SHEET_STYLE}
      />
    ));
  }

  function openMulti() {
    // Capture current selection at open time — picker manages toggles internally.
    // onApply receives the confirmed final result.
    const initial = multi;
    open((close) => (
      <BottomSheetPicker
        title="Select cities"
        multiple
        items={[...CITIES_20]}
        values={initial}
        onApply={(vals) => { setMulti(vals); close(); }}
        applyButtonLabel="Done"
        onClose={close}
        style={SHEET_STYLE}
      />
    ));
  }

  function openMultiSearch() {
    const initial = multiSearch;
    open((close) => (
      <BottomSheetPicker
        title="Select cities"
        multiple
        items={[...CITIES_20]}
        values={initial}
        enableSearch
        searchPlaceholder="Search cities…"
        onApply={(vals) => { setMultiSearch(vals); close(); }}
        applyButtonLabel="Done"
        onClose={close}
        style={SHEET_STYLE}
      />
    ));
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (formOpen) {
    return (
      <InsetScreen style={s.formScreen}>
        <View style={s.formHeader}>
          <Text style={s.backBtn} onPress={() => setFormOpen(false)}>
            ← Back
          </Text>
          <Text style={s.formTitle}>Real-world form demo</Text>
        </View>
        <PackageFormDemo />
      </InsetScreen>
    );
  }

  return (
    <InsetScreen style={s.container}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <Text style={s.title}>Bottom Sheet Demos</Text>
        <Text style={s.subtitle}>@trebko/rn-bottom-sheet · all via Portal</Text>
      </View>

      {/* ── Demo list ──────────────────────────────────────────────────── */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
      >
        {/* Standard demos — all opened via useSheet().open() */}
        <DemoButton
          title={CLASSIC_DEMO.title}
          subtitle={CLASSIC_DEMO.subtitle}
          onPress={openClassic}
        />
        <DemoButton
          title={PICKER_SMALL_DEMO.title}
          subtitle={PICKER_SMALL_DEMO.subtitle}
          badge={pickerBadge(picker2)}
          isBadgeActive={!!picker2}
          onPress={openPicker2}
        />
        <DemoButton
          title={PICKER_LARGE_DEMO.title}
          subtitle={PICKER_LARGE_DEMO.subtitle}
          badge={pickerBadge(picker20)}
          isBadgeActive={!!picker20}
          onPress={openPicker20}
        />
        <DemoButton
          title={PICKER_SMALL_SEARCH_DEMO.title}
          subtitle={PICKER_SMALL_SEARCH_DEMO.subtitle}
          badge={pickerBadge(picker2search)}
          isBadgeActive={!!picker2search}
          onPress={openPicker2Search}
        />
        <DemoButton
          title={PICKER_LARGE_SEARCH_DEMO.title}
          subtitle={PICKER_LARGE_SEARCH_DEMO.subtitle}
          badge={pickerBadge(picker20search)}
          isBadgeActive={!!picker20search}
          onPress={openPicker20Search}
        />
        <DemoButton
          title={MULTI_PICKER_DEMO.title}
          subtitle={MULTI_PICKER_DEMO.subtitle}
          badge={multiBadge(multi)}
          isBadgeActive={multi.length > 0}
          onPress={openMulti}
        />
        <DemoButton
          title={MULTI_PICKER_SEARCH_DEMO.title}
          subtitle={MULTI_PICKER_SEARCH_DEMO.subtitle}
          badge={multiBadge(multiSearch)}
          isBadgeActive={multiSearch.length > 0}
          onPress={openMultiSearch}
        />

        {/* Real-world form demo */}
        <View style={s.sectionLabel}>
          <Text style={s.sectionText}>PRODUCTION PATTERNS</Text>
        </View>
        <DemoButton
          title={REAL_WORLD_FORM_DEMO.title}
          subtitle={REAL_WORLD_FORM_DEMO.subtitle}
          onPress={() => setFormOpen(true)}
        />
      </ScrollView>

      {/* ── Immersive mode toggle (Android only) ───────────────────────── */}
      {isSupported && (
        <View style={s.footer}>
          <View style={s.footerRow}>
            <View style={s.footerText}>
              <Text style={s.footerLabel}>Immersive bottom bar</Text>
              <Text style={s.footerHint}>
                {isImmersive ? 'Nav bar hidden · swipe to peek' : 'Nav bar visible'}
              </Text>
            </View>
            <Switch
              value={isImmersive}
              onValueChange={setImmersive}
              trackColor={{ false: '#E5E7EB', true: '#818CF8' }}
              thumbColor={isImmersive ? '#6366F1' : '#F9FAFB'}
            />
          </View>
        </View>
      )}
    </InsetScreen>
  );
}

// ─── Custom row (shared between picker20 and picker20search) ──────────────────

function CustomCityRow({ item, isSelected, onSelect }: PickerRenderItemInfo<string>) {
  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        cr.container,
        pressed && cr.pressed,
        isSelected && cr.selected,
      ]}
    >
      <Text style={[cr.label, item === 'Kharkiv' && cr.bold]}>{item}</Text>
      {isSelected && <View style={cr.dot} />}
    </Pressable>
  );
}

const cr = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: 16,
  },
  pressed:  { backgroundColor: '#F5F5F5' },
  selected: { backgroundColor: '#EEF2FF' },
  label:    { flex: 1, fontSize: 16, color: '#111827' },
  bold:     { fontWeight: '700' },
  dot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6366F1', marginRight: 8 },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: '#F3F4F6' },
  container: { flex: 1 },

  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title:    { fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6B7280', fontFamily: 'monospace' },

  scroll: { flex: 1 },
  list:   { padding: 20, gap: 12, paddingBottom: 32 },

  sectionLabel: {
    marginTop: 8,
    marginBottom: -2,
    paddingHorizontal: 2,
  },
  sectionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F1',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  footer: {
    margin: 20,
    marginTop: 4,
    backgroundColor: 'white',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  footerText:  { flex: 1 },
  footerLabel: { fontSize: 17, fontWeight: '600', color: '#111827', marginBottom: 3 },
  footerHint:  { fontSize: 13, color: '#6B7280' },

  formScreen: { flex: 1, backgroundColor: '#F3F4F6' },
  formHeader: {
    padding: 16,
    paddingBottom: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 2,
  },
  backBtn:   { fontSize: 14, color: '#6366F1', fontWeight: '600' },
  formTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
});
