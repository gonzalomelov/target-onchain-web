import { getTranslations } from 'next-intl/server';

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'Index',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default function Index() {
  return (
    <>
      <p>Ready to test the Shopify App?</p>
      <p>
        Email{' '}
        <a
          className="text-blue-700 hover:border-b-2 hover:border-blue-700"
          href="mailto:gonzalomelov@gmail.com?subject=Invite%20me%20to%20try%20the%20Shopify%20App"
        >
          gonzalomelov@gmail.com
        </a>
      </p>
      <p>
        Warpcast{' '}
        <a
          className="text-blue-700 hover:border-b-2 hover:border-blue-700"
          href="https://warpcast.com/gonzalomelov.eth"
          target="_blank"
        >
          gonzalomelov.eth
        </a>
      </p>
      <p>
        X{' '}
        <a
          className="text-blue-700 hover:border-b-2 hover:border-blue-700"
          href="https://x.com/gonzalomelov"
          target="_blank"
        >
          gonzalomelov
        </a>
      </p>
    </>
  );
}
