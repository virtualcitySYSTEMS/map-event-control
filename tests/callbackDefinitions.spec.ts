import { describe, it, expect } from 'vitest';
import type { VcsCallbackOptions } from '@vcmap/ui';
import {
  customCallbackType,
  getDefaultCallback,
  isFormEditable,
} from '../src/editor/callbackDefinitions.js';

/** callback options with arbitrary additional keys */
function cb(
  options: Record<string, unknown> & { type: string },
): VcsCallbackOptions {
  return options;
}

describe('callbackDefinitions', () => {
  describe('isFormEditable', () => {
    it('should be true for known callbacks with known options', () => {
      expect(
        isFormEditable(
          cb({
            type: 'ActivateLayersCallback',
            layerNames: ['a'],
          }),
        ),
      ).to.be.true;
      expect(
        isFormEditable(
          cb({
            type: 'ToggleNavbarButtonCallback',
            buttonId: 'legendId',
            activeState: false,
          }),
        ),
      ).to.be.true;
      expect(isFormEditable(cb({ type: 'StopRotationCallback' }))).to.be.true;
    });

    it('should be false for unknown callback types', () => {
      expect(isFormEditable(cb({ type: 'MyPluginCallback' }))).to.be.false;
    });

    it('should be false for unknown options', () => {
      expect(
        isFormEditable(
          cb({
            type: 'StopRotationCallback',
            foo: 1,
          }),
        ),
      ).to.be.false;
    });

    it('should be false for values the form cannot represent', () => {
      expect(
        isFormEditable(
          cb({
            type: 'AddModuleCallback',
            module: { _id: 'inline' },
          }),
        ),
      ).to.be.false;
      expect(
        isFormEditable(
          cb({
            type: 'ActivateLayersCallback',
            layerNames: 'a',
          }),
        ),
      ).to.be.false;
      expect(
        isFormEditable(
          cb({ type: 'StartFlightCallback', flight: { name: 'inline' } }),
        ),
      ).to.be.false;
      expect(
        isFormEditable(
          cb({
            type: 'UnHighlightObjectsCallback',
            layerName: 'a',
            toUnHighlight: [1, 2],
          }),
        ),
      ).to.be.false;
    });

    it('should support text lists and json objects', () => {
      expect(
        isFormEditable(
          cb({
            type: 'HideObjectsCallback',
            layerName: 'a',
            objectIds: ['1', '2'],
          }),
        ),
      ).to.be.true;
      expect(
        isFormEditable(
          cb({
            type: 'HighlightObjectsCallback',
            layerName: 'a',
            toHighlight: { id1: { fill: { color: '#ff0000' } } },
          }),
        ),
      ).to.be.true;
      expect(
        isFormEditable(
          cb({
            type: 'HighlightObjectsCallback',
            layerName: 'a',
            toHighlight: ['id1'],
          }),
        ),
      ).to.be.false;
    });
  });

  describe('getDefaultCallback', () => {
    it('should initialize multi value fields with an empty array', () => {
      expect(getDefaultCallback('DeactivateLayersCallback')).to.deep.equal({
        type: 'DeactivateLayersCallback',
        layerNames: [],
      });
    });

    it('should initialize text lists and json objects', () => {
      expect(getDefaultCallback('ShowObjectsCallback')).to.deep.equal({
        type: 'ShowObjectsCallback',
        objectIds: [],
      });
      expect(getDefaultCallback('HighlightObjectsCallback')).to.deep.equal({
        type: 'HighlightObjectsCallback',
        toHighlight: {},
      });
    });

    it('should create an empty custom callback', () => {
      expect(getDefaultCallback(customCallbackType)).to.deep.equal({
        type: '',
      });
    });
  });
});
