/**
 * Eva Apartman – JSON-LD builders
 * ---------------------------------------------------------------------------
 * One builder per page, called by tools/build-site.js once per language.
 *
 * Ground rules baked in here:
 *   - Anything asserted in markup must also be visible on the page. The
 *     aggregate rating below is rendered into the reviews badge in
 *     src/index.html; if you change RATING/REVIEW_COUNT, the badge changes too.
 *   - No invented facts. The individual reviews carry no datePublished because
 *     the page only shows relative ages ("3 years ago"); a guessed date would
 *     be a false claim in structured data. Add real dates here when you have
 *     them and the reviews become eligible for richer treatment.
 *   - Properties are attached to types that actually allow them. The old markup
 *     hung `offers` and `occupancy` straight off LodgingBusiness, where schema
 *     .org defines neither, so both were silently dropped. They now live on a
 *     nested Apartment reached via containsPlace.
 */
'use strict';

const SITE = 'https://www.visit-eva-orebic.com';

/* ── Facts shared across pages ───────────────────────────────────────── */

const BUSINESS_ID = SITE + '/#lodging';
const APARTMENT_ID = SITE + '/#apartment';
const ORG_ID = SITE + '/#organisation';

const RATING = '4.9';
const REVIEW_COUNT = 27;

const ADDRESS = {
  '@type': 'PostalAddress',
  streetAddress: 'Perna 4',
  addressLocality: 'Kućište',
  addressRegion: 'Dubrovnik-Neretva County',
  postalCode: '20250',
  addressCountry: 'HR'
};

const GEO = { '@type': 'GeoCoordinates', latitude: 42.977, longitude: 17.115 };

const TELEPHONE = '+385 99 380 5141';
const EMAIL = 'info@visit-eva-orebic.com';

const SAME_AS = [
  'https://www.instagram.com/eva_apartman',
  'https://www.facebook.com/share/1DRSekVoWj/'
];

const AMENITIES = [
  'Wi-Fi', 'Air conditioning', 'Heating', 'Private terrace', 'Free parking',
  'Fully equipped kitchen', 'Dishwasher', 'Washing machine', 'Microwave',
  'Fridge', 'Coffee machine', 'TV', 'Satellite TV', 'Netflix / HBO / IPTV',
  'Safe', 'Baby cot'
];

/* Localised one-line description of the property. */
const DESCRIPTION = {
  en: 'Holiday apartment in Kućište on the Pelješac peninsula, Croatia. Steps from the Adriatic with a private terrace, air conditioning, Wi-Fi and a full kitchen.',
  hr: 'Apartman za odmor u Kućištu na poluotoku Pelješcu. Nekoliko koraka od Jadrana, s privatnom terasom, klimom, Wi-Fi-jem i potpuno opremljenom kuhinjom.',
  pl: 'Apartament wakacyjny w Kućište na półwyspie Pelješac w Chorwacji. Kilka kroków od Adriatyku, z prywatnym tarasem, klimatyzacją, Wi-Fi i w pełni wyposażoną kuchnią.',
  de: 'Ferienwohnung in Kućište auf der Halbinsel Pelješac, Kroatien. Wenige Schritte zur Adria, mit privater Terrasse, Klimaanlage, WLAN und voll ausgestatteter Küche.'
};

const LANG_TAG = { en: 'en', hr: 'hr', pl: 'pl', de: 'de' };

function abs(pathOrUrl) {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return SITE + (pathOrUrl.startsWith('/') ? pathOrUrl : '/' + pathOrUrl);
}

/* ── LodgingBusiness (the property itself) ───────────────────────────── */

/**
 * @param {object} opts
 * @param {string} opts.lang
 * @param {string} opts.url          canonical URL of the page carrying this node
 * @param {Array}  opts.reviews      [{ author, body }] scraped from the rendered page
 * @param {Array}  opts.images       absolute image URLs
 */
function lodgingBusiness({ lang, reviews, images }) {
  const node = {
    '@type': 'LodgingBusiness',
    '@id': BUSINESS_ID,
    name: 'Eva Apartman',
    description: DESCRIPTION[lang] || DESCRIPTION.en,
    url: SITE + '/',
    inLanguage: LANG_TAG[lang] || 'en',
    image: images,
    logo: abs('/images/Ap_Eva_logo_800x800px-transparent.png'),
    telephone: TELEPHONE,
    email: EMAIL,
    priceRange: '€75–€120',
    currenciesAccepted: 'EUR',
    address: ADDRESS,
    geo: GEO,
    hasMap: 'https://maps.google.com/maps?q=Apartman+Eva,+Perna+4,+Orebi%C4%87,+Croatia',
    sameAs: SAME_AS,
    checkinTime: '14:00',
    checkoutTime: '10:00',
    numberOfRooms: 2,
    petsAllowed: false,
    smokingAllowed: false,
    amenityFeature: AMENITIES.map(name => ({
      '@type': 'LocationFeatureSpecification', name, value: true
    })),
    /* `offers` is not a property of LodgingBusiness; `makesOffer` is. */
    makesOffer: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '75',
        minPrice: '75',
        maxPrice: '120',
        priceCurrency: 'EUR',
        unitCode: 'DAY',
        unitText: 'night'
      },
      itemOffered: { '@id': APARTMENT_ID }
    },
    /* The accommodation-specific facts belong on an Accommodation subtype. */
    containsPlace: {
      '@type': 'Apartment',
      '@id': APARTMENT_ID,
      name: 'Eva Apartman',
      numberOfRooms: 2,
      numberOfBedrooms: 2,
      numberOfBathroomsTotal: 2,
      floorSize: { '@type': 'QuantitativeValue', value: 67, unitCode: 'MTK' },
      occupancy: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 5 },
      amenityFeature: AMENITIES.map(name => ({
        '@type': 'LocationFeatureSpecification', name, value: true
      }))
    },
    potentialAction: {
      '@type': 'ReserveAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: SITE + (lang === 'en' ? '/contact.html' : `/${lang}/contact.html`),
        actionPlatform: [
          'https://schema.org/DesktopWebPlatform',
          'https://schema.org/MobileWebPlatform'
        ]
      },
      result: { '@type': 'LodgingReservation', name: 'Booking enquiry' }
    }
  };

  if (reviews && reviews.length) {
    node.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: RATING,
      reviewCount: REVIEW_COUNT,
      bestRating: '5',
      worstRating: '1'
    };
    node.review = reviews.map(r => {
      const review = {
        '@type': 'Review',
        author: { '@type': 'Person', name: r.author },
        reviewRating: {
          '@type': 'Rating', ratingValue: '5', bestRating: '5', worstRating: '1'
        },
        publisher: { '@type': 'Organization', name: 'Google' }
      };
      if (r.body) review.reviewBody = r.body;
      return review;
    });
  }

  return node;
}

/* ── Breadcrumbs ─────────────────────────────────────────────────────── */

/** @param {Array} trail [{ name, url }] — url omitted on the final crumb. */
function breadcrumbs(trail) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, i) => {
      const item = { '@type': 'ListItem', position: i + 1, name: crumb.name };
      if (crumb.url) item.item = abs(crumb.url);
      return item;
    })
  };
}

/* ── Per-page graphs ─────────────────────────────────────────────────── */

function indexGraph({ lang, url, reviews, images }) {
  return [
    lodgingBusiness({ lang, url, reviews, images }),
    {
      '@type': 'WebSite',
      '@id': SITE + '/#website',
      url: SITE + '/',
      name: 'Eva Apartman',
      inLanguage: LANG_TAG[lang] || 'en',
      publisher: { '@id': ORG_ID }
    },
    {
      '@type': 'Organization',
      '@id': ORG_ID,
      name: 'Eva Apartman',
      url: SITE + '/',
      logo: abs('/images/Ap_Eva_logo_800x800px-transparent.png'),
      telephone: TELEPHONE,
      email: EMAIL,
      address: ADDRESS,
      sameAs: SAME_AS
    }
  ];
}

function galleryGraph({ lang, url, crumbs, photos, headline }) {
  return [
    breadcrumbs(crumbs),
    {
      '@type': 'ImageGallery',
      '@id': url + '#gallery',
      url,
      name: headline,
      inLanguage: LANG_TAG[lang] || 'en',
      about: { '@id': BUSINESS_ID },
      numberOfItems: photos.length,
      associatedMedia: photos.map(p => ({
        '@type': 'ImageObject',
        contentUrl: abs(p.src),
        thumbnailUrl: abs(p.thumb || p.src),
        caption: p.alt,
        representativeOfPage: false
      }))
    }
  ];
}

function locationGraph({ lang, url, crumbs, attractions }) {
  return [
    breadcrumbs(crumbs),
    {
      '@type': 'Place',
      '@id': url + '#place',
      name: 'Kućište, Pelješac',
      address: ADDRESS,
      geo: GEO,
      hasMap: 'https://maps.google.com/maps?q=Apartman+Eva,+Perna+4,+Orebi%C4%87,+Croatia',
      containsPlace: { '@id': APARTMENT_ID }
    },
    {
      '@type': 'ItemList',
      '@id': url + '#attractions',
      name: 'Nearby beaches, restaurants and attractions',
      inLanguage: LANG_TAG[lang] || 'en',
      numberOfItems: attractions.length,
      itemListElement: attractions.map((a, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': a.type,
          name: a.name,
          description: a.description,
          ...(a.image ? { image: abs(a.image) } : {})
        }
      }))
    }
  ];
}

function contactGraph({ lang, url, crumbs, name }) {
  return [
    breadcrumbs(crumbs),
    {
      '@type': 'ContactPage',
      '@id': url + '#contactpage',
      url,
      name,
      inLanguage: LANG_TAG[lang] || 'en',
      about: { '@id': BUSINESS_ID },
      mainEntity: {
        '@type': 'LodgingBusiness',
        '@id': BUSINESS_ID,
        name: 'Eva Apartman',
        telephone: TELEPHONE,
        email: EMAIL,
        address: ADDRESS,
        url: SITE + '/'
      }
    }
  ];
}

/** Wrap a list of nodes in a single @graph document. */
function graph(nodes) {
  return { '@context': 'https://schema.org', '@graph': nodes };
}

module.exports = {
  SITE, RATING, REVIEW_COUNT,
  graph, breadcrumbs,
  indexGraph, galleryGraph, locationGraph, contactGraph
};
