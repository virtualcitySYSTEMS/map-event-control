import type { VcsMap } from '@vcmap/core';
import { LayerState, MapState } from '@vcmap/core';
import type {
  VcsPlugin,
  VcsUiApp,
  PluginConfigEditor,
  VcsCallbackOptions,
} from '@vcmap/ui';
import { executeCallbacks } from '@vcmap/ui';
import { name, version, mapVersion } from '../package.json';

enum EventType {
  Layer = 'layer',
  Map = 'map',
  Module = 'module',
  Planning = 'planning',
  Window = 'window',
}

type Action = {
  type: EventType;
  targetName: string;
  onActivate?: Array<VcsCallbackOptions>;
  onDeactivate?: Array<VcsCallbackOptions>;
};
type EventControlConfig = { actions?: Array<Action> };
type EventControlState = Record<never, never>;

function handleMapStateChange(
  vcsUiApp: VcsUiApp,
  map: VcsMap,
  actions: Action[],
): () => void {
  return map.stateChanged.addEventListener((state) => {
    actions.forEach((action) => {
      if (action.onActivate?.length && state === MapState.ACTIVE) {
        executeCallbacks(vcsUiApp, action.onActivate);
      }
      if (action.onDeactivate?.length && state === MapState.INACTIVE) {
        executeCallbacks(vcsUiApp, action.onDeactivate);
      }
    });
  });
}

type EventControl = VcsPlugin<EventControlConfig, EventControlState>;

export default function eventControl(config: EventControlConfig): EventControl {
  const listeners: Array<() => void> = [];
  return {
    get name(): string {
      return name;
    },
    get version(): string {
      return version;
    },
    get mapVersion(): string {
      return mapVersion;
    },
    onVcsAppMounted(vcsUiApp: VcsUiApp): void {
      if (config.actions?.some((a) => a.type === EventType.Layer)) {
        listeners.push(
          vcsUiApp.layers.stateChanged.addEventListener((layer) => {
            config.actions
              ?.filter(
                (a) =>
                  a.type === EventType.Layer && a.targetName === layer.name,
              )
              .forEach((action) => {
                if (
                  layer.state === LayerState.ACTIVE &&
                  action.onActivate?.length
                ) {
                  executeCallbacks(vcsUiApp, action.onActivate);
                } else if (
                  layer.state === LayerState.INACTIVE &&
                  action.onDeactivate?.length
                ) {
                  executeCallbacks(vcsUiApp, action.onDeactivate);
                }
              });
          }),
        );
      }

      if (config.actions?.some((a) => a.type === EventType.Map)) {
        const mapsActions = config.actions.filter(
          (a) => a.type === EventType.Map,
        );
        const mapNames = [...new Set(mapsActions.map((a) => a.targetName))];
        mapNames.forEach((mapName) => {
          const map = vcsUiApp.maps.getByKey(mapName);
          const mapActions = mapsActions.filter(
            (a) => a.targetName === mapName,
          );
          if (map) {
            listeners.push(handleMapStateChange(vcsUiApp, map, mapActions));
          } else {
            const addedMapListener = vcsUiApp.maps.added.addEventListener(
              (m) => {
                if (m.name === mapName) {
                  addedMapListener?.();
                  listeners.push(handleMapStateChange(vcsUiApp, m, mapActions));
                }
              },
            );
          }
        });
      }

      if (
        config.actions?.some(
          (action) =>
            action.type === EventType.Module ||
            action.type === EventType.Planning,
        )
      ) {
        listeners.push(
          vcsUiApp.moduleAdded.addEventListener((mod) => {
            config.actions
              ?.filter(
                (a) =>
                  (a.type === EventType.Module ||
                    a.type === EventType.Planning) &&
                  a.targetName === mod._id &&
                  a.onActivate?.length,
              )
              .forEach((action) => {
                executeCallbacks(vcsUiApp, action.onActivate!);
              });
          }),
          vcsUiApp.moduleRemoved.addEventListener((mod) => {
            config.actions
              ?.filter(
                (a) =>
                  (a.type === EventType.Module ||
                    a.type === EventType.Planning) &&
                  a.targetName === mod._id &&
                  a.onDeactivate?.length,
              )
              .forEach((action) => {
                executeCallbacks(vcsUiApp, action.onDeactivate!);
              });
          }),
        );
      }

      if (config.actions?.some((a) => a.type === EventType.Window)) {
        const activateWindowsActions = config.actions.filter(
          (a) => a.type === EventType.Window && a.onActivate?.length,
        );
        if (activateWindowsActions?.length) {
          listeners.push(
            vcsUiApp.windowManager.added.addEventListener((window) => {
              activateWindowsActions
                .filter((a) => a.targetName === window.id)
                ?.forEach((a) => {
                  executeCallbacks(vcsUiApp, a.onActivate!);
                });
            }),
          );
        }
        const deactivateWindowsActions = config.actions.filter(
          (a) => a.type === EventType.Window && a.onDeactivate?.length,
        );
        if (deactivateWindowsActions?.length) {
          listeners.push(
            vcsUiApp.windowManager.removed.addEventListener((window) => {
              deactivateWindowsActions
                .filter((a) => a.targetName === window.id)
                ?.forEach((a) => {
                  executeCallbacks(vcsUiApp, a.onDeactivate!);
                });
            }),
          );
        }
      }
    },
    getDefaultOptions(): EventControlConfig {
      return {};
    },
    toJSON(): EventControlConfig {
      return config;
    },
    getConfigEditors(): PluginConfigEditor<object>[] {
      return [];
    },
    destroy(): void {
      listeners.forEach((l) => {
        l?.();
      });
    },
  };
}
