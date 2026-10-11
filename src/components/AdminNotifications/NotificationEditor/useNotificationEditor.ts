import { useState } from 'react';
import type { NotificationEditorProps } from './types';
import { AnnouncementStatus } from '../../../shared/models/notifications/Notification';

export const useNotificationEditor = ({ record, onSave }: Pick<NotificationEditorProps, `record` | `onSave`>) => {
  const [error, setError] = useState(``);
  const [values, setValues] = useState(() => ({
    slug: record?.slug ?? ``,
    title: record?.title ?? ``,
    suffix: record?.suffix ?? ``,
    linkHref: record?.link?.href ?? ``,
    linkLabel: record?.link?.label ?? ``,
    kind: record?.kind ?? `announcement`,
    body: record?.body || record?.description || record?.details || ``,
    status: record?.status === AnnouncementStatus.Active ? AnnouncementStatus.Active : AnnouncementStatus.Draft,
  }));
  const setField = (key: keyof typeof values, value: string) => {
    setError(``);
    setValues(current => ({ ...current, [key]: value }));
  };
  const submit = async () => {
    if (!values.title.trim() || !values.body.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug)) {
      setError(`Enter A Title, Body, And Lowercase URL Slug`);
      return false;
    }
    if (!!values.linkHref.trim() !== !!values.linkLabel.trim()) {
      setError(`Enter A Link Label And Destination, Or Leave Both Empty`);
      return false;
    }
    setError(``);
    return onSave({
      slug: values.slug,
      body: values.body,
      title: values.title,
      suffix: values.suffix,
      kind: values.kind === `development` ? `development` : `announcement`,
      status: values.status === AnnouncementStatus.Active ? AnnouncementStatus.Active : AnnouncementStatus.Draft,
      ...(values.linkHref.trim() ? { link: { href: values.linkHref.trim(), label: values.linkLabel.trim() } } : {}),
    }, record?.id);
  };
  return { error, values, submit, setField };
};
