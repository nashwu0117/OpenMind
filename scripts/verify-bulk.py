import json,re
import os
from pathlib import Path
import pymupdf as fitz
folder=Path(os.environ.get('OPENMIND_QA_DIR','artifacts/phase2'))
if (folder/'bulk-plan.json').exists():
    plan=json.loads((folder/'bulk-plan.json').read_text());pdf=folder/'desktop-1000-branches.pdf'
else:
    plan=json.loads((folder/'performance.json').read_text());pdf=folder/'1000-node-outline.pdf'
doc=fitz.open(pdf);assert len(doc)==plan.get('pages',plan.get('outlinePages'))
labels={int(x) for page in doc for x in re.findall(r'節點\s+(\d+)',page.get_text())}
assert labels.issuperset(range(1,1000)),set(range(1,1000))-labels
body_top=(12*96/25.4+24)*.75;minimum=float('inf');programs=set();topic_lines=0
for page in doc:
    width=plan.get('widthMM',plan.get('paperMM',[None,None])[0]);height=plan.get('heightMM',plan.get('paperMM',[None,None])[1])
    assert abs(page.rect.width-width/25.4*72)<1 and abs(page.rect.height-height/25.4*72)<1
    for font in page.get_fonts():
        if 'NotoSansTC' in font[3]:
            assert font[2]=='Type0' and len(doc.extract_font(font[0])[3])>1000
            programs.add(font[0])
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines',[]):
            for span in line['spans']:
                x0,y0,x1,y1=span['bbox'];assert x0>=-1 and y0>=-1 and x1<=page.rect.width+1 and y1<=page.rect.height+1
            line_text=''.join(s['text'] for s in line['spans'])
            if line['bbox'][1]>=body_top-2 and re.search(r'節點\s+\d+',line_text) and not any(marker in line_text for marker in ('分支續頁','接續前頁')):
                topic_lines+=1;minimum=min(minimum,min(s['size'] for s in line['spans']))
assert topic_lines>=999,topic_lines
assert minimum>=10,minimum
report={'pages':len(doc),'all_999_labels_present':True,'topic_label_lines':topic_lines,'minimum_measured_main_topic_pt':minimum,'embedded_noto_programs':len(programs),'geometry_passed':True}
(folder/'bulk-verification.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
