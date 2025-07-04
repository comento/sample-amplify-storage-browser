import { ActionHandler } from '@aws-amplify/ui-react-storage/browser';

type GenerateLink = ActionHandler<
  { duration: number; fileKey: string },
  { link: string }
>;

export const generateUrlHandler: GenerateLink = async ({ data, config }) => {
  try {
    const url = `https://${config.bucket}.s3.${config.region}.amazonaws.com/${encodeURIComponent(data.fileKey)}`;
    return {
      status: 'COMPLETE' as const,
      value: { link: url },
    };
  } catch (error) {
    return {
      status: 'FAILED' as const,
      message: 'Unable to generate public link',
      error,
    };
  }
};