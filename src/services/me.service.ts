import type { User } from '../models/User.model';
import type { PlatformForMe } from '../models/Platform.model';
import type { Paginated } from './types';
import { apiService } from './api.service';

export const meService = {
  get: () => apiService.get<User>('/me/'),
  // `MePlatformsView` est un `ListAPIView` standard : comme tous les autres
  // endpoints de liste de l'API, la pagination DRF s'applique — la réponse
  // est `{count, next, previous, results}`, pas un tableau brut.
  platforms: () => apiService.get<Paginated<PlatformForMe>>('/me/platforms/'),
};
