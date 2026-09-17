import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'AgroTrust';
// TODO: once a custom domain is connected in Vercel, update this to the real domain
// (e.g. https://agrotrust.ng) so canonical URLs and JSON-LD point to the right place.
const SITE_URL = 'https://agro-trust.vercel.app';
const DEFAULT_DESCRIPTION =
  'AgroTrust connects farmers directly with consumers across Nigeria, making it easier to find, vet, and buy fresh farm produce.';
const DEFAULT_IMAGE =
  'https://storage.googleapis.com/gpt-engineer-file-uploads/pzDlLMSJO7TqLRfNPjSyNwRZLeq2/social-images/social-1772918338652-5f1f2276-6bae-49b7-9014-6fc3c784160b.webp';

interface SeoProps {
  /** Page-specific title. Rendered as "<title> | AgroTrust" unless titleIsFull is set. */
  title: string;
  /** If true, renders the title exactly as given, with no " | AgroTrust" suffix (e.g. for the homepage). */
  titleIsFull?: boolean;
  description?: string;
  /** Path only, e.g. "/products" or "/farmers/123". Combined with SITE_URL for the canonical + og:url tags. */
  path?: string;
  image?: string;
  /** Set on account/auth/dashboard/admin pages so search engines don't index them. */
  noindex?: boolean;
  /** One or more JSON-LD objects to embed as <script type="application/ld+json">. */
  jsonLd?: object | object[];
}

export function Seo({
  title,
  titleIsFull = false,
  description = DEFAULT_DESCRIPTION,
  path,
  image = DEFAULT_IMAGE,
  noindex = false,
  jsonLd,
}: SeoProps) {
  const fullTitle = titleIsFull ? title : `${title} | ${SITE_NAME}`;
  const url = path ? `${SITE_URL}${path}` : undefined;
  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {url && <link rel="canonical" href={url} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      {url && <meta property="og:url" content={url} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}

export { SITE_NAME, SITE_URL, DEFAULT_DESCRIPTION, DEFAULT_IMAGE };
