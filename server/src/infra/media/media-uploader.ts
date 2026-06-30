import { MediaUploader } from '@fluxmedia/core';
import { R2Provider } from '@fluxmedia/r2';
import { env } from '../../config/env';

function createMediaUploader(): MediaUploader | null {
  const accountId = env.R2_ACCOUNT_ID;
  const accessKeyId = env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }

  const provider = new R2Provider({
    accountId,
    bucket: env.R2_BUCKET,
    accessKeyId,
    secretAccessKey,
    publicUrl: env.R2_PUBLIC_URL || undefined,
  });

  return new MediaUploader(provider);
}

export const mediaUploader = createMediaUploader();
