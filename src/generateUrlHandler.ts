import { ActionHandler } from '@aws-amplify/ui-react-storage/browser';

type GenerateLink = ActionHandler<
  { duration: number; fileKey: string },
  { link: string }
>;

export const generateUrlHandler: GenerateLink = async ({ data, config }) => {
  const handleGenerateUrl = async () => {
    try {
      // 퍼블릭 S3 객체 URL 생성
      const bucket = config.bucket;
      const region = config.region;
      const key = data.fileKey;

      const url = `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(key)}`;

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

  return { result: handleGenerateUrl() };
};