import { canAccessAdmin } from '../../shared/admin/permissions';
import { firebaseEnabled } from '../../shared/firebase/config';
import { decodeField, readDocument, verifyFirebaseToken, requireSignedInUser, type ImportFirebaseContext } from '../connections/firebase';

export class AdminAuthError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export const requireAnalyticsAdmin = async (request: Request, signal: AbortSignal) => {
  const token = request.headers.get(`authorization`)?.match(/^Bearer ([A-Za-z0-9._-]+)$/i)?.[1];
  if (!token || token.length > 8192) throw new AdminAuthError(401, `admin_sign_in_required`, `Sign In To View Admin Reports`);
  if (!firebaseEnabled) throw new AdminAuthError(503, `admin_auth_not_configured`, `Connect Firebase To View Admin Reports`);
  const context: ImportFirebaseContext = { token, signal, readVersions: new Map() };
  const firebaseUid = await verifyFirebaseToken(context);
  const userId = await requireSignedInUser(firebaseUid, context);
  const document = await readDocument([`users`, userId], context);
  if (!document) throw new AdminAuthError(403, `admin_access_required`, `Admin Access Is Required`);
  const role = decodeField(document.fields.role);
  const active = decodeField(document.fields.active) === true;
  if (decodeField(document.fields.id) !== userId || decodeField(document.fields.firebase_uid) !== firebaseUid
    || typeof role !== `string` || !canAccessAdmin({ id: userId, role, active })) throw new AdminAuthError(403, `admin_access_required`, `Admin Access Is Required`);
};
