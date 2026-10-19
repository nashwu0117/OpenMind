"""Run with Python + PyMuPDF (pip install pymupdf) after desktop/E2E tests."""
import json
from pathlib import Path
import pymupdf as fitz
import re

reports=[]
for name,phrase in [('browser-cjk.pdf','離線繁體中文 PDF 驗收'),('desktop-cjk.pdf','桌面繁體中文 PDF 驗收')]:
    pdf=fitz.open(Path('artifacts')/name)
    assert len(pdf)==1, f'{name}: unexpected page count {len(pdf)}'
    page=pdf[0]
    assert abs(page.rect.width-210/25.4*72)<1, page.rect
    assert abs(page.rect.height-297/25.4*72)<1, page.rect
    text=page.get_text()
    assert phrase in text, f'{name}: Traditional Chinese not searchable: {text!r}'
    fonts=page.get_fonts(full=True)
    assert fonts
    embedded=[]
    for f in fonts:
        if f[2]=='Type3':
            # Chromium/PingFang embeds vector glyph programs instead of a TTF.
            # ToUnicode + CharProcs are the actual evidence, not a FontFile flag.
            kind,procs=pdf.xref_get_key(f[0],'CharProcs')
            refs=re.findall(r'(\d+) 0 R',procs)
            assert kind=='dict' and refs and '/ToUnicode' in pdf.xref_object(f[0])
            size=sum(len(pdf.xref_stream(int(x)) or b'') for x in refs)
            assert size>0
            embedded.append({'type':'Type3 vector glyph programs','embedded_bytes':size})
        else:
            size=len(pdf.extract_font(f[0])[3])
            assert size>0
            embedded.append({'name':f[3],'type':f[2],'embedded_bytes':size})
    phrase_line_found=False
    for block in page.get_text('dict')['blocks']:
        if 'lines' not in block: continue
        for line in block['lines']:
            line_text=''.join(s['text'] for s in line['spans'])
            if phrase in line_text:
                phrase_line_found=True
                assert all(s['size']>=10 for s in line['spans']), line
            for span in line['spans']:
                x0,y0,x1,y1=span['bbox']
                assert 0<=x0<x1<=page.rect.width+1, span
                assert 0<=y0<y1<=page.rect.height+1, span
    assert phrase_line_found
    page.get_pixmap(matrix=fitz.Matrix(1.2,1.2)).save(str(Path('artifacts')/name.replace('.pdf','-render.png')))
    reports.append({'file':name,'pages':len(pdf),'page_points':[page.rect.width,page.rect.height],'searchable_cjk':True,'fonts':embedded,'all_text_inside_page':True})
Path('artifacts/pdf-verification.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2))
print(json.dumps(reports,ensure_ascii=False,indent=2))
