import { hydra, schema } from '@tpluscode/rdf-ns-builders';
import { RdfResource } from '@tpluscode/rdfine';
import { Class, Collection, HydraResource } from 'alcaeus';

export const isObject = (item: unknown): item is object => (
  typeof item === 'object' && item !== null
);

export const isRdfResource = (item: unknown): item is RdfResource => (
  isObject(item) && 'id' in item && 'types' in item
);

export const isHydraResource = (item: unknown): item is HydraResource => (
  isRdfResource(item) && 'getLinks' in item
);

export const isCollection = (item: unknown): item is Collection => (
  isHydraResource(item) && item.hasType(hydra.Collection)
);

export const isArticle = (item: unknown): item is Class => (
  isHydraResource(item) && item.hasType(schema.Article)
);
