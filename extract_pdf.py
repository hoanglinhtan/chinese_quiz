"""
Extract vocabulary from all HSK txt and pdf files.
Generates separate JS arrays for each level and a combined array.
"""
import json
import re
import pdfplumber

def parse_txt_file(filepath, level):
    """Parse HSK txt files with blank-line-separated fields."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.strip().split('\n')
    
    # Clean lines - remove empty ones, strip whitespace
    clean_lines = []
    for line in lines:
        stripped = line.strip()
        if stripped:
            clean_lines.append(stripped)
    
    # Skip header lines until first numeric STT
    start_idx = 0
    for i, line in enumerate(clean_lines):
        if line == 'STT' or line.startswith('STT'):
            start_idx = i + 1
            while start_idx < len(clean_lines) and not clean_lines[start_idx].isdigit():
                start_idx += 1
            break
    
    words = []
    i = start_idx
    
    while i < len(clean_lines):
        if not clean_lines[i].isdigit():
            i += 1
            continue
        
        stt = int(clean_lines[i])
        i += 1
        
        if i >= len(clean_lines): break
        chinese = clean_lines[i]
        i += 1
        
        if i >= len(clean_lines): break
        pinyin = clean_lines[i]
        i += 1
        
        if i >= len(clean_lines): break
        word_type = clean_lines[i]
        i += 1
        
        if i >= len(clean_lines): break
        meaning = clean_lines[i]
        i += 1
        
        # Skip remaining lines (examples) until next number
        while i < len(clean_lines) and not clean_lines[i].isdigit():
            i += 1
        
        # Clean chinese field - remove parenthetical pinyin
        chinese_clean = chinese
        paren_match = re.match(r'^(.+?)\s*[（(](.+?)[）)]$', chinese)
        if paren_match:
            chinese_clean = paren_match.group(1).strip()
        
        meaning_clean = meaning.strip()
        
        if chinese_clean and meaning_clean:
            words.append({
                'chinese': chinese_clean,
                'pinyin': pinyin,
                'type': word_type,
                'meaning': meaning_clean,
                'level': level
            })
    
    return words


def extract_pdf(filepath, level):
    """Extract vocabulary from HSK PDF files using table extraction."""
    words = []
    seen = set()
    
    # First pass: detect column count from first table
    num_cols = None
    with pdfplumber.open(filepath) as pdf:
        for page in pdf.pages[:5]:
            tables = page.extract_tables()
            if tables and tables[0]:
                for row in tables[0]:
                    if row and row[0]:
                        try:
                            int(row[0].strip())
                            num_cols = len(row)
                            break
                        except ValueError:
                            # Check if it's a header row
                            if 'STT' in str(row[0]):
                                num_cols = len(row)
                            continue
                if num_cols:
                    break
    
    print(f"  Detected {num_cols} columns in {filepath}")
    
    # HSK4: 5 cols = [STT, Chinese, Pinyin, Meaning, Example]
    # HSK5: 6 cols = [STT, Chinese, Pinyin, Type, Meaning, Example]
    has_type_col = (num_cols == 6)
    
    with pdfplumber.open(filepath) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            if not tables:
                # Try text-based extraction for pages without tables
                text = page.extract_text()
                if text:
                    parse_text_entries(text, words, seen, level, has_type_col)
                continue
            
            for table in tables:
                for row in table:
                    if not row or not row[0]:
                        continue
                    try:
                        no = int(row[0].strip())
                    except (ValueError, AttributeError):
                        continue
                    
                    if no in seen:
                        continue
                    seen.add(no)
                    
                    chinese = (row[1] or '').strip().replace('\n', '')
                    pinyin = (row[2] or '').strip().replace('\n', ' ')
                    
                    if has_type_col:
                        word_type = (row[3] or '').strip().replace('\n', ' ')
                        meaning = (row[4] or '').strip().replace('\n', ', ')
                    else:
                        word_type = ''
                        meaning = (row[3] or '').strip().replace('\n', ', ')
                    
                    # Clean meaning
                    meaning = meaning.strip().rstrip(',')
                    
                    if chinese and meaning:
                        words.append({
                            'chinese': chinese,
                            'pinyin': pinyin,
                            'type': word_type,
                            'meaning': meaning,
                            'level': level
                        })
    
    return words


def parse_text_entries(text, words, seen, level, has_type_col):
    """Parse entries from text when tables aren't available."""
    lines = text.strip().split('\n')
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        parts = line.split()
        if parts and parts[0].isdigit():
            no = int(parts[0])
            if no not in seen:
                seen.add(no)
                rest = line[len(parts[0]):].strip()
                
                # Extract chinese characters
                chinese = ''
                idx = 0
                while idx < len(rest) and (0x4E00 <= ord(rest[idx]) <= 0x9FFF or rest[idx] in '·／'):
                    chinese += rest[idx]
                    idx += 1
                rest = rest[idx:].strip()
                
                # Extract pinyin (has tone marks)
                tone_chars = 'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ'
                tokens = rest.split()
                pinyin_tokens = []
                meaning_start = 0
                for j, tok in enumerate(tokens):
                    clean = tok.rstrip(',;')
                    has_tone = any(c in tone_chars for c in clean)
                    if has_tone or (clean.islower() and len(clean) <= 6 and j < 4):
                        pinyin_tokens.append(tok)
                    else:
                        meaning_start = j
                        break
                else:
                    meaning_start = len(tokens)
                
                pinyin = ' '.join(pinyin_tokens)
                meaning_parts = ' '.join(tokens[meaning_start:])
                
                # Take meaning up to first parenthesis or Chinese char
                meaning = ''
                for ch in meaning_parts:
                    if ch == '(' or (0x4E00 <= ord(ch) <= 0x9FFF):
                        break
                    meaning += ch
                meaning = meaning.strip().rstrip(',;')
                
                # Remove word type prefixes
                for wt in ['Thán từ', 'Động từ', 'Danh từ', 'Tính từ', 'Trạng từ', 'N/']:
                    meaning = meaning.replace(wt, '').strip()
                
                if chinese and meaning:
                    words.append({
                        'chinese': chinese,
                        'pinyin': pinyin,
                        'type': '',
                        'meaning': meaning,
                        'level': level
                    })
        i += 1


def deduplicate_words(words):
    """Remove duplicate entries by chinese characters within same level."""
    seen = set()
    unique = []
    for w in words:
        key = w['chinese']
        if key not in seen:
            seen.add(key)
            unique.append(w)
    return unique


def main():
    all_data = {}
    
    # Parse HSK2 txt
    print("Parsing hsk2.txt...")
    hsk2 = parse_txt_file('resources/hsk2.txt', 2)
    hsk2 = deduplicate_words(hsk2)
    print(f"  HSK2: {len(hsk2)} words")
    all_data['hsk2'] = hsk2
    
    # Parse HSK3 txt
    print("Parsing hsk3.txt...")
    hsk3 = parse_txt_file('resources/hsk3.txt', 3)
    hsk3 = deduplicate_words(hsk3)
    print(f"  HSK3: {len(hsk3)} words")
    all_data['hsk3'] = hsk3
    
    # Parse HSK4 pdf
    print("Parsing hsk4.pdf...")
    hsk4 = extract_pdf('resources/hsk4.pdf', 4)
    hsk4 = deduplicate_words(hsk4)
    print(f"  HSK4: {len(hsk4)} words")
    all_data['hsk4'] = hsk4
    
    # Parse HSK5 pdf
    print("Parsing hsk5.pdf...")
    hsk5 = extract_pdf('resources/hsk5.pdf', 5)
    hsk5 = deduplicate_words(hsk5)
    print(f"  HSK5: {len(hsk5)} words")
    all_data['hsk5'] = hsk5
    
    # Print samples
    for level, words in all_data.items():
        print(f"\n{level} samples:")
        for w in words[:3]:
            print(f"  {w['chinese']} | {w['pinyin']} | {w['meaning']}")
    
    # Generate JS file
    js_parts = []
    for level in ['hsk2', 'hsk3', 'hsk4', 'hsk5']:
        var_name = f'{level.upper()}_DATA'
        js_parts.append(f'const {var_name} = {json.dumps(all_data[level], ensure_ascii=False, indent=2)};')
    
    # Combined data for HSK5 "all" mode
    combined = []
    for level in ['hsk2', 'hsk3', 'hsk4', 'hsk5']:
        combined.extend(all_data[level])
    combined = deduplicate_words(combined)
    js_parts.append(f'const ALL_DATA = {json.dumps(combined, ensure_ascii=False, indent=2)};')
    
    # Data map for easy access
    js_parts.append('''const DATA_MAP = {
  'hsk2': HSK2_DATA,
  'hsk3': HSK3_DATA,
  'hsk4': HSK4_DATA,
  'hsk5': ALL_DATA
};''')
    
    js_content = '\n\n'.join(js_parts) + '\n'
    
    with open('vocab_data.js', 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    total = sum(len(v) for v in all_data.values())
    combined_unique = len(combined)
    print(f"\nTotal entries: {total}")
    print(f"Combined unique (all levels): {combined_unique}")
    print(f"Written to vocab_data.js ({len(js_content)} bytes)")


if __name__ == '__main__':
    main()
