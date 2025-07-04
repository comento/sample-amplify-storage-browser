import {
  createStorageBrowser,
} from '@aws-amplify/ui-react-storage/browser';
import '@aws-amplify/ui-react-storage/styles.css';
import './App.css';

import { generateUrlHandler } from './generateUrlHandler.ts';
import * as React from 'react';
import {
  Button,
  Flex,
  Link,
  Text,
} from '@aws-amplify/ui-react';

// import config from '../amplify_outputs.json';
// import { Amplify } from 'aws-amplify';
// import { Authenticator, Button, Flex, Heading } from '@aws-amplify/ui-react';
// Amplify.configure(config);

// const { StorageBrowser } = createStorageBrowser({
//   config: createAmplifyAuthAdapter(),
// });

const { StorageBrowser, useAction, useView } = createStorageBrowser({
  config: {
    region: import.meta.env.VITE_AWS_REGION,
    accountId: import.meta.env.VITE_AWS_ACCOUNT_ID,
    listLocations: async () => {
      return {
        items: [
          {
            bucket: import.meta.env.VITE_S3_BUCKET_NAME,
            prefix: '',
            id: 'root',
            type: 'BUCKET',
            permissions: ['list', 'get', 'write', 'delete'],
          },
        ],
      };
    },
    getLocationCredentials: async () => {
      return {
        credentials: {
          accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
          secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
          // sessionToken: import.meta.env.VITE_AWS_SESSION_TOKEN,
          expiration: new Date(Date.now() + 3600000),
        },
      };
    },
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

const GenerateUrlView = () => {
  const { onActionExit, fileDataItems, selectionManager } = useView('LocationDetail');
  const [resetCount, setResetCount] = React.useState(0);

  const bucket = import.meta.env.VITE_S3_BUCKET_NAME;
  const region = import.meta.env.VITE_AWS_REGION;

  const items = React.useMemo(
    () =>
      fileDataItems?.map((item) => ({
        ...item,
        fileKey: item.key,
      })) ?? [],
    [fileDataItems]
  );

  const [actionState, handleGenerate] = useAction('generateUrl', { items });

  const handleGenerateWithReset = async () => {
    setResetCount((prev) => prev + 1); // UI 초기화
    await handleGenerate();
  };

  const handleExit = () => {
    // ⬅️ 선택 초기화
    selectionManager?.clearSelection?.();
    onActionExit();
  };

  const getPublicUrl = (bucket: string, region: string, key: string) =>
    `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(key)}`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch((err) => {
      console.error('Copy failed', err);
    });
  };

  return (
    <Flex direction="column" padding="1.5rem" gap="1.5rem" key={resetCount}>
      {/* 좌측 상단 Exit */}
      <Flex>
        <Button
          onClick={handleExit}
          variation="link"
          size="small"
        >
          ← Exit
        </Button>
      </Flex>

      {/* Generate Button */}
      <Button onClick={handleGenerateWithReset}>Generate Links</Button>

      {/* 결과 출력 */}
      {actionState.tasks?.map(({ data, status, value }) => {
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

function App() {
  return (
    // <Authenticator>
    //   {({ signOut, user }) => (
    //     <>
    //       <Flex direction="row" alignItems="center" wrap="nowrap" gap="1rem">
    //         <Heading level={4}>{`Hello ${user?.username}`}</Heading>
    //         <Button onClick={signOut}>Sign out</Button>
    //       </Flex>
    //       <StorageBrowser />
    //     </>
    //   )}
    // </Authenticator>
    <StorageBrowser views={{ GenerateUrlView }} />
  );
}

export default App;
