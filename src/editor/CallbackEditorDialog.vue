<script setup lang="ts">
  import { computed, inject, ref } from 'vue';
  import { VContainer, VRow, VCol } from 'vuetify/components';
  import type { VcsAction, VcsCallbackOptions, VcsUiApp } from '@vcmap/ui';
  import {
    VcsChipArrayInput,
    VcsLabel,
    VcsSelect,
    VcsTextField,
  } from '@vcmap/ui';
  import type { CallbackFieldDefinition } from './callbackDefinitions.js';
  import {
    getCallbackDefinition,
    getCallbackTitle,
    isFormEditable,
    customCallbackIcon,
    toggleStateItems,
    getFieldPlaceholder,
    getToggleState,
    isListField,
    toggleStateValues,
  } from './callbackDefinitions.js';
  import { useCallbackItems } from './useCallbackItems.js';
  import ItemCombobox from './ItemCombobox.vue';
  import JsonTextArea from './JsonTextArea.vue';
  import EditorDialog from './EditorDialog.vue';

  const props = defineProps<{
    /** The callback to edit. The dialog works on a copy, which is emitted on submit. */
    callback: VcsCallbackOptions;
    mode: 'create' | 'edit';
  }>();

  const emit = defineEmits<{
    (e: 'submit', callback: VcsCallbackOptions): void;
    (e: 'cancel'): void;
  }>();

  const app = inject<VcsUiApp>('vcsApp')!;
  const { getItems } = useCallbackItems(app);

  const idPrefix = 'event-control-callback';

  // props may be reactive proxies, which cannot be cloned with structuredClone
  const localCallback = ref<VcsCallbackOptions>(
    JSON.parse(JSON.stringify(props.callback)) as VcsCallbackOptions,
  );

  const jsonMode = ref(!isFormEditable(localCallback.value));

  const definition = computed(() =>
    getCallbackDefinition(localCallback.value.type),
  );

  const heading = computed(() => {
    const title = getCallbackTitle(localCallback.value);
    if (jsonMode.value && definition.value) {
      return `${app.vueI18n.t(title)} (JSON)`;
    }
    return title;
  });

  function getValue(key: string): unknown {
    return (localCallback.value as Record<string, unknown>)[key];
  }

  function getStringValue(key: string): string | string[] | undefined {
    const value = getValue(key);
    if (typeof value === 'string' || Array.isArray(value)) {
      return value as string | string[];
    }
    return undefined;
  }

  function getListValue(key: string): string[] {
    const value = getValue(key);
    return Array.isArray(value) ? (value as string[]) : [];
  }

  function getObjectValue(key: string): Record<string, unknown> | undefined {
    const value = getValue(key);
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : undefined;
  }

  function getNumberValue(key: string): number | undefined {
    const value = getValue(key);
    return typeof value === 'number' ? value : undefined;
  }

  function setValue(field: CallbackFieldDefinition, value: unknown): void {
    const next: Record<string, unknown> = { ...localCallback.value };
    // list fields keep an empty array, all other fields are omitted when empty
    const keepEmptyArray = isListField(field);
    const isEmpty =
      value === undefined ||
      value === null ||
      value === '' ||
      (Array.isArray(value) && value.length === 0 && !keepEmptyArray);
    if (isEmpty) {
      delete next[field.key];
    } else {
      next[field.key] = value;
    }
    localCallback.value = next as VcsCallbackOptions;
  }

  /** allows entering comma separated lists (e.g. pasted ids), which are split into single entries */
  function setListValue(
    field: CallbackFieldDefinition,
    values: string[],
  ): void {
    setValue(
      field,
      values.flatMap((v) =>
        v
          .split(',')
          .map((part) => part.trim())
          .filter((part) => part.length > 0),
      ),
    );
  }

  function setNumber(field: CallbackFieldDefinition, value: string): void {
    const num = Number.parseFloat(value);
    setValue(field, Number.isNaN(num) ? undefined : num);
  }

  /** example shown in the help of the toHighlight field (not part of the i18n messages, since braces are reserved there) */
  const highlightExample = JSON.stringify(
    {
      featureId1: {
        fill: { color: [255, 0, 0, 0.5] },
        stroke: { color: '#ff0000', width: 2 },
      },
      featureId2: {
        fill: { color: 'rgba(0, 0, 255, 0.5)' },
      },
    },
    null,
    2,
  );

  const requiredRule = (v: unknown): boolean | string =>
    (Array.isArray(v) ? v.length > 0 : !!v) ||
    'eventControl.editor.validation.required';

  function jsonTypeRule(value: string): string | true {
    try {
      const parsed = JSON.parse(value) as Record<string, unknown> | null;
      if (typeof parsed?.type === 'string' && parsed.type) {
        return true;
      }
      return 'eventControl.editor.validation.typeRequired';
    } catch {
      return true; // json syntax errors are reported by the text area itself
    }
  }

  function jsonObjectRule(value: string): string | true {
    try {
      const parsed: unknown = JSON.parse(value);
      return typeof parsed === 'object' &&
        parsed !== null &&
        !Array.isArray(parsed)
        ? true
        : 'eventControl.editor.validation.objectRequired';
    } catch {
      return true; // json syntax errors are reported by the text area itself
    }
  }

  /** the JSON editor does not take part in form validation, so the type is checked here */
  const hasType = computed(
    () =>
      typeof localCallback.value?.type === 'string' &&
      !!localCallback.value.type,
  );

  /** chip array inputs do not take part in form validation, so required lists are checked here */
  const missingRequiredList = computed(
    () =>
      !jsonMode.value &&
      !!definition.value?.fields.some(
        (field) =>
          field.kind === 'textList' &&
          field.required &&
          getListValue(field.key).length === 0,
      ),
  );

  const headerActions = computed<VcsAction[]>(() => {
    if (!definition.value) {
      return [];
    }
    return [
      {
        name: 'eventControl.editor.callbacks.toggleJson',
        title: jsonMode.value
          ? 'eventControl.editor.callbacks.editAsForm'
          : 'eventControl.editor.callbacks.editAsJson',
        icon: jsonMode.value ? 'mdi-form-select' : customCallbackIcon,
        disabled: jsonMode.value && !isFormEditable(localCallback.value),
        callback(): void {
          jsonMode.value = !jsonMode.value;
        },
      },
    ];
  });

  function submit(): void {
    emit(
      'submit',
      JSON.parse(JSON.stringify(localCallback.value)) as VcsCallbackOptions,
    );
  }
</script>

<template>
  <EditorDialog
    :heading="heading"
    :icon="definition?.icon ?? customCallbackIcon"
    :mode="mode"
    :header-actions="headerActions"
    :submit-disabled="!hasType || missingRequiredList"
    width="450"
    @submit="submit"
    @cancel="emit('cancel')"
  >
    <JsonTextArea
      v-if="jsonMode || !definition"
      v-model="localCallback"
      :rules="[jsonTypeRule]"
      placeholder='{ "type": "MyCallback" }'
    />
    <v-container v-else-if="definition.fields.length" class="px-1 py-0">
      <v-row
        v-for="field in definition.fields"
        :key="field.key"
        no-gutters
        class="align-center"
      >
        <v-col :cols="field.kind === 'json' ? 12 : 5">
          <VcsLabel
            :html-for="`${idPrefix}-${field.key}`"
            :required="'required' in field && field.required"
            :help-text="
              field.kind === 'textList'
                ? 'eventControl.editor.callbacks.help.idList'
                : undefined
            "
          >
            {{ $st(`eventControl.editor.callbacks.fields.${field.key}`) }}
            <template v-if="field.key === 'toHighlight'" #help>
              <span>{{
                $st('eventControl.editor.callbacks.help.toHighlight')
              }}</span>
              <pre class="text-caption mt-1">{{ highlightExample }}</pre>
            </template>
          </VcsLabel>
        </v-col>
        <v-col v-if="field.kind === 'json'" cols="12">
          <JsonTextArea
            :model-value="getObjectValue(field.key)"
            :placeholder="$st(getFieldPlaceholder(field))"
            :rules="[jsonObjectRule]"
            class="pa-0"
            @update:model-value="(v) => setValue(field, v)"
          />
        </v-col>
        <v-col v-else cols="7">
          <ItemCombobox
            v-if="field.kind === 'items'"
            :id="`${idPrefix}-${field.key}`"
            :model-value="getStringValue(field.key)"
            :items="getItems(field.source)"
            :placeholder="$st(getFieldPlaceholder(field))"
            :multiple="field.multiple"
            :rules="field.required ? [requiredRule] : []"
            @update:model-value="(v) => setValue(field, v)"
          />
          <VcsChipArrayInput
            v-else-if="field.kind === 'textList'"
            :model-value="getListValue(field.key)"
            @update:model-value="(v: string[]) => setListValue(field, v)"
          />
          <VcsTextField
            v-else-if="field.kind === 'text'"
            :id="`${idPrefix}-${field.key}`"
            :model-value="getStringValue(field.key)"
            :rules="field.required ? [requiredRule] : []"
            :placeholder="$st(getFieldPlaceholder(field))"
            @update:model-value="(v: string) => setValue(field, v)"
          />
          <VcsTextField
            v-else-if="field.kind === 'number'"
            :id="`${idPrefix}-${field.key}`"
            type="number"
            :model-value="getNumberValue(field.key)"
            :placeholder="$st(getFieldPlaceholder(field))"
            :rules="field.required ? [requiredRule] : []"
            @update:model-value="(v: string) => setNumber(field, v)"
          />
          <VcsSelect
            v-else-if="field.kind === 'toggleState'"
            :id="`${idPrefix}-${field.key}`"
            :model-value="getToggleState(getValue(field.key))"
            :items="toggleStateItems"
            :placeholder="$st(getFieldPlaceholder(field))"
            @update:model-value="
              (v: string) => setValue(field, toggleStateValues[v])
            "
          />
        </v-col>
      </v-row>
    </v-container>
    <div v-else class="px-2 pb-2 text-caption">
      {{ $st('eventControl.editor.callbacks.noOptions') }}
    </div>
  </EditorDialog>
</template>
