import { NextResponse } from 'next/server';

import { getBaseUrl } from '@/utils/Helpers';

export const GET = async () => {
  return NextResponse.json({
    type: 'composer',
    name: 'Slice Store 🎯',
    icon: 'meter',
    description: 'Slice, Wallet-aware',
    aboutUrl: getBaseUrl(),
    imageUrl: `${getBaseUrl()}/favicon-100x100.png`,
    action: {
      type: 'post',
    },
  });
};
