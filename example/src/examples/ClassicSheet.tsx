/**
 * ClassicSheet — demonstrates fixed snap points with scrollable content.
 *
 * Usage:
 *   <ClassicSheet onClose={() => setOpen(false)} />
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BottomSheet, BottomSheetScrollView } from '@trebko/rn-bottom-sheet';
import { SHEET_STYLE } from '../shared/utils/sheetStyle';

// ─── Demo catalogue entry ────────────────────────────────────────────────────

export const CLASSIC_DEMO = {
  key: 'classic' as const,
  title: 'Classic snap points',
  subtitle: '3 snap points · drag handle to resize or close',
};

// ─── Sheet component ─────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
  bottomInset?: number;
  isImmersive?: boolean;
}

export function ClassicSheet({ onClose, bottomInset = 0, isImmersive = false }: Props) {
  return (
    <BottomSheet
      snapPoints={['40%', '70%', '95%']}
      initialSnapPointIndex={0}
      enableBackdrop
      backdropOpacity={0.6}
      enablePanDownToClose
      bottomInset={bottomInset}
      isImmersive={isImmersive}
      onClose={onClose}
      style={SHEET_STYLE}
    >
      <BottomSheetScrollView style={s.scroll}>
        <Text style={s.title}>Slobozhanshchyna & Kharkiv</Text>

        <Text style={s.sectionLabel}>History of the Region</Text>
        <Text style={s.body}>
          Slobozhanshchyna is a historical region in eastern Ukraine covering
          present-day Kharkiv, Sumy, and parts of Luhansk oblasts. The name
          derives from "sloboda" — settlements whose inhabitants in the 17th
          century were exempt from duties in exchange for defending the frontier.
        </Text>
        <Text style={s.body}>
          Mass settlement began in the 1630s–1680s, when Cossack and peasant
          families fled Right-Bank Ukraine. Kharkiv was founded in 1654 as a
          fortress and quickly became the dominant hub of the region.
        </Text>

        <Text style={s.sectionLabel}>Kharkiv & the World</Text>
        {ACHIEVEMENTS.map((a) => (
          <View key={a.title} style={s.card}>
            <Text style={s.icon}>{a.icon}</Text>
            <View style={s.cardBody}>
              <Text style={s.cardTitle}>{a.title}</Text>
              <Text style={s.cardText}>{a.text}</Text>
            </View>
          </View>
        ))}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

// ─── Data ────────────────────────────────────────────────────────────────────

const ACHIEVEMENTS = [
  {
    icon: '🔬',
    title: "World's First Synthetic Ruby",
    text: 'In 1902, Kharkiv chemist Gustav Tammann pioneered the synthesis of corundum, founding the industrial gemstone industry.',
  },
  {
    icon: '⚛️',
    title: 'First Atom Split in the USSR',
    text: 'In 1932, scientists at KIPT performed the first Soviet nuclear fission reaction, splitting lithium nuclei.',
  },
  {
    icon: '🚜',
    title: 'The T-34 Tank',
    text: 'The Kharkiv Locomotive Plant launched serial T-34 production in 1940 — the tank that changed WWII.',
  },
  {
    icon: '🏫',
    title: 'Student Capital',
    text: 'Founded in 1804, Kharkiv University is one of the oldest in Eastern Europe. ~200,000 students study here today.',
  },
  {
    icon: '🚇',
    title: 'Metro & Architecture',
    text: 'Kharkiv Metro (1975) is Ukraine\'s second. Freedom Square (12 ha) is one of Europe\'s largest. Derzhprom (1928) is a Constructivist landmark.',
  },
  {
    icon: '💻',
    title: 'IT Hub Today',
    text: 'Home to EPAM, Luxoft, GlobalLogic, and hundreds of startups — Kharkiv is Ukraine\'s leading tech centre.',
  },
];

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  scroll: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366F1',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
  body: { fontSize: 15, color: '#374151', lineHeight: 23, marginBottom: 14 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  icon: { fontSize: 24, lineHeight: 30 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 3 },
  cardText: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
});
