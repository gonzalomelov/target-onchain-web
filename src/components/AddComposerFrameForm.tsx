'use client';

import { getBaseUrl } from '@/utils/Helpers';

import { FrameForm } from './FrameForm';

const AddComposerFrameForm = (props: { creator: string }) => (
  <FrameForm
    defaultValues={{
      creator: props.creator,
      button: 'Show',
    }}
    onValid={async (data) => {
      const response = await fetch(`/api/frame/slice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const frame = await response.json();

      window.parent.postMessage(
        {
          type: 'createCast',
          data: {
            cast: {
              text: 'Enter your wallet to discover what this Slice store has for you!',
              embeds: [`${getBaseUrl()}/api/frame/${frame.id}/html?dev=true`],
            },
          },
        },
        '*',
      );
    }}
  />
);

export { AddComposerFrameForm };
