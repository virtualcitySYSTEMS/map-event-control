<!-- THIS WHOLE FILE IS COPY PASTE from @vcmap/app-configurator -->
<script setup lang="ts" generic="T extends object">
  import type { PropType } from 'vue';
  import { computed, onMounted, ref, toRaw, watch } from 'vue';
  import {
    VAlert,
    VBtn,
    VContainer,
    VIcon,
    VTextarea,
  } from 'vuetify/components';

  function isValidJson(value: string): string | true {
    try {
      const obj = JSON.parse(value);
      if (obj) {
        return true;
      }
      return 'eventControl.editor.jsonEditor.invalid';
    } catch (e) {
      return (e as Error).toLocaleString();
    }
  }

  const props = defineProps({
    rules: {
      type: Array as PropType<((value: string) => string | true)[]>,
      default: () => [],
    },
    placeholder: {
      type: String,
      default: '',
    },
  });

  const model = defineModel<T>();

  const localConfig = ref(
    model.value ? JSON.stringify(model.value, null, 2) : '',
  );
  const errorMessages = ref<string[]>([]);
  const undoStack = ref<string[]>([]);
  const redoStack = ref<string[]>([]);
  const lineNumbers = ref('1');
  const hiddenElementRef = ref<HTMLElement>();
  const textAreaRef = ref<InstanceType<typeof VTextarea>>();

  const hasError = computed(() => errorMessages.value.length > 0);

  // manual rule validation to have access to errorMessages
  function validateRules(value: string): void {
    errorMessages.value = [isValidJson, ...props.rules]
      .map((f: (value: string) => string | true) => f(value))
      .filter(
        (r, idx, self) => r !== true && self.indexOf(r) === idx,
      ) as string[];
  }

  function updateLineNumbers(): void {
    const lines = localConfig.value?.split('\n');
    const textAreaWidth =
      (textAreaRef.value!.$el as HTMLElement).offsetWidth - 43; // padding
    lineNumbers.value = lines
      ?.map((line, i) => {
        hiddenElementRef.value!.textContent = line;
        if (hiddenElementRef.value!.offsetWidth > textAreaWidth) {
          // add extra lines for line break
          const emptyLines = Math.round(
            hiddenElementRef.value!.offsetWidth / textAreaWidth,
          );
          return [i + 1, ...Array(emptyLines).fill('')] as string[];
        }
        return i + 1;
      })
      .flat()
      .join('\n');
  }

  function formatJson(): void {
    try {
      const parsed = JSON.parse(localConfig.value);
      localConfig.value = JSON.stringify(parsed, null, 2);
    } catch (e) {
      // invalid json
    }
  }

  function sortJson(): void {
    try {
      const parsed = JSON.parse(localConfig.value);
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        const sorted = Object.keys(parsed)
          .sort()
          .reduce<Record<string, unknown>>((acc, key) => {
            acc[key] = parsed[key];
            return acc;
          }, {});
        localConfig.value = JSON.stringify(sorted, null, 2);
      }
    } catch (e) {
      // invalid json
    }
  }

  function beforeInput(): void {
    undoStack.value.push(localConfig.value);
  }

  function undo(): void {
    if (undoStack.value.length) {
      redoStack.value.push(localConfig.value);
      localConfig.value = undoStack.value.pop()!;
    }
  }

  function redo(): void {
    if (redoStack.value.length) {
      undoStack.value.push(localConfig.value);
      localConfig.value = redoStack.value.pop()!;
    }
  }
  onMounted(() => {
    updateLineNumbers();
  });

  watch(
    model,
    (value) => {
      try {
        const json = localConfig.value ? JSON.parse(localConfig.value) : {};
        if (JSON.stringify(json) !== JSON.stringify(value)) {
          localConfig.value = JSON.stringify(toRaw(value), null, 2);
        }
      } catch (err) {
        // invalid json
      }
    },
    { deep: true },
  );

  watch(localConfig, (value, oldValue) => {
    if (value !== oldValue) {
      try {
        validateRules(value);
        updateLineNumbers();
        const json = JSON.parse(value);
        if (json) {
          if (JSON.stringify(json) !== JSON.stringify(model.value)) {
            model.value = toRaw(json);
          }
        }
      } catch (err) {
        // invalid json
      }
    }
  });
</script>
<template>
  <v-container class="vcs-json-text-area">
    <div class="btn-row">
      <div class="v-btn-group v-btn-group--border">
        <v-btn @click="formatJson">{{
          $st('eventControl.editor.jsonEditor.format')
        }}</v-btn>
        <v-btn @click="sortJson">{{
          $st('eventControl.editor.jsonEditor.sort')
        }}</v-btn>
        <v-btn :disabled="undoStack.length === 0" @click="undo">
          <v-icon icon="mdi-undo" />
        </v-btn>
        <v-btn :disabled="redoStack.length === 0" @click="redo">
          <v-icon icon="mdi-redo" />
        </v-btn>
      </div>
    </div>

    <div class="textarea-container">
      <div class="line-numbers">
        <pre>{{ lineNumbers }}</pre>
      </div>
      <v-textarea
        ref="textAreaRef"
        v-model="localConfig"
        density="compact"
        rounded="0"
        auto-grow
        flat
        :placeholder="placeholder"
        :error="hasError"
        hide-details
        @keydown.enter.stop
        @beforeinput="beforeInput"
      >
      </v-textarea>
    </div>

    <!-- to make this sticky,  message slot cannot be used! -->
    <div class="alert-fixed">
      <v-alert
        v-for="(error, idx) in errorMessages"
        :key="`error-${idx}`"
        type="error"
        variant="tonal"
        class="mx-1 my-2"
        >{{ $st(error) }}
      </v-alert>
    </div>

    <!-- Hidden element for measuring text width -->
    <div ref="hiddenElementRef" class="hidden-text-width-element"></div>
  </v-container>
</template>
<style scoped lang="scss">
  .btn-row {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    justify-content: flex-end;
  }

  .textarea-container {
    display: flex;
    align-items: flex-start;
    position: relative;
    width: 100%;
    flex-grow: 1;
    overflow-y: auto;
    margin-top: 12px;
  }

  .line-numbers {
    text-align: right;
    padding: 8px;
    background-color: rgb(var(--v-theme-base-lighten-4));
    color: rgb(var(--v-theme-base-darken-3));
    border-right: 1px solid rgb(var(--v-theme-base-darken-3));
    user-select: none;
    overflow: hidden;
  }

  .alert-fixed {
    bottom: 0;
    z-index: 10;
  }

  .hidden-text-width-element {
    position: absolute;
    visibility: hidden;
    white-space: pre;
    width: auto;
    font-size: var(--v-vcs-font-size);
  }
</style>
