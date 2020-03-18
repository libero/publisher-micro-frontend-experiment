import { HydraResource } from 'alcaeus';
import { isHydraResource } from './types';

export default async <Type extends HydraResource>(resource: Type): Promise<Type> => {
  if (typeof resource.load !== 'function') {
    return resource;
  }

  const dereferenced = await resource.load();

  return isHydraResource(dereferenced.root) ? dereferenced.root as Type : resource;
}
