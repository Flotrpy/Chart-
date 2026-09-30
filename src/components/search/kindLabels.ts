import type { ResultKind } from '../../types/search';

export const KIND_LABEL: Record<ResultKind, string> = {
  tenant: 'Tenant',
  building: 'Building',
  landmark: 'Landmark',
  business: 'Business',
  address: 'Address',
  place: 'Place',
};
