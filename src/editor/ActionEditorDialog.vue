<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { VCol, VContainer, VRow } from 'vuetify/components';
  import type { VcsCallbackOptions } from '@vcmap/ui';
  import { VcsFormSection, VcsLabel } from '@vcmap/ui';
  import type { Action } from '../types.js';
  import { eventTypeIcons } from '../types.js';
  import type { SelectItem } from './useAppItems.js';
  import ItemCombobox from './ItemCombobox.vue';
  import CallbackListEditor from './CallbackListEditor.vue';
  import EditorDialog from './EditorDialog.vue';

  const props = defineProps<{
    /**
     * The action to edit. The dialog works on a copy, which is emitted on submit.
     * The event type is fixed: it is chosen when creating the action and cannot be changed afterwards.
     */
    action: Action;
    mode: 'create' | 'edit';
    /** suggestions for the target of the action's event type */
    targetItems: SelectItem[];
  }>();

  const emit = defineEmits<{
    (e: 'submit', action: Action): void;
    (e: 'cancel'): void;
  }>();

  // props may be reactive proxies, which cannot be cloned with structuredClone
  const localAction = ref<Action>(
    JSON.parse(JSON.stringify(props.action)) as Action,
  );

  const onActivate = computed<VcsCallbackOptions[]>({
    get: () => localAction.value.onActivate ?? [],
    set: (value) => {
      localAction.value.onActivate = value;
    },
  });

  const onDeactivate = computed<VcsCallbackOptions[]>({
    get: () => localAction.value.onDeactivate ?? [],
    set: (value) => {
      localAction.value.onDeactivate = value;
    },
  });

  function submit(): void {
    const action: Action = {
      type: localAction.value.type,
      targetName: localAction.value.targetName,
    };
    if (onActivate.value.length) {
      action.onActivate = onActivate.value;
    }
    if (onDeactivate.value.length) {
      action.onDeactivate = onDeactivate.value;
    }
    emit('submit', JSON.parse(JSON.stringify(action)) as Action);
  }

  const requiredRule = (v: string): boolean | string =>
    !!v || 'eventControl.editor.validation.required';
</script>

<template>
  <EditorDialog
    :heading="`eventControl.editor.actionHeadings.${localAction.type}`"
    :icon="eventTypeIcons[localAction.type]"
    :mode="mode"
    @submit="submit"
    @cancel="emit('cancel')"
  >
    <v-container class="px-1 py-0">
      <v-row no-gutters class="align-center">
        <v-col cols="5">
          <VcsLabel
            html-for="event-control-action-target"
            required
            :help-text="`eventControl.editor.target.help.${localAction.type}`"
          >
            {{ $st(`eventControl.editor.target.${localAction.type}`) }}
          </VcsLabel>
        </v-col>
        <v-col cols="7">
          <ItemCombobox
            id="event-control-action-target"
            v-model="localAction.targetName"
            :items="targetItems"
            :rules="[requiredRule]"
            :placeholder="
              $st(`eventControl.editor.target.placeholder.${localAction.type}`)
            "
          />
        </v-col>
      </v-row>
    </v-container>
    <template #sections>
      <VcsFormSection
        :heading="`eventControl.editor.onActivate.${localAction.type}`"
        :help-text="'eventControl.editor.onActivate.help'"
        expandable
        start-open
      >
        <CallbackListEditor
          v-model="onActivate"
          id-prefix="event-control-on-activate"
        />
      </VcsFormSection>
      <VcsFormSection
        :heading="`eventControl.editor.onDeactivate.${localAction.type}`"
        :help-text="'eventControl.editor.onDeactivate.help'"
        expandable
        start-open
      >
        <CallbackListEditor
          v-model="onDeactivate"
          id-prefix="event-control-on-deactivate"
        />
      </VcsFormSection>
    </template>
  </EditorDialog>
</template>
