'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { type SubmitHandler, useForm } from 'react-hook-form';
import type { z } from 'zod';

import { FrameValidation } from '@/validations/FrameValidation';

type IFrameFormProps =
  | {
      edit: true;
      id: number;
      defaultValues: z.infer<typeof FrameValidation>;
      onValid: SubmitHandler<z.infer<typeof FrameValidation>>;
    }
  | {
      edit?: false;
      onValid: SubmitHandler<z.infer<typeof FrameValidation>>;
    };

const FrameForm = (props: IFrameFormProps) => {
  const {
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof FrameValidation>>({
    resolver: zodResolver(FrameValidation),
    defaultValues: props.edit ? props.defaultValues : undefined,
  });
  const router = useRouter();
  const t = useTranslations('FrameForm');

  const handleCreate = handleSubmit(async (data) => {
    await props.onValid(data);

    reset();
    router.refresh();
  });

  return (
    <form onSubmit={handleCreate}>
      <div>
        <label
          className="text-sm font-bold text-gray-700"
          htmlFor={`title${props.edit ? `-${props.id}` : ''}`}
        >
          {t('title')}
          <input
            id={`title${props.edit ? `-${props.id}` : ''}`}
            className="mt-2 w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 focus:outline-none focus:ring focus:ring-blue-300/50"
            {...register('title')}
          />
        </label>
        {errors.title?.message && (
          <div className="my-2 text-xs italic text-red-500">
            {errors.title?.message}
          </div>
        )}
      </div>

      <div className="mt-3">
        <label
          className="text-sm font-bold text-gray-700"
          htmlFor={`shop${props.edit ? `-${props.id}` : ''}`}
        >
          {t('shop')}
          <input
            id={`shop${props.edit ? `-${props.id}` : ''}`}
            className="mt-2 w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 focus:outline-none focus:ring focus:ring-blue-300/50"
            {...register('shop')}
          />
        </label>
        {errors.shop?.message && (
          <div className="my-2 text-xs italic text-red-500">
            {errors.shop?.message}
          </div>
        )}
      </div>

      <div className="mt-3">
        <label
          className="text-sm font-bold text-gray-700"
          htmlFor={`image${props.edit ? `-${props.id}` : ''}`}
        >
          {t('image')}
          <input
            id={`image${props.edit ? `-${props.id}` : ''}`}
            className="mt-2 w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 focus:outline-none focus:ring focus:ring-blue-300/50"
            {...register('image')}
          />
        </label>
        {errors.image?.message && (
          <div className="my-2 text-xs italic text-red-500">
            {errors.image?.message}
          </div>
        )}
      </div>

      <div className="mt-3">
        <label
          className="text-sm font-bold text-gray-700"
          htmlFor={`button${props.edit ? `-${props.id}` : ''}`}
        >
          {t('button')}
          <input
            id={`button${props.edit ? `-${props.id}` : ''}`}
            className="mt-2 w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 focus:outline-none focus:ring focus:ring-blue-300/50"
            {...register('button')}
          />
        </label>
        {errors.button?.message && (
          <div className="my-2 text-xs italic text-red-500">
            {errors.button?.message}
          </div>
        )}
      </div>

      <div className="mt-3">
        <label
          className="text-sm font-bold text-gray-700"
          htmlFor={`button${props.edit ? `-${props.id}` : ''}`}
        >
          {t('matchingCriteria')}
          <input
            id={`matchingCriteria${props.edit ? `-${props.id}` : ''}`}
            className="mt-2 w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 focus:outline-none focus:ring focus:ring-blue-300/50"
            {...register('matchingCriteria')}
          />
        </label>
        {errors.matchingCriteria?.message && (
          <div className="my-2 text-xs italic text-red-500">
            {errors.matchingCriteria?.message}
          </div>
        )}
      </div>

      <div className="mt-5">
        <button
          className="rounded bg-blue-500 px-5 py-1 font-bold text-white hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-300/50"
          type="submit"
        >
          {t('save')}
        </button>
      </div>
    </form>
  );
};

export { FrameForm };
