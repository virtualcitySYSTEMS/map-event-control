import type { ShallowRef } from 'vue';
import { onUnmounted, shallowRef, unref } from 'vue';
import type { Collection, VcsObject, VcsModule } from '@vcmap/core';
import { moduleIdSymbol, volatileModuleId } from '@vcmap/core';
import type { VcsUiApp } from '@vcmap/ui';
import {
  attributionsComponentId,
  categoryManagerWindowId,
  customScreenComponentId,
  helpComponentId,
  legendComponentId,
  settingsComponentId,
  splashScreenComponentId,
} from '@vcmap/ui';

export type SelectItem = { title: string; value: string };

export type ItemSource =
  | 'layers'
  | 'maps'
  | 'viewpoints'
  | 'styles'
  | 'clippingPolygons'
  | 'modules'
  | 'plannings'
  | 'windows'
  | 'navbarButtons'
  | 'toolbarButtons'
  | 'flights';

type PlanningInstance = {
  _id: string;
  name: string;
  properties?: Record<string, unknown>;
};

type PlanningPlugin = {
  planningInstances?: Collection<PlanningInstance>;
};

const planningPluginName = '@vcmap/planning';

/** Windows provided by @vcmap/ui itself, which can be targeted even when currently closed. */
const knownWindowIds = [
  legendComponentId,
  attributionsComponentId,
  settingsComponentId,
  helpComponentId,
  categoryManagerWindowId,
  splashScreenComponentId,
  customScreenComponentId,
];

/**
 * Returns the title of an object: properties.title if available, otherwise its name.
 */
function getTitle(item: PlanningInstance | VcsModule | VcsObject): string {
  return (item.properties?.title as string | undefined) || item.name;
}

function isNotVolatile(item: VcsObject): boolean {
  return (
    (item as unknown as Record<symbol, string>)[moduleIdSymbol] !==
    volatileModuleId
  );
}

function getCollectionItems<T extends VcsObject>(
  collection: Iterable<T>,
): SelectItem[] {
  return [...collection]
    .filter(isNotVolatile)
    .map((item) => ({ title: getTitle(item), value: item.name }));
}

function headerTitleToString(title: unknown): string | undefined {
  const value: unknown = unref(title);
  if (Array.isArray(value)) {
    return value.join(' ');
  }
  return typeof value === 'string' ? value : undefined;
}

type ItemsGetter = {
  get: () => SelectItem[];
  listen: (cb: () => void) => Array<() => void>;
};

function getCollectionGetter<T extends VcsObject>(
  collection: Collection<T>,
): ItemsGetter {
  return {
    get: () => getCollectionItems(collection),
    listen: (cb) => [
      collection.added.addEventListener(cb),
      collection.removed.addEventListener(cb),
    ],
  };
}

function getItemsGetter(app: VcsUiApp, source: ItemSource): ItemsGetter {
  switch (source) {
    case 'layers':
      return getCollectionGetter(app.layers);
    case 'maps':
      return getCollectionGetter(app.maps);
    case 'viewpoints':
      return getCollectionGetter(app.viewpoints);
    case 'styles':
      return getCollectionGetter(app.styles);
    case 'clippingPolygons':
      return getCollectionGetter(app.clippingPolygons);
    case 'flights':
      return getCollectionGetter(app.flights);
    default:
      break;
  }

  if (source === 'modules') {
    return {
      get: () =>
        app.modules
          .filter((m) => m._id !== volatileModuleId)
          .map((m) => ({ title: getTitle(m), value: m._id })),
      listen: (cb) => [
        app.moduleAdded.addEventListener(cb),
        app.moduleRemoved.addEventListener(cb),
      ],
    };
  }

  if (source === 'plannings') {
    const getInstances = (): Collection<PlanningInstance> | undefined =>
      (app.plugins.getByKey(planningPluginName) as PlanningPlugin | undefined)
        ?.planningInstances;
    return {
      get: () =>
        [...(getInstances() ?? [])].map((p) => ({
          title: getTitle(p),
          value: p._id,
        })),
      listen: (cb): Array<() => void> => {
        let instanceListeners: Array<() => void> = [];
        const removeInstanceListeners = (): void => {
          instanceListeners.forEach((l) => {
            l();
          });
        };
        const listenToInstances = (): void => {
          removeInstanceListeners();
          const instances = getInstances();
          instanceListeners = instances
            ? [
                instances.added.addEventListener(cb),
                instances.removed.addEventListener(cb),
              ]
            : [];
        };
        listenToInstances();
        const onPluginChanged = (): void => {
          listenToInstances();
          cb();
        };
        return [
          app.plugins.added.addEventListener(onPluginChanged),
          app.plugins.removed.addEventListener(onPluginChanged),
          removeInstanceListeners,
        ];
      },
    };
  }

  if (source === 'windows') {
    return {
      get: (): SelectItem[] => {
        const ids = [
          ...new Set([...knownWindowIds, ...app.windowManager.componentIds]),
        ];
        return ids.map((id) => {
          const title = app.windowManager.has(id)
            ? headerTitleToString(app.windowManager.get(id).state.headerTitle)
            : undefined;
          return { title: title || id, value: id };
        });
      },
      listen: (cb) => [
        app.windowManager.added.addEventListener(cb),
        app.windowManager.removed.addEventListener(cb),
      ],
    };
  }

  if (source === 'toolbarButtons') {
    return {
      get: (): SelectItem[] =>
        app.toolboxManager.componentIds.map((id) => {
          const component = app.toolboxManager.get(id) as
            | { action?: { name?: string }; title?: string }
            | undefined;
          return {
            title: component?.action?.name || component?.title || id,
            value: id,
          };
        }),
      listen: (cb) => [
        app.toolboxManager.added.addEventListener(cb),
        app.toolboxManager.removed.addEventListener(cb),
      ],
    };
  }

  // navbarButtons
  return {
    get: () =>
      app.navbarManager.componentIds.map((id) => ({
        title: app.navbarManager.get(id)?.action?.name || id,
        value: id,
      })),
    listen: (cb) => [
      app.navbarManager.added.addEventListener(cb),
      app.navbarManager.removed.addEventListener(cb),
    ],
  };
}

/**
 * Creates a reactive list of select items of the given source, which updates when items are added or removed.
 * Item titles are derived from `properties.title`, falling back to the name.
 */
export function useAppItems(
  app: VcsUiApp,
  source: ItemSource,
): ShallowRef<SelectItem[]> {
  const getter = getItemsGetter(app, source);
  const items = shallowRef(getter.get());
  const listeners = getter.listen(() => {
    items.value = getter.get();
  });

  onUnmounted(() => {
    listeners.forEach((l) => {
      l();
    });
  });

  return items;
}
