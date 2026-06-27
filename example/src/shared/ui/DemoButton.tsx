import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  title: string;
  subtitle: string;
  onPress: () => void;
  /** Display text for the trailing badge. Omit to hide the badge entirely. */
  badge?: string;
  /** Highlights the badge in the active (selected) colour. */
  isBadgeActive?: boolean;
}

export function DemoButton({ title, subtitle, onPress, badge, isBadgeActive }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [s.card, pressed && s.cardPressed]}
      onPress={onPress}
    >
      <View style={s.inner}>
        <View style={s.text}>
          <Text style={s.title}>{title}</Text>
          <Text style={s.subtitle}>{subtitle}</Text>
        </View>
        {badge !== undefined && (
          <View style={[s.badge, isBadgeActive && s.badgeActive]}>
            <Text
              style={[s.badgeText, isBadgeActive && s.badgeTextActive]}
              numberOfLines={1}
            >
              {badge}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardPressed: {
    backgroundColor: '#F9FAFB',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  text: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  badge: {
    minWidth: 72,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  badgeActive: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  badgeTextActive: {
    color: '#4338CA',
  },
});
