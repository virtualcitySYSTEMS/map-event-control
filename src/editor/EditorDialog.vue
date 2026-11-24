<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { VCard, VDialog, VDivider, VForm, VIcon } from 'vuetify/components';
  import type { VcsAction } from '@vcmap/ui';
  import { VcsActionButtonList, VcsFormButton } from '@vcmap/ui';

  /**
   * Persistent dialog with a validated form and add/apply + cancel buttons.
   */
  const props = withDefaults(
    defineProps<{
      heading: string;
      mode: 'create' | 'edit';
      icon?: string;
      headerActions?: VcsAction[];
      width?: number | string;
      /** additional validation which is not covered by the form rules */
      submitDisabled?: boolean;
    }>(),
    {
      icon: undefined,
      headerActions: () => [],
      width: 500,
      submitDisabled: false,
    },
  );

  const emit = defineEmits<(e: 'submit' | 'cancel') => void>();

  const isValid = ref(true);

  const actions = computed<VcsAction[]>(() => [
    ...props.headerActions,
    {
      name: 'close',
      icon: 'mdi-close-thick',
      title: 'components.close',
      callback(): void {
        emit('cancel');
      },
    },
  ]);

  function submit(): void {
    if (isValid.value && !props.submitDisabled) {
      emit('submit');
    }
  }
</script>

<template>
  <v-dialog
    :model-value="true"
    :width="width"
    persistent
    @update:model-value="emit('cancel')"
  >
    <v-card class="d-flex flex-column event-control-editor-dialog">
      <v-form
        v-model="isValid"
        class="d-flex flex-column overflow-hidden"
        @submit.prevent="submit"
      >
        <!-- header markup follows StoryEditorDialog of @vcmap/slides -->
        <div class="pa-2 d-flex justify-space-between">
          <h3 class="d-flex align-center text-primary">
            <v-icon v-if="icon" class="mr-1 text-primary">{{ icon }}</v-icon>
            <span class="font-weight-bold">{{ $st(heading) }}</span>
          </h3>
          <VcsActionButtonList :actions="actions" />
        </div>
        <v-divider />
        <div class="overflow-y-auto flex-grow-1">
          <div class="py-1">
            <slot />
          </div>
          <slot name="sections" />
        </div>
        <v-divider />
        <div class="d-flex justify-end gc-2 pa-2">
          <VcsFormButton
            variant="filled"
            type="submit"
            :disabled="!isValid || submitDisabled"
          >
            {{
              $st(
                mode === 'create'
                  ? 'eventControl.editor.add'
                  : 'eventControl.editor.apply',
              )
            }}
          </VcsFormButton>
          <VcsFormButton @click="emit('cancel')">
            {{ $st('eventControl.editor.cancel') }}
          </VcsFormButton>
        </div>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<style scoped>
  .event-control-editor-dialog {
    max-height: 85vh;
  }
</style>
