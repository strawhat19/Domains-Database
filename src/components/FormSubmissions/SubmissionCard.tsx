import { useState } from 'react';
import type { createStyles } from './styles.native';
import { Pressable, Text, View } from 'react-native';
import { elementProps } from '../../shared/elementProps';
import type { useFormSubmissions } from './useFormSubmissions';
import { ChevronDown, ChevronUp, Check } from 'lucide-react-native';
import { submissionDate, submissionStatuses } from './useFormSubmissions';
import type { FormSubmission } from '../../shared/models/forms/FormSubmission';

interface SubmissionCardProps {
  saving: boolean;
  disabled: boolean;
  submission: FormSubmission;
  styles: ReturnType<typeof createStyles>;
  palette: ReturnType<typeof useFormSubmissions>[`palette`];
  updateStatus: ReturnType<typeof useFormSubmissions>[`updateStatus`];
}

const SubmissionCard = ({ styles, palette, submission, saving, disabled, updateStatus }: SubmissionCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const status = submissionStatuses.find(option => option.value === submission.status) ?? submissionStatuses[0];
  const Icon = expanded ? ChevronUp : ChevronDown;
  return (
    <View {...elementProps(`form-submission-card`, submission.id)} style={styles.card}>
      <View {...elementProps(`form-submission-card-heading`, submission.id)} style={styles.cardHeading}>
        <Text {...elementProps(`form-submission-name`, submission.id)} style={styles.name} selectable>{submission.name}</Text>
        <View {...elementProps(`actionsCell`, `submission-${submission.id}`)} style={styles.statusCell}>
          <View {...elementProps(`rowStatus`, `submission-${submission.id}`)} style={styles.statusCell}>
            <View {...elementProps(`statusDotWrap`, `submission-${submission.id}`)}>
              <View {...elementProps(`statusDot`, `submission-${submission.id}`)} style={[styles.dot, { backgroundColor: palette[status.color] }]} />
            </View>
            <Text {...elementProps(`statusText`, `submission-${submission.id}`)} style={[styles.label, { color: palette[status.color] }]}>{saving ? `Saving…` : status.label}</Text>
          </View>
        </View>
      </View>
      <Text {...elementProps(`form-submission-email`, submission.id)} style={styles.label} selectable>{submission.email}</Text>
      <Text {...elementProps(`form-submission-subject`, submission.id)} style={styles.subject} selectable>{submission.subject}</Text>
      <Text {...elementProps(`form-submission-message`, submission.id)} style={styles.message} numberOfLines={expanded ? undefined : 3} selectable>{submission.message}</Text>
      <Pressable {...elementProps(`form-submission-expand`, submission.id)} style={styles.expand} accessibilityRole={`button`} accessibilityState={{ expanded }} onPress={() => setExpanded(previous => !previous)}>
        <Icon {...elementProps(`form-submission-expand-icon`, submission.id)} size={13} color={palette.accent} />
        <Text {...elementProps(`form-submission-expand-label`, submission.id)} style={styles.expandLabel}>{expanded ? `Show Less` : `Read Message`}</Text>
      </Pressable>
      <Text {...elementProps(`form-submission-created`, submission.id)} style={styles.label}>{`Submitted ${submissionDate(submission.created)}`}</Text>
      <View {...elementProps(`form-submission-status-options`, submission.id)} style={styles.statusOptions}>
        {submissionStatuses.map(option => (
          <Pressable
            key={option.value}
            disabled={disabled}
            accessibilityRole={`button`}
            accessibilityState={{ disabled, selected: submission.status === option.value }}
            accessibilityLabel={`Mark ${submission.subject} As ${option.label}`}
            {...elementProps(`form-submission-status-option`, `${submission.id}-${option.value}`)}
            onPress={() => { void updateStatus(submission.id, option.value); }}
            style={[styles.statusOption, submission.status === option.value && styles.selectedOption, disabled && styles.disabled]}
          >
            {submission.status === option.value && <Check {...elementProps(`form-submission-status-option-icon`, `${submission.id}-${option.value}`)} size={12} color={palette.accent} />}
            <Text {...elementProps(`form-submission-status-option-label`, `${submission.id}-${option.value}`)} style={styles.optionLabel}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

export default SubmissionCard;
