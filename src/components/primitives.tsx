import { PropsWithChildren } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { colors, radius, spacing } from '../design/tokens';

export function Screen({
  title,
  eyebrow,
  children,
  scroll = true,
}: PropsWithChildren<{ title: string; eyebrow?: string; scroll?: boolean }>) {
  const content = (
    <View style={styles.content}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      {children}
    </View>
  );
  return scroll ? (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scroll}>{content}</ScrollView>
  ) : (
    <View style={[styles.screen, styles.scroll]}>{content}</View>
  );
}

export function ActionButton({
  label,
  onPress,
  disabled,
  destructive,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        destructive && styles.destructive,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

export function Field(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.faint}
      accessibilityLabel={props.accessibilityLabel ?? props.placeholder}
      {...props}
      style={[styles.field, props.style]}
    />
  );
}

export function Panel({ children }: PropsWithChildren) {
  return <View style={styles.panel}>{children}</View>;
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

export const commonStyles = StyleSheet.create({
  body: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  label: { color: colors.ivory, fontSize: 15, fontWeight: '600' },
  meta: { color: colors.faint, fontSize: 12, letterSpacing: 0.6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  spread: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  gap: { gap: spacing.md },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.obsidian },
  scroll: { flexGrow: 1, padding: spacing.xl, paddingBottom: 110 },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: spacing.lg },
  eyebrow: { color: colors.brass, fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  title: { color: colors.ivory, fontSize: 30, fontWeight: '700', letterSpacing: 1.2 },
  button: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.brass,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.brassBright,
  },
  destructive: { backgroundColor: '#3A1E1A', borderColor: colors.danger },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.78 },
  buttonText: { color: colors.obsidian, fontSize: 13, fontWeight: '800', letterSpacing: 1.3 },
  field: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    color: colors.ivory,
    fontSize: 16,
    paddingHorizontal: spacing.md,
  },
  panel: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  empty: {
    minHeight: 160,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: { color: colors.ivory, fontSize: 18, fontWeight: '600' },
  body: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: 'center' },
});
