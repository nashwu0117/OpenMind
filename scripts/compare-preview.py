import json
from pathlib import Path
import pymupdf as fitz
from PIL import Image,ImageChops,ImageStat
folder=Path('artifacts/print-fixtures')
report=[]
for case in json.loads((folder/'manifest.json').read_text()):
    with fitz.open(folder/(case['name']+'.pdf')) as doc:
        pix=doc[0].get_pixmap(matrix=fitz.Matrix(96/72,96/72),alpha=False)
    pdf=Image.frombytes('RGB',[pix.width,pix.height],pix.samples)
    preview=Image.open(folder/(case['name']+'.png')).convert('RGB')
    size=(min(pdf.width,preview.width),min(pdf.height,preview.height))
    box=(0,0,*size)
    difference=ImageChops.difference(pdf.crop(box),preview.crop(box)).convert('L')
    mean=ImageStat.Stat(difference).mean[0]
    changed=sum(difference.histogram()[31:])/(size[0]*size[1])
    assert mean<3 and changed<0.03, (case['name'],mean,changed)
    report.append({'case':case['name'],'mean_pixel_difference_0_255':round(mean,4),'changed_pixel_fraction_gt30':round(changed,6),'passed':True})
(folder/'preview-comparison.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
