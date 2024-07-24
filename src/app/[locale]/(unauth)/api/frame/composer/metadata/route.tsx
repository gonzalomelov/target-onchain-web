import { NextResponse } from 'next/server';

import { getBaseUrl } from '@/utils/Helpers';

export const GET = async () => {
  return NextResponse.json({
    type: 'composer',
    name: 'Slice Referrals',
    icon: 'meter',
    description: 'Earn with referrals',
    aboutUrl: getBaseUrl(),
    imageUrl: `${getBaseUrl()}/favicon-100x100.png`,
    action: {
      type: 'post',
    },
  });
};
