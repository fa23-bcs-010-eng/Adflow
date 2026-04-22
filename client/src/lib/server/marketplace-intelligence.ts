type ListingInput = {
  title?: string | null;
  description?: string | null;
  price?: number | null;
  category?: string | null;
  city?: string | null;
  mediaCount?: number;
};

const HIGH_RISK_WORDS = [
  'guaranteed profit',
  '100% original no proof',
  'no documents',
  'whatsapp only advance payment',
  'crypto only',
  'wire money now',
  'urgent payment first',
];

const CATEGORY_PRICE_RANGES: Record<string, { min: number; max: number; typical: number }> = {
  mobiles: { min: 15000, max: 450000, typical: 120000 },
  vehicles: { min: 300000, max: 9000000, typical: 2400000 },
  laptops: { min: 45000, max: 650000, typical: 210000 },
  property: { min: 50000, max: 50000000, typical: 8500000 },
  electronics: { min: 10000, max: 600000, typical: 160000 },
  jobs: { min: 30000, max: 450000, typical: 95000 },
};

export function scoreListingQuality(input: ListingInput) {
  const title = String(input.title || '').trim();
  const description = String(input.description || '').trim();
  const category = String(input.category || '').toLowerCase();
  const mediaCount = Number(input.mediaCount || 0);

  let qualityScore = 35;
  const notes: string[] = [];

  if (title.length >= 12) qualityScore += 18;
  else notes.push('Title is short and could be more descriptive.');

  if (description.length >= 80) qualityScore += 22;
  else notes.push('Description is short and may reduce buyer trust.');

  if (mediaCount >= 3) qualityScore += 15;
  else if (mediaCount > 0) qualityScore += 8;
  else notes.push('Add product photos to improve trust and conversion.');

  if (input.price && input.price > 0) qualityScore += 10;
  else notes.push('Listing price is missing.');

  if (category && CATEGORY_PRICE_RANGES[category]) qualityScore += 5;

  return {
    quality_score: Math.max(0, Math.min(100, qualityScore)),
    notes,
  };
}

export function suggestPriceRange(input: ListingInput) {
  const category = String(input.category || '').toLowerCase();
  const range = CATEGORY_PRICE_RANGES[category] || { min: 10000, max: 1000000, typical: 150000 };
  const quality = scoreListingQuality(input).quality_score;
  const spread = Math.max(range.typical * 0.18, 5000);
  const qualityAdjustment = quality >= 75 ? 1.08 : quality <= 45 ? 0.92 : 1;
  const suggested = Math.round(range.typical * qualityAdjustment);

  return {
    suggested_price: suggested,
    suggested_price_min: Math.max(range.min, Math.round(suggested - spread)),
    suggested_price_max: Math.min(range.max, Math.round(suggested + spread)),
  };
}

export function scoreFraudRisk(input: ListingInput) {
  const text = `${input.title || ''} ${input.description || ''}`.toLowerCase();
  let risk = 8;
  const reasons: string[] = [];

  for (const phrase of HIGH_RISK_WORDS) {
    if (text.includes(phrase)) {
      risk += 20;
      reasons.push(`Contains high-risk phrase: "${phrase}"`);
    }
  }

  if (!input.price || input.price <= 0) {
    risk += 8;
    reasons.push('Missing or zero price.');
  }

  const category = String(input.category || '').toLowerCase();
  const range = CATEGORY_PRICE_RANGES[category];
  if (range && input.price) {
    if (input.price < range.min * 0.35) {
      risk += 25;
      reasons.push('Price looks unusually low for the category.');
    }
    if (input.price > range.max * 1.8) {
      risk += 14;
      reasons.push('Price looks unusually high for the category.');
    }
  }

  if (String(input.description || '').trim().length < 25) {
    risk += 10;
    reasons.push('Very short description.');
  }

  if (Number(input.mediaCount || 0) === 0) {
    risk += 12;
    reasons.push('No media attached.');
  }

  return {
    risk_score: Math.max(0, Math.min(100, risk)),
    reasons,
  };
}

export function autoModerationDecision(input: ListingInput) {
  const quality = scoreListingQuality(input);
  const fraud = scoreFraudRisk(input);

  let moderation_decision: 'approve' | 'review' | 'block' = 'approve';
  if (fraud.risk_score >= 70) moderation_decision = 'block';
  else if (fraud.risk_score >= 35 || quality.quality_score < 45) moderation_decision = 'review';

  const reasoning = [
    `Quality score: ${quality.quality_score}/100.`,
    `Risk score: ${fraud.risk_score}/100.`,
    ...quality.notes,
    ...fraud.reasons,
  ].join(' ');

  return {
    ...quality,
    ...fraud,
    moderation_decision,
    reasoning,
  };
}

export function estimateShipping(options: {
  price?: number | null;
  fromCity?: string | null;
  toCity?: string | null;
  category?: string | null;
}) {
  const price = Number(options.price || 0);
  const sameCity = String(options.fromCity || '').toLowerCase() === String(options.toCity || '').toLowerCase();
  const category = String(options.category || '').toLowerCase();

  let base = sameCity ? 350 : 650;
  if (category === 'property') base = 0;
  if (category === 'vehicles') base = sameCity ? 4500 : 18500;
  if (category === 'laptops' || category === 'mobiles' || category === 'electronics') base += Math.min(Math.round(price * 0.0025), 1800);

  const days = category === 'property' ? 0 : sameCity ? 1 : category === 'vehicles' ? 5 : 3;

  return {
    provider: category === 'property' ? 'No shipping required' : 'Adflow Express',
    estimated_cost: Math.max(0, Math.round(base)),
    estimated_delivery_days: days,
    route_type: sameCity ? 'local' : 'intercity',
  };
}

export function riskBand(score: number) {
  if (score >= 70) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}
