import json,re
from pathlib import Path
import pymupdf as fitz
folder=Path('artifacts/phase2');plan=json.loads((folder/'bulk-plan.json').read_text())
doc=fitz.open(folder/'desktop-1000-branches.pdf');assert len(doc)==plan['pages']
labels={int(x) for page in doc for x in re.findall(r'節點\s+(\d+)',page.get_text())}
assert labels.issuperset(range(1,1000)),set(range(1,1000))-labels
body_top=(12*96/25.4+24)*.75; minimum=1000;programs=set()
for page in doc:
    assert abs(page.rect.width-plan['widthMM']/25.4*72)<1 and abs(page.rect.height-plan['heightMM']/25.4*72)<1
    for font in page.get_fonts():
        if 'NotoSansTC' in font[3]:
            assert font[2]=='Type0' and len(doc.extract_font(font[0])[3])>1000
            programs.add(font[0])
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines',[]):
            for span in line['spans']:
                x0,y0,x1,y1=span['bbox'];assert x0>=-1 and y0>=-1 and x1<=page.rect.width+1 and y1<=page.rect.height+1
            if line['bbox'][1]>=body_top-2 and re.match(r'^節點\s+\d+',''.join(s['text'] for s in line['spans'])):
                minimum=min(minimum,min(s['size'] for s in line['spans']))
assert minimum>=10,minimum
report={'pages':len(doc),'all_999_labels_present':True,'minimum_measured_main_topic_pt':minimum,'embedded_noto_programs':len(programs),'geometry_passed':True}
(folder/'bulk-verification.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
