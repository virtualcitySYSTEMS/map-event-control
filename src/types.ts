import type { VcsCallbackOptions } from '@vcmap/ui';

export enum EventType {
  Layer = 'layer',
  Map = 'map',
  Module = 'module',
  Planning = 'planning',
  Window = 'window',
}

export type Action = {
  type: EventType;
  targetName: string;
  onActivate?: Array<VcsCallbackOptions>;
  onDeactivate?: Array<VcsCallbackOptions>;
};

export type EventControlConfig = { actions?: Array<Action> };

export const eventTypeIcons: Record<EventType, string> = {
  [EventType.Layer]: '$vcsLayers',
  [EventType.Map]: '$vcsMap',
  [EventType.Module]: 'mdi-view-module',
  [EventType.Planning]: 'mdi-floor-plan',
  [EventType.Window]: 'mdi-window-maximize',
};
