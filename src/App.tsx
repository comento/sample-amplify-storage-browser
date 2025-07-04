import {
  createStorageBrowser,
  FileDataItem,
} from '@aws-amplify/ui-react-storage/browser';
import '@aws-amplify/ui-react-storage/styles.css';
import './App.css';

import { generateUrlHandler } from './generateUrlHandler';
import * as React from 'react';
import {
  Button,
  Flex,
  Link,
  Text,
} from '@aws-amplify/ui-react';

const { StorageBrowser, useAction, useView } = createStorageBrowser({
  config: {
    region: import.meta.env.VITE_AWS_REGION,
    accountId: import.meta.env.VITE_AWS_ACCOUNT_ID,
    listLocations: async () => ({
      items: [
        {
          bucket: import.meta.env.VITE_S3_BUCKET_NAME,
          prefix: '',
          id: 'root',
          type: 'BUCKET',
          permissions: ['list', 'get', 'write', 'delete'],
        },
      ],
      nextToken: undefined,
    }),
    getLocationCredentials: async () => ({
      credentials: {
        accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
        secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
        sessionToken: '',
        expiration: new Date(Date.now() + 3600000),
      },
    }),
    registerAuthListener: () => {},
  },
  actions: {
    custom: {
      generateUrl: {
        actionListItem: {
          icon: 'download',
          label: 'Generate Download Links',
          disable: (selected) => !selected?.length,
        },
        handler: generateUrlHandler,
        viewName: 'GenerateUrlView',
      },
    },
  },
});

const GenerateUrlView: React.FC = () => {
  const {
    onActionExit,
    fileDataItems = [],
    // @ts-expect-error: Not yet typed in Amplify UI
    selectionManager,
  } = useView('LocationDetail');

  const [resetCount, setResetCount] = React.useState(0);

  const bucket = import.meta.env.VITE_S3_BUCKET_NAME;
  const region = import.meta.env.VITE_AWS_REGION;

  const items = React.useMemo(
    () =>
      fileDataItems.map((item: FileDataItem & { key: string }) => ({
        ...item,
        fileKey: item.key,
        duration: 60, // default duration (can be removed if unused)
      })),
    [fileDataItems]
  );

  const [actionState, handleGenerate] = useAction('generateUrl', {
    items,
    multiple: true,
  });

  const handleGenerateWithReset = async () => {
    setResetCount((prev) => prev + 1);
    await handleGenerate();
  };

  const handleExit = () => {
    selectionManager?.clearSelection?.();
    onActionExit();
  };

  const getPublicUrl = (bucket: string, region: string, key: string) =>
    `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(key)}`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(console.error);
  };

  return (
    <Flex direction="column" padding="1.5rem" gap="1.5rem" key={resetCount}>
      <Flex>
        <Button onClick={handleExit} variation="link" size="small">
          ← Exit
        </Button>
      </Flex>

      <Button onClick={handleGenerateWithReset}>Generate Links</Button>

      {(actionState.tasks ?? []).map((task) => {
        const { data, status, value } = task as {
          data: { fileKey: string };
          status: string;
          value?: { link: string };
        };

        const url = value?.link || getPublicUrl(bucket, region, data.fileKey);

        return (
          <Flex
            key={data.fileKey}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            padding="0.75rem"
            border="1px solid #ddd"
            borderRadius="0.5rem"
            backgroundColor="#fafafa"
          >
            <Flex direction="column">
              <Text fontWeight="bold">{data.fileKey}</Text>
              <Link href={url} target="_blank" rel="noopener noreferrer">
                {url}
              </Link>
              <Text>Status: {status}</Text>
            </Flex>
            <Button onClick={() => handleCopy(url)} size="small">
              Copy
            </Button>
          </Flex>
        );
      })}
    </Flex>
  );
};

const App: React.FC = () => {
  return <StorageBrowser views={{ GenerateUrlView }} />;
};

export default App;