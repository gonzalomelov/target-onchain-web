import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';

import { AddFrameForm } from '@/components/AddFrameForm';
import { FrameList } from '@/components/FrameList';

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'Frame',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

const Frame = () => {
  const t = useTranslations('Frame');

  return (
    <>
      <AddFrameForm />

      <Suspense fallback={<p>{t('loading_frame')}</p>}>
        <FrameList />
      </Suspense>

      <div className="mt-2 text-center text-sm">
        {`${t('error_reporting_powered_by')} `}
        <a
          className="text-blue-700 hover:border-b-2 hover:border-blue-700"
          href="https://sentry.io/for/nextjs/?utm_source=github&utm_medium=paid-community&utm_campaign=general-fy25q1-nextjs&utm_content=github-banner-nextjsboilerplate-logo"
          target="_blank"
        >
          Sentry
        </a>
      </div>

      <a
        href="https://sentry.io/for/nextjs/?utm_source=github&utm_medium=paid-community&utm_campaign=general-fy25q1-nextjs&utm_content=github-banner-nextjsboilerplate-logo"
        target="_blank"
      >
        <Image
          className="mx-auto mt-2"
          src="/assets/images/sentry-dark.png"
          alt="Sentry"
          width={130}
          height={112}
        />
      </a>
    </>
  );
};

export default Frame;
