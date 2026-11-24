import type { ShallowRef } from 'vue';
import type { VcsUiApp } from '@vcmap/ui';
import type { ItemSource, SelectItem } from './useAppItems.js';
import { useAppItems } from './useAppItems.js';

/** All item sources used by callback options (see callbackDefinitions). */
const callbackItemSources: ItemSource[] = [
  'layers',
  'styles',
  'viewpoints',
  'navbarButtons',
  'toolbarButtons',
  'modules',
  'clippingPolygons',
  'maps',
  'flights',
];

/**
 * Provides the select items for callback options. All sources are created upfront,
 * since composables must be called synchronously in setup.
 */
export function useCallbackItems(app: VcsUiApp): {
  getItems: (source: ItemSource) => SelectItem[];
  getItemTitle: (source: ItemSource, value: string) => string;
} {
  const items = new Map<ItemSource, ShallowRef<SelectItem[]>>(
    callbackItemSources.map((source) => [source, useAppItems(app, source)]),
  );

  function getItems(source: ItemSource): SelectItem[] {
    return items.get(source)?.value ?? [];
  }

  function getItemTitle(source: ItemSource, value: string): string {
    return getItems(source).find((i) => i.value === value)?.title ?? value;
  }

  return { getItems, getItemTitle };
}
