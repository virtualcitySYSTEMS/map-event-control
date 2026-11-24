<script setup lang="ts">
  import { computed, inject, ref } from 'vue';
  import { VIcon, VMenu } from 'vuetify/components';
  import type { VcsAction, VcsUiApp } from '@vcmap/ui';
  import {
    AbstractConfigEditor,
    VcsActionButtonList,
    VcsActionList,
    VcsButton,
    VcsDataTable,
    VcsFormSection,
  } from '@vcmap/ui';
  import type { Action, EventControlConfig } from './types.js';
  import { EventType, eventTypeIcons } from './types.js';
  import type { ItemSource } from './editor/useAppItems.js';
  import { useAppItems } from './editor/useAppItems.js';
  import ActionEditorDialog from './editor/ActionEditorDialog.vue';

  const props = defineProps<{
    getConfig: () => EventControlConfig;
    setConfig: (config: EventControlConfig) => void;
  }>();

  const app = inject<VcsUiApp>('vcsApp')!;

  const config = props.getConfig();
  const actions = ref<Action[]>(
    JSON.parse(JSON.stringify(config.actions ?? [])) as Action[],
  );

  /** Index of the action being edited, or -1 for a new action. */
  const editIndex = ref<number | undefined>();
  const editAction = ref<Action | undefined>();

  function openEditor(index: number, action: Action): void {
    editIndex.value = index;
    editAction.value = action;
  }

  function closeEditor(): void {
    editIndex.value = undefined;
    editAction.value = undefined;
  }

  function submitAction(action: Action): void {
    if (editIndex.value === -1) {
      actions.value.push(action);
    } else if (editIndex.value !== undefined) {
      actions.value[editIndex.value] = action;
    }
    closeEditor();
  }

  const targetSources: Record<EventType, ItemSource> = {
    [EventType.Layer]: 'layers',
    [EventType.Map]: 'maps',
    [EventType.Module]: 'modules',
    [EventType.Planning]: 'plannings',
    [EventType.Window]: 'windows',
  };
  const targetItems = Object.fromEntries(
    Object.entries(targetSources).map(([type, source]) => [
      type,
      useAppItems(app, source),
    ]),
  ) as Record<EventType, ReturnType<typeof useAppItems>>;

  function getTargetTitle(action: Action): string {
    const item = targetItems[action.type]?.value.find(
      (i) => i.value === action.targetName,
    );
    return item ? app.vueI18n.t(item.title) : action.targetName;
  }

  const tableItems = computed(() =>
    actions.value.map((action, index) => ({
      key: index,
      type: app.vueI18n.t(`eventControl.editor.eventTypes.${action.type}`),
      eventType: action.type,
      target: getTargetTitle(action),
      onActivate: action.onActivate?.length ?? 0,
      onDeactivate: action.onDeactivate?.length ?? 0,
      actions: [
        {
          name: 'eventControl.editor.removeAction',
          title: 'eventControl.editor.removeAction',
          icon: '$vcsTrashCan',
          callback(): void {
            actions.value.splice(index, 1);
          },
        },
        {
          name: 'eventControl.editor.editAction',
          title: 'eventControl.editor.editAction',
          icon: '$vcsEdit',
          callback(): void {
            openEditor(index, action);
          },
        },
      ] as VcsAction[],
    })),
  );

  const headers = [
    { title: 'eventControl.editor.eventType', value: 'type', sortable: true },
    {
      title: 'eventControl.editor.targetName',
      value: 'target',
      sortable: true,
      // max-width 0 + width 100% lets the column take the remaining space and
      // truncate long names instead of pushing the action buttons out of view
      cellProps: { class: 'target-cell' },
    },
    {
      title: 'eventControl.editor.onActivateCount',
      value: 'onActivate',
      sortable: true,
      align: 'center',
    },
    {
      title: 'eventControl.editor.onDeactivateCount',
      value: 'onDeactivate',
      sortable: true,
      align: 'center',
    },
    {
      title: '',
      key: 'actions',
      sortable: false,
      align: 'end',
      cellProps: { class: 'text-no-wrap' },
    },
  ];

  const createActions: VcsAction[] = Object.values(EventType).map((type) => ({
    name: `eventControl.editor.eventTypes.${type}`,
    icon: eventTypeIcons[type],
    callback(): void {
      openEditor(-1, { type, targetName: '' });
    },
  }));

  function submit(): void {
    props.setConfig({
      ...config,
      actions: JSON.parse(JSON.stringify(actions.value)) as Action[],
    });
  }
</script>

<template>
  <AbstractConfigEditor v-bind="{ ...$attrs, ...$props }" @submit="submit">
    <VcsFormSection heading="eventControl.editor.actions">
      <VcsDataTable
        :items="tableItems"
        :headers="headers"
        item-value="key"
        :items-per-page="10"
        :show-searchbar="tableItems.length > 10"
      >
        <template #item.type="{ item }">
          <div class="d-flex align-center text-no-wrap">
            <VIcon size="small" class="mr-1">
              {{ eventTypeIcons[item.eventType as EventType] }}
            </VIcon>
            <span>{{ item.type }}</span>
          </div>
        </template>
        <template #item.target="{ item }">
          <div class="text-truncate" :title="item.target">
            {{ item.target }}
          </div>
        </template>
        <template #item.actions="{ item }">
          <VcsActionButtonList :actions="item.actions" right />
        </template>
      </VcsDataTable>
      <div class="d-flex justify-center py-3">
        <VMenu>
          <template #activator="{ props: menuProps }">
            <VcsButton
              v-bind="menuProps"
              icon="$vcsPlus"
              tooltip="eventControl.editor.createAction"
            />
          </template>
          <VcsActionList :actions="createActions" show-icon />
        </VMenu>
      </div>
    </VcsFormSection>
    <ActionEditorDialog
      v-if="editAction"
      :action="editAction"
      :mode="editIndex === -1 ? 'create' : 'edit'"
      :target-items="targetItems[editAction.type]?.value ?? []"
      @submit="submitAction"
      @cancel="closeEditor"
    />
  </AbstractConfigEditor>
</template>

<style scoped>
  :deep(.target-cell) {
    max-width: 0;
    width: 100%;
  }
</style>
