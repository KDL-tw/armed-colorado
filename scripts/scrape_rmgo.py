#!/usr/bin/env python3
import json
import re

# Read the RMGO markdown file
with open('/home/noether/.hermes/cache/web/rmgo.org-60df06e2f2.md', 'r') as f:
    content = f.read()

def parse_sponsors(sponsors_html):
    """Parse sponsors from HTML content with <br> tags"""
    clean = sponsors_html.replace('**', '').replace('<br>', '\n').replace('<br/>', '\n').strip()
    return [s.strip() for s in clean.split('\n') if s.strip()]

def parse_subject(subject_html):
    """Extract subject text and URL from subject HTML - handles both [text](url) and link inside text"""
    text = subject_html
    urls = re.findall(r'\((https?://[^\)]+)\)', text)
    text = re.sub(r'\[([^\]]*)\]\([^)]+\)', r'\1', text)
    text = re.sub(r'\s+', ' ', text).strip()
    text = re.sub(r'\*\*', '', text)  # Remove bold markers
    text = re.sub(r'\[\s*\]', '', text)
    text = re.sub(r'^[\[\]]+', '', text)
    text = re.sub(r'[\[\]]+$', '', text)
    subject_url = urls[0] if urls else None
    return {'subject': text, 'subjectUrl': subject_url}

def normalize_status(status):
    """Normalize status values"""
    s = status.strip()
    if 'Signed' in s or 'Governor' in s:
        return 'Signed into Law'
    if 'Dead' in s or 'Died' in s or 'Com' in s:
        return 'Dead'
    if 'Out of Session' in s:
        return 'Out of Session'
    if 'Passed' in s:
        if 'House' in s:
            return 'Passed House'
        return 'Passed Senate'
    return s

def normalize_position(position):
    """Normalize position values"""
    p = position.lower().strip()
    if 'oppose' in p:
        return 'Oppose'
    if 'support' in p:
        return 'Support'
    if 'amend' in p:
        return 'Amend'
    if 'monitor' in p or 'monitoring' in p:
        return 'Monitor'
    return 'Oppose'

# Extract years from the content
years_data = {}

# Find all year headers first to get proper boundaries
year_headers = []
for year in range(2026, 1997, -1):
    year_str = str(year)
    year_header = f"{year_str} Bills - Colorado General Assembly"
    idx = content.find(year_header)
    if idx != -1:
        year_headers.append((year, idx, year_header))

# Sort by position in content (oldest first)
year_headers.sort(key=lambda x: x[1])

# Process each year
for i, (year, start_idx, year_header) in enumerate(year_headers):
    year_str = str(year)
    
    if i + 1 < len(year_headers):
        next_start = year_headers[i + 1][1]
    else:
        next_start = len(content)
    
    year_section = content[start_idx:next_start]
    
    # Parse bills from this year's section
    bills = []
    lines = year_section.split('\n')
    in_table = False
    num_cols = 7  # Default to 7 columns
    
    for line in lines:
        line = line.strip()
        
        # Detect table header
        if 'RMGO Position' in line or '**RMGO Position**' in line:
            in_table = True
            # Count columns to determine if this table has 6 or 7 columns
            header_cells = [c.strip() for c in line[1:-1].split('|')]
            num_cols = len(header_cells)
            continue
        
        if not in_table:
            continue
        
        # Skip separator row
        if line.startswith('| ---'):
            continue
        
        # Skip empty lines
        if not line.startswith('|'):
            continue
        
        # Parse table row - markdown format: | cell | cell | ...
        cells = [c.strip() for c in line[1:-1].split('|')]
        
        # Handle both 6-column (no enactment date) and 7-column tables
        if num_cols == 7 and len(cells) >= 7:
            position = normalize_position(cells[0])
            bill_number = cells[1].replace('**', '').strip()
            sponsors = parse_sponsors(cells[2])
            subject_data = parse_subject(cells[3])
            location = cells[4].strip()
            status = normalize_status(cells[5])
            enactment_date = cells[6].strip() if len(cells) > 6 else ''
            
            bill = {
                'position': position,
                'billNumber': bill_number,
                'sponsors': sponsors,
                'subject': subject_data['subject'],
                'subjectUrl': subject_data.get('subjectUrl'),
                'location': location,
                'status': status,
                'enactmentDate': enactment_date if enactment_date else None
            }
            bills.append(bill)
        elif num_cols == 6 and len(cells) >= 6:
            position = normalize_position(cells[0])
            bill_number = cells[1].replace('**', '').strip()
            sponsors = parse_sponsors(cells[2])
            subject_data = parse_subject(cells[3])
            location = cells[4].strip()
            status = normalize_status(cells[5])
            
            bill = {
                'position': position,
                'billNumber': bill_number,
                'sponsors': sponsors,
                'subject': subject_data['subject'],
                'subjectUrl': subject_data.get('subjectUrl'),
                'location': location,
                'status': status,
                'enactmentDate': None
            }
            bills.append(bill)
    
    print(f"Year {year_str} ({num_cols} cols): Found {len(bills)} bills")
    if bills:
        years_data[year_str] = bills

total_bills = sum(len(bills) for bills in years_data.values())
print(f"\n=== SUMMARY ===")
print(f"Years found: {len(years_data)}")
print(f"Total bills: {total_bills}")

output_path = '/home/noether/renhorne/armed-colorado/data/rmgo-scraped-bills-20260828.json'
with open(output_path, 'w') as f:
    json.dump({'years': years_data}, f, indent=2)

print(f"Saved to: {output_path}")

# Print sample
if '2026' in years_data and len(years_data['2026']) > 0:
    print("\nSample (first 2 bills from 2026):")
    print(json.dumps(years_data['2026'][:2], indent=2))

# Print year breakdown
print("\nYear breakdown:")
for year in sorted(years_data.keys(), reverse=True):
    print(f"  {year}: {len(years_data[year])} bills")
