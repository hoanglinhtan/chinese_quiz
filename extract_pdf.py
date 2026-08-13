import pdfplumber
import json
import re

def is_chinese_char(ch):
    cp = ord(ch)
    return (0x4E00 <= cp <= 0x9FFF or 0x3400 <= cp <= 0x4DBF or
            0x20000 <= cp <= 0x2A6DF)

def extract_hsk5():
    words = []
    seen_nos = set()
    
    with pdfplumber.open('resources/hsk5.pdf') as pdf:
        for page_idx, page in enumerate(pdf.pages):
            tables = page.extract_tables()
            if not tables:
                # Try fallback with text extraction for page 1
                text = page.extract_text()
                if not text or page_idx == 0:
                    # Page 0 is title, try text-based for page 1 (index 0 after skipping)
                    if page_idx == 0:
                        # Title page - also has data starting from row 1
                        # Try text-based extraction
                        if text:
                            lines = text.strip().split('\n')
                            current_entry = None
                            for line in lines:
                                line = line.strip()
                                parts = line.split()
                                if parts and parts[0].isdigit():
                                    no = int(parts[0])
                                    if no not in seen_nos:
                                        if current_entry:
                                            words.append(current_entry)
                                        # Parse from text
                                        current_entry = parse_text_line(line, no)
                                        if current_entry:
                                            seen_nos.add(no)
                            if current_entry:
                                words.append(current_entry)
                    continue
                    
            for table in tables:
                for row in table:
                    if not row or not row[0]:
                        continue
                    try:
                        no = int(row[0].strip())
                    except (ValueError, AttributeError):
                        continue
                    
                    if no in seen_nos:
                        continue
                    seen_nos.add(no)
                    
                    chinese = (row[1] or '').strip().replace('\n', '')
                    pinyin = (row[2] or '').strip().replace('\n', ' ')
                    word_type = (row[3] or '').strip().replace('\n', ' ')
                    meaning = (row[4] or '').strip().replace('\n', ', ')
                    
                    if chinese and meaning:
                        words.append({
                            'no': no,
                            'chinese': chinese,
                            'pinyin': pinyin,
                            'type': word_type,
                            'meaning': meaning
                        })
    
    # Handle first page entries via text if not captured by tables
    # Re-process page 1 (index 0) which has a different format
    if 1 not in seen_nos:
        with pdfplumber.open('resources/hsk5.pdf') as pdf:
            page = pdf.pages[0]
            text = page.extract_text()
            if text:
                lines = text.strip().split('\n')
                i = 0
                while i < len(lines):
                    line = lines[i].strip()
                    parts = line.split()
                    if parts and parts[0].isdigit():
                        no = int(parts[0])
                        if no not in seen_nos:
                            entry = parse_first_page_entry(lines, i)
                            if entry:
                                words.append(entry)
                                seen_nos.add(no)
                    i += 1
    
    words.sort(key=lambda x: x['no'])
    return words

def parse_first_page_entry(lines, start_idx):
    """Parse entry from the first page which has different formatting"""
    line = lines[start_idx].strip()
    parts = line.split()
    if not parts or not parts[0].isdigit():
        return None
    
    no = int(parts[0])
    rest = line[len(parts[0]):].strip()
    
    # Extract Chinese characters
    chinese = ''
    i = 0
    while i < len(rest) and (is_chinese_char(rest[i])):
        chinese += rest[i]
        i += 1
    rest = rest[i:].strip()
    
    # Rest contains pinyin + meaning mixed
    # Try to extract pinyin (has tone marks)
    tone_chars = 'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ'
    tokens = rest.split()
    pinyin_tokens = []
    meaning_start = 0
    
    for j, tok in enumerate(tokens):
        clean = tok.rstrip(',;')
        has_tone = any(c in tone_chars for c in clean)
        if has_tone or (clean.islower() and len(clean) <= 5 and j < 4):
            pinyin_tokens.append(tok)
        else:
            meaning_start = j
            break
    else:
        meaning_start = len(tokens)
    
    pinyin = ' '.join(pinyin_tokens)
    meaning_parts = ' '.join(tokens[meaning_start:])
    
    # Clean up meaning - remove example sentences
    meaning = meaning_parts.split('(')[0].strip().rstrip(',;')
    
    if chinese and meaning:
        return {
            'no': no,
            'chinese': chinese,
            'pinyin': pinyin,
            'type': '',
            'meaning': meaning
        }
    return None

def parse_text_line(line, no):
    """Generic text line parser"""
    rest = line[len(str(no)):].strip()
    chinese = ''
    i = 0
    while i < len(rest) and is_chinese_char(rest[i]):
        chinese += rest[i]
        i += 1
    rest = rest[i:].strip()
    
    tone_chars = 'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ'
    tokens = rest.split()
    pinyin_tokens = []
    
    for j, tok in enumerate(tokens):
        clean = tok.rstrip(',;')
        has_tone = any(c in tone_chars for c in clean)
        if has_tone or (clean.islower() and len(clean) <= 5 and j < 4):
            pinyin_tokens.append(tok)
        else:
            break
    
    pinyin = ' '.join(pinyin_tokens)
    meaning = rest[len(pinyin):].strip()
    # Take only up to first parenthesis (remove examples)
    meaning = meaning.split('(')[0].strip().rstrip(',;')
    # Remove word type prefixes
    for wt in ['Thán từ', 'Động từ', 'Danh từ', 'Tính từ', 'Trạng từ']:
        meaning = meaning.replace(wt, '').strip()
    
    if chinese and meaning:
        return {
            'no': no,
            'chinese': chinese,
            'pinyin': pinyin,
            'type': '',
            'meaning': meaning
        }
    return None

words = extract_hsk5()
print(f"Total words extracted: {len(words)}")

# Verify continuity
nos = [w['no'] for w in words]
print(f"Range: {min(nos)} - {max(nos)}")
missing = [i for i in range(1, max(nos)+1) if i not in nos]
if missing:
    print(f"Missing: {missing[:20]}...")
else:
    print("No missing entries!")

# Print samples
for w in words[:10]:
    print(f"{w['no']:4d} | {w['chinese']:6s} | {w['pinyin']:15s} | {w['meaning']}")
print("...")
for w in words[-5:]:
    print(f"{w['no']:4d} | {w['chinese']:6s} | {w['pinyin']:15s} | {w['meaning']}")

# Save to JSON
with open('hsk5_data.json', 'w', encoding='utf-8') as f:
    json.dump(words, f, ensure_ascii=False, indent=2)

print(f"\nSaved {len(words)} words to hsk5_data.json")
