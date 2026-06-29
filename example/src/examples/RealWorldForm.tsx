/**
 * RealWorldForm — реалистичный пример «формы создания посылки».
 *
 * Демонстрирует паттерн из production-приложений:
 *   1. forwardRef + useImperativeHandle — sheet-контроллер открывает
 *      пикер через Portal, сам рендерит null.
 *   2. API-поиск — items меняются по запросу с симуляцией задержки сети.
 *   3. Кастомный renderItem — мультистрочная строка с иконкой доставки.
 *   4. listEmptyComponent — 3 состояния: подсказка / загрузка / нет результатов.
 *   5. Поле из глубоко вложенного компонента через Portal → sheet всегда полноэкранный.
 *
 * Кнопки «From» и «To» в форме вызывают sheet изнутри ScrollView —
 * именно та «неудобная» иерархия, для решения которой создан Portal.
 */
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BottomSheetPicker, useSheet } from '@trebko/rn-bottom-sheet';
import type { PickerRenderItemInfo } from '@trebko/rn-bottom-sheet';

import { LOCATIONS } from '../shared/data/locations';
import type { LocationItem } from '../shared/data/locations';
import { SHEET_STYLE } from '../shared/utils/sheetStyle';

// ─── Demo catalogue entry ─────────────────────────────────────────────────────

export const REAL_WORLD_FORM_DEMO = {
  title: 'Real-world form',
  subtitle: 'forwardRef · API search · custom rows · nested ScrollView',
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LocationPickerSheetHandle {
  open: () => void;
}

interface LocationPickerSheetProps {
  selectedId?: number | null;
  onSelect: (item: LocationItem) => void;
}

// ─── Custom row renderer ──────────────────────────────────────────────────────

function LocationRow({ item, isSelected, onSelect }: PickerRenderItemInfo<LocationItem>) {
  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        row.container,
        isSelected && row.selected,
        pressed && row.pressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
    >
      <View style={row.body}>
        <View style={row.cityLine}>
          <Text style={[row.city, isSelected && row.cityActive]} numberOfLines={1}>
            {item.city}
          </Text>
          {item.hasDelivery && (
            <View style={row.badge}>
              <Text style={row.badgeText}>📦 delivery</Text>
            </View>
          )}
        </View>
        <Text style={row.region} numberOfLines={1}>
          {item.region}
        </Text>
      </View>
      {isSelected && <View style={row.dot} />}
    </Pressable>
  );
}

const row = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  pressed:  { backgroundColor: '#F9FAFB' },
  selected: { backgroundColor: '#EEF2FF' },
  body:     { flex: 1 },
  cityLine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  city:     { fontSize: 16, fontWeight: '500', color: '#111827' },
  cityActive: { color: '#4338CA', fontWeight: '700' },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#ECFDF5',
  },
  badgeText: { fontSize: 11, color: '#065F46' },
  region:   { fontSize: 13, color: '#6B7280' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6366F1', marginRight: 4 },
});

// ─── Empty/loading state ──────────────────────────────────────────────────────

function SearchEmptyState({
  query,
  isLoading,
}: {
  query: string;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <View style={empty.container}>
        <ActivityIndicator color="#6366F1" />
        <Text style={empty.text}>Searching…</Text>
      </View>
    );
  }
  if (query.length < 2) {
    return (
      <View style={empty.container}>
        <Text style={empty.hint}>Enter at least 2 characters to search</Text>
      </View>
    );
  }
  return (
    <View style={empty.container}>
      <Text style={empty.hint}>No cities found for "{query}"</Text>
    </View>
  );
}

const empty = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  text:      { marginTop: 8, fontSize: 14, color: '#9CA3AF' },
  hint:      { fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 24 },
});

// ─── Internal search component (owns its own state; mounted in Portal) ─────────

/**
 * Self-contained search content rendered by the Portal.
 * Manages query + results + loading state independently — the parent
 * form component doesn't need to hold any search state.
 */
function LocationSearchContent({
  selectedId,
  onSelect,
  onClose,
}: {
  selectedId?: number | null;
  onSelect: (item: LocationItem) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Simulate async API search with 300 ms debounce
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const timer = setTimeout(() => {
      const q = query.toLowerCase();
      setResults(
        LOCATIONS.filter(
          (l) =>
            l.city.toLowerCase().includes(q) ||
            l.region.toLowerCase().includes(q)
        )
      );
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const selectedItem = useMemo(
    () => (selectedId != null ? LOCATIONS.find((l) => l.id === selectedId) : undefined),
    [selectedId]
  );

  const listEmpty = useMemo(
    () => <SearchEmptyState query={query} isLoading={isLoading} />,
    [query, isLoading]
  );

  return (
    <BottomSheetPicker<LocationItem>
      title="City"
      items={results}
      value={selectedItem}
      enableSearch
      searchPlaceholder="Search by city or region…"
      searchValue={query}
      onSearchChange={setQuery}
      renderItem={LocationRow}
      keyExtractor={(item) => String(item.id)}
      getItemLabel={(item) => item.city}
      listEmptyComponent={listEmpty}
      onSelect={onSelect}
      onClose={onClose}
      itemHeight={72}
      style={SHEET_STYLE}
    />
  );
}

// ─── LocationPickerSheet — forwardRef controller ──────────────────────────────

/**
 * Thin controller component: renders null, exposes `open()` via ref.
 *
 * Consumers call `sheetRef.current?.open()` and never interact with
 * the Portal or BottomSheet directly — this is the real-world
 * abstraction layer for domain-specific pickers.
 */
export const LocationPickerSheet = forwardRef<
  LocationPickerSheetHandle,
  LocationPickerSheetProps
>(function LocationPickerSheet({ selectedId, onSelect }, ref) {
  const { open } = useSheet();

  useImperativeHandle(
    ref,
    () => ({
      open: () =>
        open((close) => (
          <LocationSearchContent
            selectedId={selectedId}
            onSelect={(item) => {
              onSelect(item);
              close();
            }}
            onClose={close}
          />
        )),
    }),
    // Re-create handle when selectedId or onSelect changes so the
    // freshest values are captured each time open() is called.
    [open, selectedId, onSelect]
  );

  return null;
});

// ─── FormField ────────────────────────────────────────────────────────────────

function FormField({
  label,
  value,
  placeholder,
  onPress,
}: {
  label: string;
  value?: string;
  placeholder: string;
  onPress: () => void;
}) {
  return (
    <View style={field.wrapper}>
      <Text style={field.label}>{label}</Text>
      <Pressable
        style={({ pressed }) => [field.input, pressed && field.inputPressed]}
        onPress={onPress}
        accessibilityRole="button"
      >
        <Text style={[field.value, !value && field.placeholder]} numberOfLines={1}>
          {value ?? placeholder}
        </Text>
        <Text style={field.arrow}>›</Text>
      </Pressable>
    </View>
  );
}

const field = StyleSheet.create({
  wrapper:      { gap: 6 },
  label:        { fontSize: 13, fontWeight: '600', color: '#374151', marginLeft: 2 },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 8,
  },
  inputPressed: { backgroundColor: '#F9FAFB' },
  value:        { flex: 1, fontSize: 16, color: '#111827' },
  placeholder:  { color: '#9CA3AF' },
  arrow:        { fontSize: 20, color: '#9CA3AF', marginTop: -1 },
});

// ─── PackageFormDemo ──────────────────────────────────────────────────────────

/**
 * A form nested inside a ScrollView — the "uncomfortable hierarchy" that
 * previously broke BottomSheet positioning. Both pickers are opened via
 * the Portal so they always cover the full screen regardless of nesting.
 */
export function PackageFormDemo() {
  const [fromCity, setFromCity] = useState<LocationItem | undefined>();
  const [toCity,   setToCity]   = useState<LocationItem | undefined>();

  const fromRef = useRef<LocationPickerSheetHandle>(null);
  const toRef   = useRef<LocationPickerSheetHandle>(null);

  const handleSelectFrom = useCallback((item: LocationItem) => setFromCity(item), []);
  const handleSelectTo   = useCallback((item: LocationItem) => setToCity(item),   []);

  return (
    <View style={form.container}>
      {/* Sheet controllers — render null, open via ref */}
      <LocationPickerSheet
        ref={fromRef}
        selectedId={fromCity?.id}
        onSelect={handleSelectFrom}
      />
      <LocationPickerSheet
        ref={toRef}
        selectedId={toCity?.id}
        onSelect={handleSelectTo}
      />

      <View style={form.intro}>
        <Text style={form.heading}>Package creation</Text>
        <Text style={form.hint}>
          Both pickers open from inside this ScrollView — Portal renders them full-screen.
        </Text>
      </View>

      {/* ScrollView is the "uncomfortable container" */}
      <ScrollView
        style={form.scroll}
        contentContainerStyle={form.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={form.section}>
          <Text style={form.sectionLabel}>ROUTE</Text>
          <FormField
            label="From"
            value={fromCity ? `${fromCity.city}, ${fromCity.region}` : undefined}
            placeholder="Select origin city"
            onPress={() => fromRef.current?.open()}
          />
          <FormField
            label="To"
            value={toCity ? `${toCity.city}, ${toCity.region}` : undefined}
            placeholder="Select destination city"
            onPress={() => toRef.current?.open()}
          />
        </View>

        <View style={form.section}>
          <Text style={form.sectionLabel}>RECIPIENT</Text>
          {MOCK_FIELDS.map((f) => (
            <View key={f.label} style={field.wrapper}>
              <Text style={field.label}>{f.label}</Text>
              <View style={[field.input, form.mockField]}>
                <Text style={[field.value, field.placeholder]}>{f.placeholder}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const MOCK_FIELDS = [
  { label: 'Recipient name',  placeholder: 'Enter name' },
  { label: 'Phone',           placeholder: '+38 0__ ___ __ __' },
  { label: 'Package weight',  placeholder: 'kg' },
  { label: 'Notes',           placeholder: 'Optional' },
];

const form = StyleSheet.create({
  container:    { flex: 1 },
  intro: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  heading:      { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 4 },
  hint:         { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  scroll:       { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, gap: 24 },
  section:      { gap: 12 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F1',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  mockField:    { opacity: 0.45 },
});
