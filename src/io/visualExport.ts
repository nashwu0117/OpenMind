import {renderSVG,type RenderOptions} from '../engine/svg';
import type {Scene} from '../engine/layout';
export async function standaloneSVG(scene:Scene,options:RenderOptions={background:true}):Promise<string>{
  const svg=renderSVG(scene,options),{embeddedFontCSS}=await import('../engine/fontEmbedding');
  const font=await embeddedFontCSS(svg.replace(/<[^>]*>/g,''));
  return svg.replace(/(<svg\b[^>]*>)/,`$1<style>${font.css}</style>`);
}
