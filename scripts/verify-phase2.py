import json, re, struct, sys
from pathlib import Path
import pymupdf as fitz

folder=Path('artifacts/phase2')
manifest=json.loads((folder/'manifest.json').read_text())
pdf_name=sys.argv[1] if len(sys.argv)>1 else 'branches-cjk-relations.pdf'
doc=fitz.open(folder/pdf_name)
assert len(doc)==manifest['pages']
text='\n'.join(page.get_text() for page in doc)
labels={int(x) for x in re.findall(r'節點\s+(\d+)',text)}
assert labels.issuperset(range(1,80)), set(range(1,80))-labels
searchable=re.sub(r'\s+','',text)
assert '臺灣繁體中文印刷驗證' in searchable and '跨頁審核與依賴關係' in searchable
fonts={}
for page in doc:
    assert abs(page.rect.width-manifest['widthMM']/25.4*72)<1
    assert abs(page.rect.height-manifest['heightMM']/25.4*72)<1
    for font in page.get_fonts():
        if 'NotoSansTC' not in font[3]: continue
        assert font[2]=='Type0', font
        name,ext,kind,data=doc.extract_font(font[0])
        assert ext=='ttf' and len(data)>1000
        weight=None
        for i in range(struct.unpack_from('>H',data,4)[0]):
            offset=12+16*i
            if data[offset:offset+4]==b'OS/2':
                table=struct.unpack_from('>I',data,offset+8)[0]
                weight=struct.unpack_from('>H',data,table+4)[0]
        fonts[font[0]]={'name':name,'bytes':len(data),'type':font[2],'weight':weight}
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines',[]):
            joined=''.join(span['text'] for span in line['spans'])
            for span in line['spans']:
                x0,y0,x1,y1=span['bbox']
                assert x0>=-1 and y0>=-1 and x1<=page.rect.width+1 and y1<=page.rect.height+1, span
                if re.search('[\u4e00-\u9fff]',span['text']): assert 'NotoSansTC' in span['font'],span
            body_top=(12*96/25.4+24)*.75
            if re.match(r'^節點\s+\d+',joined) and line['bbox'][1]>=body_top-2:
                assert min(span['size'] for span in line['spans'])>=10, (page.number,joined,line)
assert fonts and any(f['weight']==400 for f in fonts.values()) and any(f['weight']==700 for f in fonts.values())
source=manifest['topics'][manifest['from']][0]
target=manifest['topics'][manifest['to']][0]
assert source!=target
assert f'第 {target} 頁' in doc[source-1].get_text()
assert f'第 {source} 頁' in doc[target-1].get_text()
for number in {1,source,target,*manifest['indexPages']}:
    doc[number-1].get_pixmap(matrix=fitz.Matrix(1.2,1.2)).save(str(folder/f'page-{number}.png'))
links=sum(len(page.get_links()) for page in doc)
assert any(link.get('page')==target-1 for link in doc[source-1].get_links())
assert any(link.get('page')==source-1 for link in doc[target-1].get_links())
report={'pages':len(doc),'searchable_cjk':True,'all_79_numbered_topics_found':True,'font_programs':list(fonts.values()),'main_topic_minimum_10pt':True,'source_page':source,'target_page':target,'bidirectional_page_references':True,'index_pages':manifest['indexPages'],'pdf_link_annotations':links}
(folder/(Path(pdf_name).stem+'-verification.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({**report,'font_programs':len(fonts)},ensure_ascii=False,indent=2))
