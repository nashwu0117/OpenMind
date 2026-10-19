import json
from pathlib import Path
import pymupdf as fitz
from PIL import Image,ImageChops,ImageStat
folder=Path('artifacts/phase2/ui-comparison')
manifest=json.loads((folder/'manifest.json').read_text())
doc=fitz.open(folder/'actual-output.pdf')
assert len(doc)==manifest['pages']
report=[]
for number in manifest['comparePages']:
    pix=doc[number-1].get_pixmap(matrix=fitz.Matrix(96/72,96/72),alpha=False)
    pdf=Image.frombytes('RGB',(pix.width,pix.height),pix.samples)
    preview=Image.open(folder/f'preview-{number}.png').convert('RGB')
    box=(0,0,min(pdf.width,preview.width),min(pdf.height,preview.height))
    diff=ImageChops.difference(pdf.crop(box),preview.crop(box)).convert('L')
    mean=ImageStat.Stat(diff).mean[0];fraction=sum(diff.histogram()[31:])/(box[2]*box[3])
    assert mean<3 and fraction<.03,(number,mean,fraction)
    report.append({'page':number,'mean_difference_0_255':round(mean,4),'changed_pixel_fraction_gt30':round(fraction,6),'passed':True})
(folder/'verification.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
