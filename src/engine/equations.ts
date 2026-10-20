import {mathjax} from '@mathjax/src/js/mathjax.js';
import {TeX} from '@mathjax/src/js/input/tex.js';
import {SVG} from '@mathjax/src/js/output/svg.js';
import {liteAdaptor} from '@mathjax/src/js/adaptors/liteAdaptor.js';
import {RegisterHTMLHandler} from '@mathjax/src/js/handlers/html.js';
import type {LiteElement} from '@mathjax/src/js/adaptors/lite/Element.js';
import '@mathjax/src/js/input/tex/ams/AmsConfiguration.js';
const adaptor=liteAdaptor();RegisterHTMLHandler(adaptor);
const tex=new TeX({packages:['base','ams'],maxBuffer:5000,maxMacros:1000,formatError:(_jax:unknown,error:Error)=>{throw error;}});
const document=mathjax.document('',{InputJax:tex,OutputJax:new SVG({fontCache:'none'})});
type Equation={markup:string;width:number;height:number;error?:string};
const cache=new Map<string,Equation>();
export function equationGraphic(source:string,availableWidth=Infinity):Equation|undefined {
  if(!source)return undefined;let equation=cache.get(source);
  if(!equation){try{
    if(source.length>2000||/\\(?:require|href|url|includegraphics|html|style|class|cssId)\b/.test(source))throw new Error('公式僅支援離線 TeX／AMS 數學語法。');
    const container=document.convert(source,{display:true,em:16,ex:8,containerWidth:800}),svg=adaptor.firstChild(container) as LiteElement;
    const viewBox=adaptor.getAttribute(svg,'viewBox').split(/\s+/).map(Number),width=Math.max(8,viewBox[2]/1000*16),height=Math.max(16,viewBox[3]/1000*16);
    if(!Number.isFinite(width+height)||height>3000)throw new Error('公式超過可顯示範圍，請拆分成較小公式。');
    adaptor.setAttribute(svg,'width',String(width));adaptor.setAttribute(svg,'height',String(height));equation={markup:adaptor.outerHTML(svg),width,height};
  }catch(error){equation={markup:'',width:220,height:24,error:`公式無法排版：${(error as Error).message}`};}
    if(cache.size>=128)cache.delete(cache.keys().next().value!);cache.set(source,equation);
  }
  const scale=Math.min(1,availableWidth/equation.width);return {...equation,width:equation.width*scale,height:equation.height*scale};
}
