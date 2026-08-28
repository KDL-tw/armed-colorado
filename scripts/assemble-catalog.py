#!/usr/bin/env python3
"""Assemble gun bill catalog from RMGO scraped data."""

import json
from datetime import datetime


def generate_summary(bill: dict) -> str:
    """Generate a 4-sentence summary for a bill."""
    bill_number = bill['billNumber']
    subject = bill['subject'].replace('**', '')
    position = bill['position'].lower()
    status = bill['status']
    location = bill['location']
    enactment = bill.get('enactmentDate') or 'TBD'

    sentence1 = f"{bill_number} is a {position} bill that {subject.lower()}."
    sentence2 = f"The bill {location.lower()} with a status of {status.lower()}."
    
    impact = "strengthens" if position == "support" else "threatens" if position == "oppose" else "modifies"
    sentence3 = f"From a 2A perspective, this bill {impact} Second Amendment rights in Colorado."
    
    sentence4 = f"The bill is currently {status.lower()} and would take effect {enactment} if enacted."

    return f"{sentence1} {sentence2} {sentence3} {sentence4}"


def main():
    # Load scraped RMGO data
    with open('data/rmgo-scraped-bills-20260828.json', 'r') as f:
        rmgo_data = json.load(f)

    print(f"Loaded RMGO data with {len(rmgo_data['years'])} years")

    # Count total bills
    total_bills = sum(len(bills) for bills in rmgo_data['years'].values())
    print(f"Total bills: {total_bills}")

    # Assemble catalog (reverse chronological order)
    catalog = []
    for year_str in sorted(rmgo_data['years'].keys(), reverse=True):
        year = int(year_str)
        bills = rmgo_data['years'][year_str]
        
        catalog_bills = []
        for rmgo_bill in bills:
            title = rmgo_bill['subject'].replace('**', '')
            summary = generate_summary(rmgo_bill)
            
            catalog_bills.append({
                'billNumber': rmgo_bill['billNumber'],
                'title': title,
                'summary': summary,
                'position': rmgo_bill['position'],
                'status': rmgo_bill['status'],
                'sponsors': rmgo_bill['sponsors'],
                'location': rmgo_bill['location'],
                'enactmentDate': rmgo_bill.get('enactmentDate'),
                'officialUrl': rmgo_bill.get('subjectUrl')
            })
        
        catalog.append({'year': year, 'bills': catalog_bills})

    print(f"Assembled catalog with {len(catalog)} years")

    # Save catalog
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    output_path = f'data/gun-bill-catalog-{timestamp}.json'
    with open(output_path, 'w') as f:
        json.dump(catalog, f, indent=2)
    print(f"Saved catalog to {output_path}")

    # Show summary
    for year in catalog:
        print(f"Year {year['year']}: {len(year['bills'])} bills")


if __name__ == '__main__':
    main()
