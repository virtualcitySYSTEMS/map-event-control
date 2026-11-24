<script setup lang="ts">
  import { computed, inject, ref } from 'vue';
  import { VListItemSubtitle, VMenu } from 'vuetify/components';
  import type {
    VcsAction,
    VcsCallbackOptions,
    VcsListItem,
    VcsUiApp,
  } from '@vcmap/ui';
  import { VcsActionList, VcsButton, VcsList } from '@vcmap/ui';
  import {
    callbackDefinitions,
    customCallbackIcon,
    customCallbackType,
    getCallbackDefinition,
    getCallbackTitle,
    getDefaultCallback,
    getToggleState,
    isFormEditable,
    toggleStateItems,
  } from './callbackDefinitions.js';
  import { useCallbackItems } from './useCallbackItems.js';
  import CallbackEditorDialog from './CallbackEditorDialog.vue';

  const props = defineProps<{
    /** unique prefix for list item names */
    idPrefix: string;
  }>();

  const callbacks = defineModel<VcsCallbackOptions[]>({ required: true });

  const app = inject<VcsUiApp>('vcsApp')!;
  const { getItemTitle } = useCallbackItems(app);

  /** Index of the callback being edited, or -1 for a new callback. */
  const editIndex = ref<number | undefined>();
  const editCallback = ref<VcsCallbackOptions | undefined>();

  function openEditor(index: number, callback: VcsCallbackOptions): void {
    editIndex.value = index;
    editCallback.value = callback;
  }

  function closeEditor(): void {
    editIndex.value = undefined;
    editCallback.value = undefined;
  }

  function submitCallback(callback: VcsCallbackOptions): void {
    if (editIndex.value === -1) {
      callbacks.value = [...callbacks.value, callback];
    } else if (editIndex.value !== undefined) {
      const next = [...callbacks.value];
      next[editIndex.value] = callback;
      callbacks.value = next;
    }
    closeEditor();
  }

  function removeCallback(index: number): void {
    callbacks.value = callbacks.value.filter((_, i) => i !== index);
  }

  /**
   * Short, human readable description of the callback's options, e.g. the titles of the selected layers.
   */
  function getSummary(callback: VcsCallbackOptions): string {
    const record = callback as Record<string, unknown>;
    const definition = getCallbackDefinition(callback.type);
    if (!definition || !isFormEditable(callback)) {
      const options = { ...record };
      delete options.type;
      const json = JSON.stringify(options);
      return json === '{}' ? '' : json;
    }
    return definition.fields
      .map((field) => {
        const value = record[field.key];
        if (field.kind === 'items') {
          const values = Array.isArray(value) ? value : [value];
          return values
            .filter((v): v is string => typeof v === 'string' && !!v)
            .map((v) => app.vueI18n.t(getItemTitle(field.source, v)))
            .join(', ');
        } else if (field.kind === 'textList') {
          return Array.isArray(value) ? value.join(', ') : '';
        } else if (field.kind === 'json') {
          // e.g. the ids of the objects to highlight
          return value && typeof value === 'object'
            ? Object.keys(value).join(', ')
            : '';
        } else if (field.kind === 'toggleState') {
          const state = getToggleState(value);
          const item = toggleStateItems.find((i) => i.value === state)!;
          return app.vueI18n.t(item.title);
        }
        return typeof value === 'string' || typeof value === 'number'
          ? String(value)
          : '';
      })
      .filter(Boolean)
      .join(' · ');
  }

  type CallbackListItem = VcsListItem & { summary: string };

  const listItems = computed<CallbackListItem[]>(() =>
    callbacks.value.map((callback, index) => {
      const summary = getSummary(callback);
      return {
        name: `${props.idPrefix}-${index}`,
        title: getCallbackTitle(callback),
        icon: getCallbackDefinition(callback.type)?.icon ?? customCallbackIcon,
        tooltip: summary || undefined,
        summary,
        actions: [
          {
            name: 'eventControl.editor.callbacks.edit',
            title: 'eventControl.editor.callbacks.edit',
            icon: '$vcsEdit',
            callback(): void {
              openEditor(index, callback);
            },
          },
          {
            name: 'eventControl.editor.callbacks.remove',
            title: 'eventControl.editor.callbacks.remove',
            icon: '$vcsTrashCan',
            callback(): void {
              removeCallback(index);
            },
          },
        ],
      };
    }),
  );

  function moveCallback({
    item,
    targetItem,
    position,
  }: {
    item: VcsListItem;
    targetItem: VcsListItem;
    /** InsertMode of @vcmap/ui: -1 before, 1 after the target item */
    position?: number;
  }): void {
    const from = listItems.value.findIndex((i) => i.name === item.name);
    const to = listItems.value.findIndex((i) => i.name === targetItem.name);
    if (from < 0 || to < 0 || from === to) {
      return;
    }
    const next = [...callbacks.value];
    const [moved] = next.splice(from, 1);
    // removing the item shifts the target index, if the item was before the target
    const targetIndex = from < to ? to - 1 : to;
    next.splice(targetIndex + (position === 1 ? 1 : 0), 0, moved);
    callbacks.value = next;
  }

  function addCallback(type: string): void {
    const callback = getDefaultCallback(type);
    if (getCallbackDefinition(type)?.fields.length === 0) {
      // nothing to configure, e.g. StopRotationCallback
      callbacks.value = [...callbacks.value, callback];
    } else {
      openEditor(-1, callback);
    }
  }

  const addActions: VcsAction[] = [
    ...callbackDefinitions.map((definition) => ({
      name: `eventControl.editor.callbacks.types.${definition.type}`,
      icon: definition.icon,
      callback(): void {
        addCallback(definition.type);
      },
    })),
    {
      name: `eventControl.editor.callbacks.types.${customCallbackType}`,
      icon: customCallbackIcon,
      callback(): void {
        addCallback(customCallbackType);
      },
    },
  ];
</script>

<template>
  <div>
    <VcsList
      v-if="listItems.length"
      :items="listItems"
      :show-title="false"
      draggable
      @item-moved="moveCallback"
    >
      <template #item.subtitle="{ item }">
        <v-list-item-subtitle v-if="(item as CallbackListItem).summary">
          {{ (item as CallbackListItem).summary }}
        </v-list-item-subtitle>
      </template>
    </VcsList>
    <div v-else class="px-2 pt-2 text-caption">
      {{ $st('eventControl.editor.callbacks.empty') }}
    </div>
    <div class="d-flex justify-center py-2">
      <VMenu>
        <template #activator="{ props: menuProps }">
          <VcsButton
            v-bind="menuProps"
            icon="$vcsPlus"
            tooltip="eventControl.editor.callbacks.add"
          />
        </template>
        <VcsActionList :actions="addActions" show-icon />
      </VMenu>
    </div>
    <CallbackEditorDialog
      v-if="editCallback"
      :callback="editCallback"
      :mode="editIndex === -1 ? 'create' : 'edit'"
      @submit="submitCallback"
      @cancel="closeEditor"
    />
  </div>
</template>
