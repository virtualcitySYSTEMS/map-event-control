import type { VcsCallbackOptions } from '@vcmap/ui';
import type { ItemSource } from './useAppItems.js';

/**
 * - `items`: a value (or list of values if multiple) chosen from an app source, free text is allowed
 * - `text`: free string
 * - `textList`: list of free strings (e.g. feature ids), without suggestions
 * - `number`: numeric value
 * - `toggleState`: tri-state for Toggle*ButtonCallbacks (toggle / activate / deactivate)
 * - `json`: an object edited as JSON (e.g. the highlight styles of HighlightObjectsCallback)
 */
type BaseFieldDefinition = {
  key: string;
  /** i18n key of the placeholder, defaults to `eventControl.editor.callbacks.placeholders.<key>` */
  placeholder?: string;
};

export type CallbackFieldDefinition = BaseFieldDefinition &
  (
    | {
        kind: 'items';
        source: ItemSource;
        multiple?: boolean;
        required?: boolean;
      }
    | { kind: 'text' | 'textList' | 'number' | 'json'; required?: boolean }
    | { kind: 'toggleState' }
  );

export type CallbackDefinition = {
  type: string;
  icon: string;
  fields: CallbackFieldDefinition[];
};

/** Pseudo type used for callbacks edited as JSON (unknown or plugin provided callbacks). */
export const customCallbackType = 'Custom';

export const callbackDefinitions: CallbackDefinition[] = [
  // layers
  {
    type: 'ActivateLayersCallback',
    icon: '$vcsLayers',
    fields: [
      {
        key: 'layerNames',
        kind: 'items',
        source: 'layers',
        multiple: true,
        required: true,
      },
    ],
  },
  {
    type: 'DeactivateLayersCallback',
    icon: '$vcsLayers',
    fields: [
      {
        key: 'layerNames',
        kind: 'items',
        source: 'layers',
        multiple: true,
        required: true,
      },
    ],
  },
  {
    type: 'ApplyLayerStyleCallback',
    icon: '$vcsColorSwatch',
    fields: [
      { key: 'layerName', kind: 'items', source: 'layers', required: true },
      { key: 'styleName', kind: 'items', source: 'styles', required: true },
    ],
  },
  // objects
  {
    type: 'HideObjectsCallback',
    icon: '$vcsHide',
    fields: [
      {
        key: 'layerName',
        kind: 'items',
        source: 'layers',
        placeholder: 'eventControl.editor.callbacks.placeholders.allLayers',
      },
      { key: 'objectIds', kind: 'textList', required: true },
    ],
  },
  {
    type: 'ShowObjectsCallback',
    icon: '$vcsEye',
    fields: [
      {
        key: 'layerName',
        kind: 'items',
        source: 'layers',
        placeholder: 'eventControl.editor.callbacks.placeholders.allLayers',
      },
      { key: 'objectIds', kind: 'textList', required: true },
    ],
  },
  {
    type: 'HighlightObjectsCallback',
    icon: 'mdi-marker',
    fields: [
      { key: 'layerName', kind: 'items', source: 'layers', required: true },
      { key: 'toHighlight', kind: 'json', required: true },
    ],
  },
  {
    type: 'UnHighlightObjectsCallback',
    icon: 'mdi-marker-cancel',
    fields: [
      { key: 'layerName', kind: 'items', source: 'layers', required: true },
      { key: 'toUnHighlight', kind: 'textList', required: true },
    ],
  },
  // maps
  {
    type: 'ActivateMapCallback',
    icon: '$vcsMap',
    fields: [{ key: 'mapName', kind: 'items', source: 'maps', required: true }],
  },
  {
    type: 'ActivateOverviewMapCallback',
    icon: 'mdi-map-search',
    fields: [],
  },
  {
    type: 'DeactivateOverviewMapCallback',
    icon: 'mdi-map-search-outline',
    fields: [],
  },
  // camera
  {
    type: 'GoToViewpointCallback',
    icon: '$vcsViewpoint',
    fields: [
      {
        key: 'viewpoint',
        kind: 'items',
        source: 'viewpoints',
        required: true,
      },
    ],
  },
  {
    type: 'StartRotationCallback',
    icon: '$vcsRotateRight',
    fields: [
      {
        key: 'viewpoint',
        kind: 'items',
        source: 'viewpoints',
        placeholder: 'eventControl.editor.callbacks.placeholders.currentView',
      },
      { key: 'timePerRotation', kind: 'number' },
    ],
  },
  { type: 'StopRotationCallback', icon: 'mdi-stop', fields: [] },
  {
    type: 'StartFlightCallback',
    icon: '$vcsViewpointFlight',
    fields: [
      { key: 'flight', kind: 'items', source: 'flights', required: true },
    ],
  },
  {
    type: 'StopFlightCallback',
    icon: 'mdi-stop-circle-outline',
    fields: [
      { key: 'flightName', kind: 'items', source: 'flights', required: true },
    ],
  },
  // buttons
  {
    type: 'ToggleNavbarButtonCallback',
    icon: 'mdi-gesture-tap-button',
    fields: [
      {
        key: 'buttonId',
        kind: 'items',
        source: 'navbarButtons',
        required: true,
      },
      { key: 'activeState', kind: 'toggleState' },
    ],
  },
  {
    type: 'ToggleToolbarButtonCallback',
    icon: '$vcsTools',
    fields: [
      {
        key: 'componentId',
        kind: 'items',
        source: 'toolbarButtons',
        required: true,
      },
      { key: 'groupButtonId', kind: 'text' },
      { key: 'toolName', kind: 'text' },
      { key: 'activeState', kind: 'toggleState' },
    ],
  },
  // modules
  {
    type: 'AddModuleCallback',
    icon: 'mdi-view-grid-plus',
    fields: [{ key: 'module', kind: 'text', required: true }],
  },
  {
    type: 'RemoveModuleCallback',
    icon: 'mdi-view-grid-outline',
    fields: [
      { key: 'moduleId', kind: 'items', source: 'modules', required: true },
    ],
  },
  // clipping polygons
  {
    type: 'ActivateClippingPolygonCallback',
    icon: '$vcsClipping',
    fields: [
      {
        key: 'names',
        kind: 'items',
        source: 'clippingPolygons',
        multiple: true,
        required: true,
      },
    ],
  },
  {
    type: 'DeactivateClippingPolygonCallback',
    icon: '$vcsClipping',
    fields: [
      {
        key: 'names',
        kind: 'items',
        source: 'clippingPolygons',
        multiple: true,
        required: true,
      },
    ],
  },
  // splash screen
  { type: 'OpenSplashScreenCallback', icon: 'mdi-information', fields: [] },
  {
    type: 'CloseSplashScreenCallback',
    icon: 'mdi-information-off',
    fields: [],
  },
];

export const customCallbackIcon = 'mdi-code-json';

export function getCallbackDefinition(
  type: string | undefined,
): CallbackDefinition | undefined {
  return callbackDefinitions.find((d) => d.type === type);
}

function isValidFieldValue(
  field: CallbackFieldDefinition,
  value: unknown,
): boolean {
  if (value === undefined) {
    return true;
  }
  switch (field.kind) {
    case 'items':
      return field.multiple
        ? Array.isArray(value) && value.every((v) => typeof v === 'string')
        : typeof value === 'string';
    case 'text':
      return typeof value === 'string';
    case 'textList':
      return Array.isArray(value) && value.every((v) => typeof v === 'string');
    case 'json':
      return (
        typeof value === 'object' && value !== null && !Array.isArray(value)
      );
    case 'number':
      return typeof value === 'number';
    case 'toggleState':
      return typeof value === 'boolean';
    default:
      return false;
  }
}

/**
 * Whether a callback can be edited with the form editor. Unknown types, additional keys or values the form
 * cannot represent (e.g. an inline module config for AddModuleCallback) fall back to the JSON editor.
 */
export function isFormEditable(callback: VcsCallbackOptions): boolean {
  const definition = getCallbackDefinition(callback.type);
  if (!definition) {
    return false;
  }
  const record = callback as Record<string, unknown>;
  return Object.keys(record).every((key) => {
    if (key === 'type') {
      return true;
    }
    const field = definition.fields.find((f) => f.key === key);
    return !!field && isValidFieldValue(field, record[key]);
  });
}

export function getFieldPlaceholder(field: CallbackFieldDefinition): string {
  return (
    field.placeholder ??
    `eventControl.editor.callbacks.placeholders.${field.key}`
  );
}

/** Whether the field holds a list, which is kept as empty array instead of being omitted. */
export function isListField(field: CallbackFieldDefinition): boolean {
  return (
    (field.kind === 'items' && !!field.multiple) || field.kind === 'textList'
  );
}

export function getDefaultCallback(type: string): VcsCallbackOptions {
  if (type === customCallbackType) {
    return { type: '' };
  }
  const definition = getCallbackDefinition(type);
  const callback: Record<string, unknown> = { type };
  definition?.fields.forEach((field) => {
    if (isListField(field)) {
      callback[field.key] = [];
    } else if (field.kind === 'json') {
      callback[field.key] = {};
    }
  });
  return callback as VcsCallbackOptions;
}

/**
 * Returns the title of a callback: an i18n key for known types, otherwise the type itself.
 */
export function getCallbackTitle(callback: VcsCallbackOptions): string {
  if (getCallbackDefinition(callback.type)) {
    return `eventControl.editor.callbacks.types.${callback.type}`;
  }
  return (
    callback.type || `eventControl.editor.callbacks.types.${customCallbackType}`
  );
}

type ToggleState = 'toggle' | 'activate' | 'deactivate';

/** Maps the select value of the ToggleNavbarButtonCallback state to its activeState option */
export const toggleStateValues: Record<string, boolean | undefined> = {
  toggle: undefined,
  activate: true,
  deactivate: false,
};

export const toggleStateItems: Array<{ value: ToggleState; title: string }> = [
  {
    value: 'toggle',
    title: 'eventControl.editor.callbacks.toggleState.toggle',
  },
  {
    value: 'activate',
    title: 'eventControl.editor.callbacks.toggleState.activate',
  },
  {
    value: 'deactivate',
    title: 'eventControl.editor.callbacks.toggleState.deactivate',
  },
];

export function getToggleState(activeState: unknown): ToggleState {
  if (activeState === true) {
    return 'activate';
  } else if (activeState === false) {
    return 'deactivate';
  }
  return 'toggle';
}
