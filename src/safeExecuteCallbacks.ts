import type { VcsCallbackOptions, VcsUiApp } from '@vcmap/ui';
import { getLogger } from '@vcsuite/logger';
import { name } from '../package.json';

function logError(options: VcsCallbackOptions, error: unknown): void {
  getLogger(name).error(`Failed to execute callback ${options?.type}`, error);
}

/**
 * Like executeCallbacks from @vcmap/ui, but isolates each callback: an invalid callback
 * (e.g. missing/unknown type, bad options) or a throwing / rejecting callback is logged
 * and does not prevent the remaining callbacks from running. It also never throws, so the
 * event listener calling it cannot break other listeners of the same VcsEvent
 * (e.g. the content tree's layer state listener, which would otherwise leave the
 * layer stuck in the loading state).
 */
export default function safeExecuteCallbacks(
  app: VcsUiApp,
  vcsCallbackOptions: VcsCallbackOptions[],
): void {
  vcsCallbackOptions.forEach((options) => {
    try {
      const result = app.callbackClassRegistry
        .createFromTypeOptions(options, app)
        ?.callback();
      if (result instanceof Promise) {
        result.catch((e: unknown) => {
          logError(options, e);
        });
      }
    } catch (e) {
      logError(options, e);
    }
  });
}
