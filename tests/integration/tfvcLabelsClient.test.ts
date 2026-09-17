// Contract test for TfvcLabelsClient — see contracts/tfvc-labels-client.md.
import { getClient } from 'azure-devops-extension-api';

jest.mock('azure-devops-extension-api', () => ({
  getClient: jest.fn(),
}));

jest.mock('azure-devops-extension-api/Tfvc', () => ({
  TfvcRestClient: class MockTfvcRestClient {},
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { RestTfvcLabelsClient } = require('../../src/services/tfvcLabelsClient');

describe('RestTfvcLabelsClient', () => {
  const mockGetLabels = jest.fn();
  const mockGetLabel = jest.fn();
  const mockGetLabelItems = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (getClient as jest.Mock).mockReturnValue({
      getLabels: mockGetLabels,
      getLabel: mockGetLabel,
      getLabelItems: mockGetLabelItems,
    });
  });

  it('getLabels maps TfvcLabelRef[] to TfvcLabel[]', async () => {
    mockGetLabels.mockResolvedValue([
      {
        id: 'label-1',
        name: 'Release-1.0',
        description: 'First release',
        owner: { id: 'user-1', displayName: 'Alice', imageUrl: 'https://example/avatar.png' },
        modifiedDate: '2026-01-01T00:00:00Z',
      },
    ]);

    const client = new RestTfvcLabelsClient();
    const labels = await client.getLabels();

    expect(labels).toHaveLength(1);
    expect(labels[0]).toMatchObject({
      id: 'label-1',
      name: 'Release-1.0',
      description: 'First release',
      creator: { id: 'user-1', displayName: 'Alice' },
    });
  });

  it('getLabel maps a single label and throws not-found DataAccessError when absent', async () => {
    mockGetLabel.mockResolvedValueOnce(null);
    const client = new RestTfvcLabelsClient();

    await expect(client.getLabel('missing-id')).rejects.toMatchObject({ kind: 'not-found' });
  });

  it('getLabelFolderContents returns only direct children of the given folder path', async () => {
    mockGetLabelItems.mockResolvedValue([
      { path: '$/Proj/Folder', isFolder: true },
      { path: '$/Proj/Folder/File1.txt', isFolder: false },
      { path: '$/Proj/Folder/Sub', isFolder: true },
      { path: '$/Proj/Folder/Sub/Deep.txt', isFolder: false },
    ]);

    const client = new RestTfvcLabelsClient();
    const children = await client.getLabelFolderContents('label-1', '$/Proj/Folder');

    expect(children.map((c: { name: string }) => c.name).sort()).toEqual(['File1.txt', 'Sub']);
  });

  it('wraps unknown errors as a DataAccessError', async () => {
    mockGetLabels.mockRejectedValue(new Error('boom'));
    const client = new RestTfvcLabelsClient();

    await expect(client.getLabels()).rejects.toMatchObject({ kind: 'unknown', message: 'boom' });
  });
});
