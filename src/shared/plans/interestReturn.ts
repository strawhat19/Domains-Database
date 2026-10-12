import { isAppCollectionID } from '../common/ids';

export const resolvePlanInterestId = (value: unknown) => typeof value === `string` && value.length <= 240 && isAppCollectionID(value, `Plan`) ? value : ``;
