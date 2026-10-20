import {describe,it,expect} from 'vitest';
import {equationGraphic} from '../src/engine/equations';
describe('offline vector equations',()=>{
  it.each(['x^2+y^2=z^2','\\frac{a+b}{c} = \\sqrt{2}','\\sum_{n=1}^{10} n','\\begin{aligned}x&=1\\\\y&=2\\end{aligned}'])('renders real paths for %s without remote images or HTML',source=>{const result=equationGraphic(source)!;expect(result.error).toBeUndefined();expect(result.markup).toContain('<svg');expect(result.markup).toContain('<path');expect(result.markup).not.toContain('foreignObject');expect(result.markup).not.toMatch(/(?:href|src)="https?:/);expect(result.width+result.height).toBeGreaterThan(10);});
  it('reports invalid or external TeX instead of executing commands',()=>{expect(equationGraphic('\\href{https://example.com}{x}')?.error).toBeTruthy();expect(equationGraphic('\\frac{')?.error).toBeTruthy();});
});
