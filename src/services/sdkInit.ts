// Shared SDK bootstrap helpers used by both hub entry points — see research.md §1.
import * as SDK from 'azure-devops-extension-sdk';

export async function initializeSdk(): Promise<void> {
  await SDK.init();
}

export async function notifyLoaded(): Promise<void> {
  await SDK.notifyLoadSucceeded();
}

export function getCurrentProjectName(): string {
  const webContext = SDK.getWebContext();
  return webContext.project?.name ?? '';
}
