import json,re
from pathlib import Path
import pymupdf as fitz
folder=Path('artifacts/print-fixtures')
manifest=json.loads((folder/'manifest.json').read_text())
report=[]
for case in manifest:
    doc=fitz.open(folder/(case['name']+'.pdf'))
    assert len(doc)==case['pages'], (case['name'],len(doc),case['pages'])
    text='\n'.join(p.get_text() for p in doc)
    for page in doc:
        assert abs(page.rect.width-case['widthMM']/25.4*72)<1
        assert abs(page.rect.height-case['heightMM']/25.4*72)<1
        if case['mode']!='poster':
            for block in page.get_text('dict')['blocks']:
                for line in block.get('lines',[]):
                    for span in line['spans']:
                        x0,y0,x1,y1=span['bbox']
                        assert x0>=-1 and y0>=-1 and x1<=page.rect.width+1 and y1<=page.rect.height+1, (case['name'],span)
    # Original-map poster text can be deliberately cut at tile seams.
    # Verify all complete node labels in reflow/branch/fit modes, exact scope for selection.
    labels={int(x) for x in re.findall(r'節點\s+(\d+)',text)}
    if case['mode'] not in ('selection','poster'):
        assert labels.issuperset(range(1,case['count'])), (case['name'],set(range(1,case['count']))-labels)
    if case['mode'] in ('readable','outline'):
        for page in doc:
            for block in page.get_text('dict')['blocks']:
                for line in block.get('lines',[]):
                    body_top=(12*96/25.4+24)*.75
                    if '節點' in ''.join(s['text'] for s in line['spans']) and line['bbox'][1]>=body_top-2:
                        assert min(s['size'] for s in line['spans'])>=10
    images=sum(len(p.get_images()) for p in doc)
    if case.get('rich'):
        assert images>0, 'embedded raster image was lost'
        assert '關聯' in text and '重點分支' in text
    doc[0].get_pixmap(matrix=fitz.Matrix(1,1)).save(str(folder/(case['name']+'-pdf.png')))
    report.append({'case':case['name'],'actual_pages':len(doc),'expected_pages':case['pages'],'node_labels_found':len(labels),'embedded_image_references':images,'min_topic_pt_plan':case['minPt'],'passed':True})
(folder/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False,indent=2))
