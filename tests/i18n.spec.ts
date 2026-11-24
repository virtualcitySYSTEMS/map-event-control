import { describe, it, expect } from 'vitest';
import {
  callbackDefinitions,
  customCallbackType,
  getFieldPlaceholder,
} from '../src/editor/callbackDefinitions.js';
import en from '../src/i18n/en.js';
import de from '../src/i18n/de.js';

function resolve(messages: object, key: string): unknown {
  return key
    .split('.')
    .reduce<unknown>(
      (obj, part) => (obj as Record<string, unknown> | undefined)?.[part],
      messages,
    );
}

function collectMessages(obj: object, prefix = ''): Array<[string, string]> {
  return Object.entries(obj).flatMap(([key, value]) =>
    typeof value === 'string'
      ? [[`${prefix}${key}`, value] as [string, string]]
      : collectMessages(value as object, `${prefix}${key}.`),
  );
}

const locales = { en, de };

function getRequiredKeys(): string[] {
  return [
    ...[...callbackDefinitions.map((d) => d.type), customCallbackType].map(
      (type) => `eventControl.editor.callbacks.types.${type}`,
    ),
    ...callbackDefinitions.flatMap((definition) =>
      definition.fields.flatMap((field) => [
        `eventControl.editor.callbacks.fields.${field.key}`,
        // textList fields render a chip input without placeholder (see help.idList)
        ...(field.kind === 'textList' ? [] : [getFieldPlaceholder(field)]),
      ]),
    ),
  ];
}

describe('i18n', () => {
  it('should provide title, labels and placeholders for all callbacks', () => {
    const missing = Object.entries(locales).flatMap(([locale, messages]) =>
      getRequiredKeys()
        .filter((key) => typeof resolve(messages, key) !== 'string')
        .map((key) => `${locale}: ${key}`),
    );
    expect(missing).to.be.empty;
  });

  it('should not contain vue-i18n syntax characters', () => {
    const invalid = Object.entries(locales).flatMap(([locale, messages]) =>
      collectMessages(messages)
        .filter(([, value]) => /[{}|]/.test(value))
        .map(([key]) => `${locale}: ${key}`),
    );
    expect(invalid).to.be.empty;
  });
});
