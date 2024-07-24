import { type FrameRequest, getFrameMessage } from '@coinbase/onchainkit/frame';
import { NextResponse } from 'next/server';

import { Env } from '@/libs/Env';
import { logger } from '@/libs/Logger';
import { defaultErrorFrame, getBaseUrl } from '@/utils/Helpers';

export const POST = async (req: Request) => {
  // Validate frame and get account address
  let accountAddress: string | undefined = '';

  const body: FrameRequest = await req.json();

  const { isValid, message } = await getFrameMessage(body, {
    neynarApiKey: Env.NEYNAR_API_KEY,
  });

  if (!isValid) {
    logger.info('Message not valid');
    return new NextResponse(defaultErrorFrame);
  }

  accountAddress =
    message?.input ?? message?.interactor?.verified_accounts?.[0] ?? '';

  return NextResponse.json({
    type: 'form',
    title: 'Create Store Frame',
    url: `${getBaseUrl()}/frame/composer?creator=${accountAddress}`,
  });
};
