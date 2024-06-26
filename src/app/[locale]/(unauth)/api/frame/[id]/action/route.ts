import type {
  FrameButtonMetadata,
  FrameRequest,
} from '@coinbase/onchainkit/frame';
import {
  getFrameHtmlResponse,
  getFrameMessage,
} from '@coinbase/onchainkit/frame';
import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { logger } from '@/libs/Logger';
import { frameSchema, productSchema } from '@/models/Schema';
import { defaultErrorFrame, getBaseUrl } from '@/utils/Helpers';

export type Attestation = {
  recipient: string;
  revocationTime: number;
  revoked: boolean;
  expirationTime: number;
  schema: {
    id: string;
  };
  decodedDataJson: string;
};

export type QueryResponse = {
  data?: {
    attestations: Attestation[];
  };
};

const validAttestations = async (
  address: string,
  schema?: string,
  attester?: string,
): Promise<Attestation[]> => {
  // Build the filter conditions based on provided inputs
  let filters = `recipient: { equals: "${address}", mode: insensitive }`;
  if (schema) {
    filters += `, schemaId: { equals: "${schema}", mode: insensitive }`;
  }
  if (attester) {
    filters += `, attester: { equals: "${attester}", mode: insensitive }`;
  }

  const query = `
    query Attestations {
      attestations(
        where: { ${filters} }
      ) {
        id
        attester
        recipient
        refUID
        revocable
        revocationTime
        revoked
        expirationTime
        data
        schema {
          id
        }
      }
    }
  `;

  const response = await fetch(Env.BASE_EAS_SCAN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  const result: QueryResponse = await response.json();

  const attestations = result.data!.attestations || [];

  const filteredAttestations = attestations.filter(
    (attestation: Attestation) =>
      attestation.revocationTime === 0 &&
      attestation.expirationTime === 0 &&
      (!schema || attestation.schema.id === schema),
  );

  return filteredAttestations;
};

const verifyReceiptsRunningAttestation = async (
  address: string,
): Promise<{ valid: boolean; data: any }> => {
  const attestations = await validAttestations(
    address,
    Env.RECEIPTS_XYZ_ALL_TIME_RUNNING_SCHEMA,
    Env.RECEIPTS_XYZ_ATTESTER,
  );
  return {
    valid: attestations.length >= 10,
    data: { count: attestations.length },
  };
};

const verifyCoinbaseOnchainVerificationCountryResidenceAttestation = async (
  address: string,
): Promise<{ valid: boolean; data: any }> => {
  const attestations = await validAttestations(
    address,
    Env.COINBASE_ONCHAIN_VERIFICATION_COUNTRY_RESIDENCE_SCHEMA,
    Env.COINBASE_ONCHAIN_VERIFICATION_ATTESTER,
  );
  return {
    valid: attestations.length > 0,
    data: { attestation: attestations[0] },
  };
};

const verifyCoinbaseOnchainVerificationAccountAttestation = async (
  address: string,
): Promise<{ valid: boolean; data: any }> => {
  const attestations = await validAttestations(
    address,
    Env.COINBASE_ONCHAIN_VERIFICATION_ACCOUNT_SCHEMA,
    Env.COINBASE_ONCHAIN_VERIFICATION_ATTESTER,
  );
  return {
    valid: attestations.length > 0,
    data: { attestation: attestations[0] },
  };
};

const verifyCoinbaseOnchainVerificationOneAttestation = async (
  address: string,
): Promise<{ valid: boolean; data: any }> => {
  const attestations = await validAttestations(
    address,
    Env.COINBASE_ONCHAIN_VERIFICATION_ONE_SCHEMA,
    Env.COINBASE_ONCHAIN_VERIFICATION_ATTESTER,
  );
  return {
    valid: attestations.length > 0,
    data: { attestation: attestations[0] },
  };
};

type VerificationFunction = (
  address: string,
) => Promise<{ valid: boolean; data?: any }>;
type MessageFunction = (address: string) => string;

interface VerificationMapEntry {
  verify: VerificationFunction;
  success: MessageFunction;
  failure: MessageFunction;
}

const verificationMap: { [key: string]: VerificationMapEntry } = {
  RECEIPTS_XYZ_ALL_TIME_RUNNING: {
    verify: verifyReceiptsRunningAttestation,
    success: (address: string) =>
      `10 or more attestations found on Receipts.xyz for ${address}. A special product is recommended.`,
    failure: (address: string) =>
      `Not more than 10 attestations found on Receipts.xyz for ${address}. A random product is recommended.`,
  },
  COINBASE_ONCHAIN_VERIFICATIONS_COUNTRY: {
    verify: verifyCoinbaseOnchainVerificationCountryResidenceAttestation,
    success: (address: string) =>
      `Country of residence verified for ${address} on Coinbase Onchain. A product based on the country is recommended.`,
    failure: (address: string) =>
      `Country of residence not verified for ${address} on Coinbase Onchain. A random product is recommended.`,
  },
  COINBASE_ONCHAIN_VERIFICATIONS_ACCOUNT: {
    verify: verifyCoinbaseOnchainVerificationAccountAttestation,
    success: (address: string) =>
      `Coinbase account member attestation for ${address}. A special product is recommended.`,
    failure: (address: string) =>
      `No Coinbase account member attestation for ${address}. A random product is recommended.`,
  },
  COINBASE_ONCHAIN_VERIFICATIONS_ONE: {
    verify: verifyCoinbaseOnchainVerificationOneAttestation,
    success: (address: string) =>
      `Coinbase One account member attestation for ${address}. A special product is recommended.`,
    failure: (address: string) =>
      `No Coinbase One account member attestation for ${address}. A random product is recommended.`,
  },
};

const processVerification = async (
  matchingCriteria: string | undefined,
  accountAddress: string,
) => {
  if (!matchingCriteria || !verificationMap[matchingCriteria]) {
    return { valid: false, explanation: '', data: null };
  }

  const { verify, success, failure } = verificationMap[matchingCriteria]!;
  const verification = await verify(accountAddress);
  const { valid } = verification;
  const explanation = valid ? success(accountAddress) : failure(accountAddress);

  return { valid, explanation, data: verification.data };
};

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

  const dev = !!message?.input;

  accountAddress =
    message?.input ?? message?.interactor?.verified_accounts?.[0] ?? '';

  // Get frame
  const url = new URL(req.url);
  const urlParts = url.pathname.split('/');
  const idPart = urlParts[urlParts.length - 2];

  if (!idPart) {
    logger.info('Invalid URL structure', { idPart });
    return new NextResponse(defaultErrorFrame);
  }

  const frameId = parseInt(idPart, 10);

  if (Number.isNaN(frameId)) {
    logger.info('Invalid ID', { idPart });
    return new NextResponse(defaultErrorFrame);
  }

  const frames = await db
    .select()
    .from(frameSchema)
    .where(eq(frameSchema.id, frameId))
    .limit(1);

  if (frames.length === 0) {
    logger.info('Frame not found', { frameId });
    return new NextResponse(defaultErrorFrame);
  }

  const [frame] = frames;

  // Get onchain data
  const { valid, explanation, data } = await processVerification(
    frame?.matchingCriteria!,
    accountAddress,
  );

  let customExplanation = explanation;

  // Get products
  const products = await db
    .select()
    .from(productSchema)
    .where(eq(productSchema.shop, frame!.shop));

  // Recommend product/s based on onchain data
  let recommendedProduct;
  let imageSrc;
  if (valid) {
    if (frame?.matchingCriteria === 'RECEIPTS_XYZ_ALL_TIME_RUNNING') {
      recommendedProduct = products.find((product) =>
        /Run|Running|Jog/i.test(product.description),
      );

      if (recommendedProduct) {
        imageSrc = `${getBaseUrl()}/api/og?title=Congrats on your +10th run!&subtitle=You're now eligible to buy:&content=${recommendedProduct!.title}&url=${recommendedProduct!.image}&width=600`;
      }
    } else if (
      frame?.matchingCriteria === 'COINBASE_ONCHAIN_VERIFICATIONS_COUNTRY'
    ) {
      const { attestation } = data;

      const schema = 'string verifiedCountry';
      const schemaEncoder = new SchemaEncoder(schema);

      const decodedData = schemaEncoder.decodeData(attestation.data);

      const country = decodedData[0]?.value.value;

      if (country) {
        recommendedProduct = products.find((product) =>
          new RegExp(country as string, 'i').test(product.description),
        );

        if (recommendedProduct) {
          imageSrc = `${getBaseUrl()}/api/og?title=${recommendedProduct!.title}&subtitle=${recommendedProduct!.description}&content=${recommendedProduct!.variantFormattedPrice}&url=${recommendedProduct!.image}&width=600`;

          customExplanation = `Country of residence verified as ${country} for ${accountAddress} on Coinbase Onchain`;
        } else {
          customExplanation = `Product not found for country of residence verified as ${country} for ${accountAddress} on Coinbase Onchain`;
        }
      }
    } else if (
      frame?.matchingCriteria === 'COINBASE_ONCHAIN_VERIFICATIONS_ACCOUNT'
    ) {
      recommendedProduct = products.find((product) =>
        /Special/i.test(product.description),
      );

      if (recommendedProduct) {
        imageSrc = `${getBaseUrl()}/api/og?title=${recommendedProduct!.title}&subtitle=${recommendedProduct!.description}&content=${recommendedProduct!.variantFormattedPrice}&url=${recommendedProduct!.image}&width=600`;
      }
    } else if (
      frame?.matchingCriteria === 'COINBASE_ONCHAIN_VERIFICATIONS_ONE'
    ) {
      recommendedProduct = products.find((product) =>
        /Special/i.test(product.description),
      );

      if (recommendedProduct) {
        imageSrc = `${getBaseUrl()}/api/og?title=${recommendedProduct!.title}&subtitle=${recommendedProduct!.description}&content=${recommendedProduct!.variantFormattedPrice}&url=${recommendedProduct!.image}&width=600`;
      }
    }
  }

  if (!recommendedProduct) {
    const randomIndex = Math.floor(Math.random() * products.length);
    recommendedProduct = products[randomIndex];
    imageSrc = `${getBaseUrl()}/api/og?title=${recommendedProduct!.title}&subtitle=${recommendedProduct!.description}&content=${recommendedProduct!.variantFormattedPrice}&url=${recommendedProduct!.image}&width=600`;
    customExplanation = `No onchain data or matching product found for ${accountAddress}. A random product is recommended.`;
  }

  const buttons: [FrameButtonMetadata, ...FrameButtonMetadata[]] = [
    {
      action: 'link',
      label: 'View',
      target: `https://${frame!.shop}/products/${recommendedProduct!.handle}`,
    },
  ];

  if (recommendedProduct!.variantId) {
    buttons.push({
      action: 'link',
      label: 'Buy',
      target: `https://${frame!.shop}/cart/${recommendedProduct!.variantId}:1`,
    });
  }

  if (dev) {
    buttons.push({
      action: 'post',
      label: 'Explain',
      target: `${getBaseUrl()}/api/frame/${frameId}/explain`,
    });
  }

  const response = getFrameHtmlResponse({
    buttons,
    image: {
      src: imageSrc!,
    },
    ogDescription: recommendedProduct!.title,
    ogTitle: 'Target Onchain',
    postUrl: `${getBaseUrl()}/api/frame`,
    ...(dev && {
      state: {
        description: customExplanation,
      },
    }),
  });

  return new NextResponse(response);
};
