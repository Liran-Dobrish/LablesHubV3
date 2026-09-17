// Minimal manual mock of azure-devops-extension-sdk for unit tests (per plan.md/research.md testing decisions).
const webContext = {
  project: { id: 'test-project-id', name: 'Test Project' },
  user: { id: 'test-user-id', displayName: 'Test User' },
};

export function init(): Promise<void> {
  return Promise.resolve();
}

export function notifyLoadSucceeded(): Promise<void> {
  return Promise.resolve();
}

export function getWebContext() {
  return webContext;
}

export function getAccessToken(): Promise<string> {
  return Promise.resolve('mock-token');
}

export function getConfiguration(): Record<string, unknown> {
  return {};
}

export function getService<T>(_contributionId: string): Promise<T> {
  return Promise.resolve({} as T);
}

export default {
  init,
  notifyLoadSucceeded,
  getWebContext,
  getAccessToken,
  getConfiguration,
  getService,
};
