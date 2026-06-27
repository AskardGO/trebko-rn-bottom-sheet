import React, { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Switch, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { InsetScreen, useImmersiveMode } from '@trebko/rn-bottom-sheet';

import { DemoButton } from '../shared/ui/DemoButton';

import { CLASSIC_DEMO, ClassicSheet } from '../examples/ClassicSheet';
import { PICKER_SMALL_DEMO, PickerSmallSheet } from '../examples/PickerSmall';
import { PICKER_LARGE_DEMO, PickerLargeSheet } from '../examples/PickerLarge';
import { PICKER_SMALL_SEARCH_DEMO, PickerSmallSearchSheet } from '../examples/PickerSmallSearch';
import { PICKER_LARGE_SEARCH_DEMO, PickerLargeSearchSheet } from '../examples/PickerLargeSearch';
import { MULTI_PICKER_DEMO, MultiPickerSheet } from '../examples/MultiPicker';
import { MULTI_PICKER_SEARCH_DEMO, MultiPickerSearchSheet } from '../examples/MultiPickerSearch';

// ─── Types ───────────────────────────────────────────────────────────────────

type DemoKey =
  | 'classic'
  | 'picker2'
  | 'picker20'
  | 'picker2search'
  | 'picker20search'
  | 'multi'
  | 'multiSearch'
  | null;

// ─── App ─────────────────────────────────────────────────────────────────────

export function App() {
  // Which demo sheet is currently open
  const [open, setOpen] = useState<DemoKey>(null);
  const close = () => setOpen(null);

  // Per-picker selected values
  const [picker2, setPicker2] = useState<string | undefined>();
  const [picker20, setPicker20] = useState<string | undefined>();
  const [picker2search, setPicker2search] = useState<string | undefined>();
  const [picker20search, setPicker20search] = useState<string | undefined>();
  const [multi, setMulti] = useState<string[]>([]);
  const [multiSearch, setMultiSearch] = useState<string[]>([]);

  // Immersive mode (Android only — hides the navigation bar)
  const { isImmersive, setImmersive, isSupported } = useImmersiveMode();

  // Helpers for badges
  const pickerBadge = (v?: string) => v ?? 'None';
  const multiBadge = (v: string[]) => (v.length > 0 ? `${v.length} selected` : 'None');

  return (
    <GestureHandlerRootView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />

      <InsetScreen style={s.container}>
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={s.header}>
          <Text style={s.title}>Bottom Sheet Demos</Text>
          <Text style={s.subtitle}>@trebko/rn-bottom-sheet</Text>
        </View>

        {/* ── Demo list ──────────────────────────────────────────────────── */}
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
        >
          <DemoButton
            title={CLASSIC_DEMO.title}
            subtitle={CLASSIC_DEMO.subtitle}
            onPress={() => setOpen('classic')}
          />
          <DemoButton
            title={PICKER_SMALL_DEMO.title}
            subtitle={PICKER_SMALL_DEMO.subtitle}
            badge={pickerBadge(picker2)}
            isBadgeActive={!!picker2}
            onPress={() => setOpen('picker2')}
          />
          <DemoButton
            title={PICKER_LARGE_DEMO.title}
            subtitle={PICKER_LARGE_DEMO.subtitle}
            badge={pickerBadge(picker20)}
            isBadgeActive={!!picker20}
            onPress={() => setOpen('picker20')}
          />
          <DemoButton
            title={PICKER_SMALL_SEARCH_DEMO.title}
            subtitle={PICKER_SMALL_SEARCH_DEMO.subtitle}
            badge={pickerBadge(picker2search)}
            isBadgeActive={!!picker2search}
            onPress={() => setOpen('picker2search')}
          />
          <DemoButton
            title={PICKER_LARGE_SEARCH_DEMO.title}
            subtitle={PICKER_LARGE_SEARCH_DEMO.subtitle}
            badge={pickerBadge(picker20search)}
            isBadgeActive={!!picker20search}
            onPress={() => setOpen('picker20search')}
          />
          <DemoButton
            title={MULTI_PICKER_DEMO.title}
            subtitle={MULTI_PICKER_DEMO.subtitle}
            badge={multiBadge(multi)}
            isBadgeActive={multi.length > 0}
            onPress={() => setOpen('multi')}
          />
          <DemoButton
            title={MULTI_PICKER_SEARCH_DEMO.title}
            subtitle={MULTI_PICKER_SEARCH_DEMO.subtitle}
            badge={multiBadge(multiSearch)}
            isBadgeActive={multiSearch.length > 0}
            onPress={() => setOpen('multiSearch')}
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

      {/* ── Sheets (rendered outside padded area → cover full screen) ───── */}
      {open === 'classic' && (
        <ClassicSheet onClose={close} />
      )}
      {open === 'picker2' && (
        <PickerSmallSheet
          value={picker2}
          onSelect={(v) => { setPicker2(v); close(); }}
          onClose={close}
        />
      )}
      {open === 'picker20' && (
        <PickerLargeSheet
          value={picker20}
          onSelect={(v) => { setPicker20(v); close(); }}
          onClose={close}
        />
      )}
      {open === 'picker2search' && (
        <PickerSmallSearchSheet
          value={picker2search}
          onSelect={(v) => { setPicker2search(v); close(); }}
          onClose={close}
        />
      )}
      {open === 'picker20search' && (
        <PickerLargeSearchSheet
          value={picker20search}
          onSelect={(v) => { setPicker20search(v); close(); }}
          onClose={close}
        />
      )}
      {open === 'multi' && (
        <MultiPickerSheet
          values={multi}
          onValuesChange={setMulti}
          onClose={close}
        />
      )}
      {open === 'multiSearch' && (
        <MultiPickerSearchSheet
          values={multiSearch}
          onValuesChange={setMultiSearch}
          onClose={close}
        />
      )}
    </GestureHandlerRootView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F3F4F6' },
  container: { flex: 1 },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6B7280', fontFamily: 'monospace' },
  scroll: { flex: 1 },
  list: { padding: 20, gap: 12, paddingBottom: 32 },
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
  footerText: { flex: 1 },
  footerLabel: { fontSize: 17, fontWeight: '600', color: '#111827', marginBottom: 3 },
  footerHint: { fontSize: 13, color: '#6B7280' },
});
