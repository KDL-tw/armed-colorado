import { describe, test } from 'node:test';
import assert from 'node:assert';
import type { PageSponsor } from './sponsor-links';
import {
  splitSponsorString,
  parseSponsorToken,
  extractPageSponsors,
  resolveSponsorLinks,
} from './sponsor-links';

// -----------------------------------------------------------------------------
// splitSponsorString Tests (6 test cases)
// -------------------------------------------------------------------------

describe('splitSponsorString', () => {
  test('comma + and list', () => {
    const result = splitSponsorString('Rep. John Doe, Sen. Jane Smith');
    assert.deepStrictEqual(
      result,
      ['Rep. John Doe', 'Sen. Jane Smith']
    );
  });

  test('and between two prefixed names', () => {
    const result = splitSponsorString('Rep. John Doe and Sen. Jane Smith');
    assert.deepStrictEqual(
      result,
      ['Rep. John Doe', 'Sen. Jane Smith']
    );
  });

  test('slash separator', () => {
    const result = splitSponsorString('Rep. John Doe/Sen. Jane Smith');
    assert.deepStrictEqual(
      result,
      ['Rep. John Doe', 'Sen. Jane Smith']
    );
  });

  test('ampersand separator', () => {
    const result = splitSponsorString('Rep. John Doe & Sen. Jane Smith');
    assert.deepStrictEqual(
      result,
      ['Rep. John Doe', 'Sen. Jane Smith']
    );
  });

  test('single name unchanged', () => {
    const result = splitSponsorString('Rep. John Doe');
    assert.deepStrictEqual(
      result,
      ['Rep. John Doe']
    );
  });

  test('mixed and + commas + reversed initial', () => {
    const result = splitSponsorString('Rep. J. Doe, Sen. Jane Smith and Rep. A. Johnson');
    assert.deepStrictEqual(
      result,
      ['Rep. J. Doe', 'Sen. Jane Smith', 'Rep. A. Johnson']
    );
  });
});

// -------------------------------------------------------------------------
// parseSponsorToken Tests (4 test cases)
// -------------------------------------------------------------------------

describe('parseSponsorToken', () => {
  test('Rep + surname only', () => {
    const result = parseSponsorToken('Rep. John Doe');
    assert.deepStrictEqual(result, { chamber: 'House', surname: 'Doe' });
  });

  test('Sen + initial + surname', () => {
    const result = parseSponsorToken('Sen. J. Smith');
    assert.deepStrictEqual(result, { chamber: 'Senate', surname: 'Smith' });
  });

  test('no chamber reversed initial', () => {
    const result = parseSponsorToken('John Doe');
    assert.deepStrictEqual(result, { chamber: null, surname: 'Doe' });
  });

  test('no chamber first + last', () => {
    const result = parseSponsorToken('Jane Smith');
    assert.deepStrictEqual(result, { chamber: null, surname: 'Smith' });
  });

  test('Rep + initial + surname', () => {
    const result = parseSponsorToken('Rep. J. Johnson');
    assert.deepStrictEqual(result, { chamber: 'House', surname: 'Johnson' });
  });
});

// -------------------------------------------------------------------------
// extractPageSponsors Tests (1 test case)
// -------------------------------------------------------------------------

describe('extractPageSponsors', () => {
  test('link-primary + ps-link anchors, deduped by slug', () => {
    const html = `
      <a href="/legislators/house-john-doe" class="link-primary">Rep. John Doe</a>
      <a href="/legislators/senate-jane-smith" class="ps-link">Sen. Jane Smith</a>
      <a href="/legislators/house-john-doe">Duplicate link</a>
    `;
    const result = extractPageSponsors(html);
    assert.deepStrictEqual(result, [
      { chamber: 'House', surname: 'Doe', displayName: 'Rep. John Doe', slug: 'house-john-doe' },
      { chamber: 'Senate', surname: 'Smith', displayName: 'Sen. Jane Smith', slug: 'senate-jane-smith' },
    ]);
  });
});

// -------------------------------------------------------------------------
// resolveSponsorLinks Tests (2 test cases)
// -------------------------------------------------------------------------

describe('resolveSponsorLinks', () => {
  test('chamber+surname match', () => {
    const catalogSponsors = ['Rep. John Doe'];
    const pageSponsors: PageSponsor[] = [
      { chamber: 'House', surname: 'Doe', displayName: 'Rep. John Doe', slug: 'house-john-doe' },
    ];
    const result = resolveSponsorLinks(catalogSponsors, pageSponsors);
    assert.deepStrictEqual(result, [
      { name: 'Rep. John Doe', slug: 'house-john-doe' },
    ]);
  });

  test('chamber disambiguates same surname', () => {
    const catalogSponsors = ['Rep. John Doe'];
    const pageSponsors: PageSponsor[] = [
      { chamber: 'House', surname: 'Doe', displayName: 'Rep. John Doe', slug: 'house-john-doe' },
      { chamber: 'Senate', surname: 'Doe', displayName: 'Sen. John Doe', slug: 'senate-john-doe' },
    ];
    const result = resolveSponsorLinks(catalogSponsors, pageSponsors);
    assert.deepStrictEqual(result, [
      { name: 'Rep. John Doe', slug: 'house-john-doe' },
    ]);
  });

  test('no chamber + ambiguous surname -> null', () => {
    const catalogSponsors = ['John Doe'];
    const pageSponsors: PageSponsor[] = [
      { chamber: 'House', surname: 'Doe', displayName: 'Rep. John Doe', slug: 'house-john-doe' },
      { chamber: 'Senate', surname: 'Doe', displayName: 'Sen. John Doe', slug: 'senate-john-doe' },
    ];
    const result = resolveSponsorLinks(catalogSponsors, pageSponsors);
    assert.deepStrictEqual(result, [
      { name: 'John Doe', slug: null },
    ]);
  });

  test('no chamber + unique surname -> resolved', () => {
    const catalogSponsors = ['John Smith'];
    const pageSponsors: PageSponsor[] = [
      { chamber: 'House', surname: 'Smith', displayName: 'Rep. John Smith', slug: 'house-john-smith' },
    ];
    const result = resolveSponsorLinks(catalogSponsors, pageSponsors);
    assert.deepStrictEqual(result, [
      { name: 'John Smith', slug: 'house-john-smith' },
    ]);
  });

  test('multi-person string splits and resolves each', () => {
    const catalogSponsors = ['Rep. John Doe, Sen. Jane Smith'];
    const pageSponsors: PageSponsor[] = [
      { chamber: 'House', surname: 'Doe', displayName: 'Rep. John Doe', slug: 'house-john-doe' },
      { chamber: 'Senate', surname: 'Smith', displayName: 'Sen. Jane Smith', slug: 'senate-jane-smith' },
    ];
    const result = resolveSponsorLinks(catalogSponsors, pageSponsors);
    assert.deepStrictEqual(result, [
      { name: 'Rep. John Doe', slug: 'house-john-doe' },
      { name: 'Sen. Jane Smith', slug: 'senate-jane-smith' },
    ]);
  });

  test('unmatched name -> null', () => {
    const catalogSponsors = ['Rep. Unknown Person'];
    const pageSponsors: PageSponsor[] = [
      { chamber: 'House', surname: 'Doe', displayName: 'Rep. John Doe', slug: 'house-john-doe' },
    ];
    const result = resolveSponsorLinks(catalogSponsors, pageSponsors);
    assert.deepStrictEqual(result, [
      { name: 'Rep. Unknown Person', slug: null },
    ]);
  });
});
