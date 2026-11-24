/* eslint-disable max-classes-per-file */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { VcsCallback, VcsUiApp } from '@vcmap/ui';
import safeExecuteCallbacks from '../src/safeExecuteCallbacks.js';

const executed: string[] = [];

class RecordingCallback extends VcsCallback {
  static get className(): string {
    return 'RecordingCallback';
  }

  private _id: string;

  constructor(options: { type: string; id: string }, app: VcsUiApp) {
    super(options, app);
    this._id = options.id;
  }

  callback(): void {
    executed.push(this._id);
  }
}

class ThrowingCallback extends VcsCallback {
  static get className(): string {
    return 'ThrowingCallback';
  }

  // eslint-disable-next-line class-methods-use-this
  callback(): void {
    throw new Error('sync failure');
  }
}

class RejectingCallback extends VcsCallback {
  static get className(): string {
    return 'RejectingCallback';
  }

  // eslint-disable-next-line class-methods-use-this
  callback(): Promise<void> {
    return Promise.reject(new Error('async failure'));
  }
}

describe('safeExecuteCallbacks', () => {
  let app: VcsUiApp;

  beforeAll(() => {
    app = new VcsUiApp();
    app.callbackClassRegistry.registerClass(
      app.dynamicModuleId,
      RecordingCallback.className,
      RecordingCallback,
    );
    app.callbackClassRegistry.registerClass(
      app.dynamicModuleId,
      ThrowingCallback.className,
      ThrowingCallback,
    );
    app.callbackClassRegistry.registerClass(
      app.dynamicModuleId,
      RejectingCallback.className,
      RejectingCallback,
    );
  });

  afterAll(() => {
    app.destroy();
  });

  it('executes remaining callbacks if a callback is invalid, throws or rejects', async () => {
    executed.length = 0;
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);

    expect(() => {
      safeExecuteCallbacks(app, [
        { type: 'RecordingCallback', id: 'a' },
        // @ts-expect-error: invalid callback without type
        { id: 'missingType' },
        { type: 'UnknownCallback' },
        { type: 'ThrowingCallback' },
        { type: 'RejectingCallback' },
        { type: 'RecordingCallback', id: 'b' },
      ]);
    }).not.toThrow();

    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
    process.off('unhandledRejection', unhandled);

    expect(executed).toEqual(['a', 'b']);
    expect(unhandled).not.toHaveBeenCalled();
  });
});
