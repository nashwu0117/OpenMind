"""Verify actual browser + packaged native PDF content, geometry, fonts and preview."""
import json,re
from pathlib import Path
import pymupdf as fitz
from PIL import Image,ImageChops,ImageStat
folder=Path('artifacts/audit')
manifest=json.loads((folder/'browser-acceptance.json').read_text())
report=[]
for source in ['browser','native']:
    for kind in ['rich','tasks','slides']:
        doc=fitz.open(folder/f'{source}-{kind}.pdf')
        plan=manifest['outputs'][kind]
        assert len(doc)==plan['pages'],(source,kind,len(doc),plan['pages'])
        text='\n'.join(p.get_text() for p in doc)
        compact=re.sub(r'\s+','',text)
        assert '臺灣繁體中文完整度驗收' in compact,(source,kind,text[:500])
        if kind!='slides':
            labels={int(x) for x in re.findall(r'節點\s+(\d+)',text)}
            assert labels.issuperset(range(1,50)),(source,kind,set(range(1,50))-labels)
        if kind=='rich':
            assert '跨頁摘要驗收與繁體中文彙整' in compact
            assert '跨頁依賴與完整關係文字驗收' in compact
            assert 'S1' in compact and 'R1' in compact
        if kind=='tasks':assert '2026-10-20' in text and '2026-10-25' in text
        fonts=set();drawings=0
        for i,page in enumerate(doc):
            assert abs(page.rect.width-plan['widthMM']/25.4*72)<1
            assert abs(page.rect.height-plan['heightMM']/25.4*72)<1
            drawings+=len(page.get_drawings())
            for font in page.get_fonts():
                if 'NotoSansTC' in font[3]:
                    assert font[2]=='Type0' and len(doc.extract_font(font[0])[3])>1000
                    fonts.add(font[3])
            for block in page.get_text('dict')['blocks']:
                for line in block.get('lines',[]):
                    for span in line['spans']:
                        x0,y0,x1,y1=span['bbox']
                        assert x0>=-1 and y0>=-1 and x1<=page.rect.width+1 and y1<=page.rect.height+1,(source,kind,i,span)
                        if re.search('[\u4e00-\u9fff]',span['text']):assert 'NotoSansTC' in span['font'],span
        assert fonts and drawings>0
        doc[0].get_pixmap(matrix=fitz.Matrix(1.2,1.2)).save(str(folder/f'{source}-{kind}-render.png'))
        report.append({'file':f'{source}-{kind}.pdf','pages':len(doc),'cjkSearchable':True,'embeddedNotoFonts':len(fonts),'allTextInsidePage':True,'vectorDrawings':drawings})
doc=fitz.open(folder/'browser-rich.pdf');pix=doc[0].get_pixmap(matrix=fitz.Matrix(96/72,96/72),alpha=False)
pdf=Image.frombytes('RGB',(pix.width,pix.height),pix.samples)
preview=Image.open(folder/'rich-preview-physical.png').convert('RGB');box=(0,0,min(pdf.width,preview.width),min(pdf.height,preview.height))
diff=ImageChops.difference(pdf.crop(box),preview.crop(box)).convert('L');mean=ImageStat.Stat(diff).mean[0];fraction=sum(diff.histogram()[31:])/(box[2]*box[3])
assert mean<3 and fraction<.03,(mean,fraction)
result={'pdfs':report,'actualUIToPDFComparison':{'meanDifference0to255':round(mean,4),'changedPixelFractionOver30':round(fraction,6)},'layoutCases':len(manifest['measurements']),'externalFontRequests':manifest['externalRequests']}
(folder/'pdf-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print(json.dumps(result,ensure_ascii=False,indent=2))
