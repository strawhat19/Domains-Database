import { useMemo, useState } from 'react';
import { Text, View, Image } from 'react-native';
import { createStyles } from './styles.native';
import { elementProps } from '../../shared/elementProps';
import { useAuth } from '../../shared/authContext/useAuth';
import { useTheme } from '../../shared/themeContext/useTheme';

const safePhoto = (value: unknown) => {
  if (typeof value !== `string`) return undefined;
  try { const url = new URL(value); return url.protocol === `https:` && !url.username && !url.password ? url.href : undefined; }
  catch { return undefined; }
};
const FeedbackIdentity = ({ id, userId, name, caption }: { id: string; userId: string; name: string; caption?: string }) => {
  const { user } = useAuth();
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [failedPhoto, setFailedPhoto] = useState(``);
  const own = user?.id === userId;
  const displayName = own ? user?.name || name : name;
  const photo = own ? safePhoto(user?.photoURL || user?.avatar) : undefined;
  const photoKey = `${userId}:${photo ?? ``}`;
  return <View {...elementProps(`feedback-identity`, id)} style={styles.root}>
    <View {...elementProps(`feedback-identity-avatar`, id)} style={styles.avatar} accessible={false}>
      <Text {...elementProps(`feedback-identity-initial`, id)} style={styles.initial}>{displayName?.trim()?.[0]?.toUpperCase() || `U`}</Text>
      {photo && failedPhoto !== photoKey ? <Image {...elementProps(`feedback-identity-photo`, id)} source={{ uri: photo }} style={styles.photo} accessible={false} onError={() => setFailedPhoto(photoKey)} /> : null}
    </View>
    <View {...elementProps(`feedback-identity-copy`, id)} style={styles.copy}>
      <Text {...elementProps(`feedback-identity-name`, id)} style={styles.name}>{displayName || `Account`}</Text>
      {caption ? <Text {...elementProps(`feedback-identity-caption`, id)} style={styles.caption}>{caption}</Text> : null}
    </View>
  </View>;
};
export default FeedbackIdentity;
