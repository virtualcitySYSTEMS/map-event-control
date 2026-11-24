<script setup lang="ts">
  import { computed, ref, useAttrs } from 'vue';
  import { VCombobox, VListItem, VTooltip } from 'vuetify/components';
  import { VcsCheckbox } from '@vcmap/ui';
  import type { SelectItem } from './useAppItems.js';

  /**
   * A combobox styled like VcsSelect. Suggests the given items, but also allows free text
   * (e.g. for targets which are not available in the app yet).
   * Like VcsSelect, it keeps a single line height: multiple values are rendered as "first (+n)"
   * and validation errors are shown as tooltip instead of a message below the field.
   */
  const props = withDefaults(
    defineProps<{
      items: SelectItem[];
      multiple?: boolean;
      tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
    }>(),
    { multiple: false, tooltipPosition: 'right' },
  );

  const model = defineModel<string | string[] | undefined>();

  /**
   * VCombobox wraps an empty string into [''], which counts as a selection and hides the placeholder.
   * Empty strings are therefore passed on as undefined.
   */
  const innerModel = computed({
    get: () => (model.value === '' ? undefined : model.value),
    set: (value) => {
      model.value = value;
    },
  });

  const attrs = useAttrs();
  const fieldRef = ref();

  /** same as the (not exported) usePadding of @vcmap/ui */
  const paddingProvided = computed(() =>
    typeof attrs.class === 'string'
      ? attrs.class.split(' ').some((c) => /^p[tblrsexyac]-.*/.test(c))
      : false,
  );

  const additionalItems = computed(() =>
    Array.isArray(model.value) ? model.value.length - 1 : 0,
  );

  /** free text entries are plain strings, suggestions are select items */
  function getTitle(item: SelectItem | string | undefined): string {
    if (typeof item === 'string') {
      return item;
    }
    return item?.title ?? '';
  }

  // the list items expose the raw value as title, if the value is not part of the items
  function getSelectionTitle(raw: unknown): string {
    if (typeof raw === 'string') {
      return props.items.find((i) => i.value === raw)?.title ?? raw;
    }
    return getTitle(raw as SelectItem);
  }
</script>

<template>
  <v-combobox
    ref="fieldRef"
    v-model="innerModel"
    :items="items"
    :multiple="multiple"
    :return-object="false"
    :item-title="(item: SelectItem | string) => $st(getTitle(item))"
    item-value="value"
    menu-icon="mdi-chevron-down"
    variant="outlined"
    density="compact"
    color="primary"
    class="primary--placeholder vcs-combobox"
    :class="{ 'py-1': !paddingProvided }"
    v-bind="$attrs"
  >
    <template v-if="multiple" #selection="{ item, index }">
      <span v-if="index === 0" class="text-truncate">
        {{ $st(getSelectionTitle(item.raw)) }}
      </span>
      <span v-if="index === 1" class="text-no-wrap ml-1">
        (+{{ additionalItems }})
      </span>
    </template>
    <template v-if="multiple" #item="{ props: itemProps, item }">
      <v-list-item density="compact" v-bind="itemProps" role="option">
        <template #prepend="{ isSelected }">
          <VcsCheckbox
            :model-value="isSelected"
            class="py-0 pr-1"
            :aria-label="getTitle(item.raw)"
          />
        </template>
      </v-list-item>
    </template>
    <template #message="scope">
      <v-tooltip
        v-if="scope?.message"
        :activator="fieldRef"
        :text="$st(scope.message)"
        content-class="bg-error"
        :location="tooltipPosition"
      />
    </template>
  </v-combobox>
</template>

<style lang="scss" scoped>
  :deep(.v-field) {
    --v-field-padding-start: 4px;
    --v-field-padding-end: 4px;
  }
  :deep(.v-field__input) {
    flex-wrap: unset;
    padding-right: calc(var(--v-vcs-font-size) * 2 + 2px);
    > input {
      align-self: auto !important;
    }
  }
  .v-input--density-compact :deep(.v-field) {
    --v-input-control-height: calc(var(--v-vcs-font-size) * 2 - 2px);
    --v-field-padding-bottom: 0px;
    --v-field-input-padding-top: 0px;
    --v-input-padding-top: 0px;
  }
  :deep(.v-field--focused .v-field__outline *) {
    --v-field-border-width: 1px;
  }
  // set the border color on focused to primary, but not on error
  :deep(.v-field--focused:not(.v-field--error) .v-field__outline *) {
    border-color: rgb(var(--v-theme-primary));
  }
  // Not color, just used if label is given
  :deep(.v-field--focused:not(.v-field--error) .v-field__outline *::after) {
    border-color: rgb(var(--v-theme-primary));
  }
  // remove outline, if not focused, hovered or an error
  :deep(.v-field:not(.v-field--focused):not(.v-field--error):not(:hover)) {
    .v-field__outline * {
      border-width: 0 0 1px 0;
      border-radius: 0;
    }
    .v-field__outline {
      padding-left: 4px;
      padding-right: 4px;
    }
    .v-field__loader {
      padding-left: 3px;
      padding-right: 3px;
    }
    .v-field__outline *::before {
      border-width: 0;
      border-radius: 0;
    }
    .v-field__outline * label {
      color: rgb(var(--v-theme-primary));
      margin-left: -4px;
    }
  }
  :deep(.v-field--appended) {
    padding-inline-end: 4px;
    .v-field__append-inner {
      i {
        margin-left: 0;
      }
    }
  }
  .primary--placeholder {
    :deep(input::placeholder) {
      color: rgb(var(--v-theme-primary));
      opacity: 1;
      font-style: italic !important;
      padding: 0 3px 0 0;
    }
  }
  // details are not shown, errors are rendered as tooltip (like VcsSelect)
  :deep(.v-input__details) {
    display: none;
  }
</style>
