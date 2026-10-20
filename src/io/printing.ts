import {preparePrintHTML,type PrintPlan} from '../engine/print';
export async function outputPrint(plan:PrintPlan,title:string,pdf:boolean):Promise<string|undefined>{
  const html=await preparePrintHTML(plan);
  if(window.openmind){if(pdf){const result=await window.openmind.pdf({html,name:title});return result?`已輸出 PDF：${result.name}`:undefined;}return await window.openmind.print({html})?'已送出列印工作。':undefined;}
  const frame=document.createElement('iframe');frame.className='print-frame';frame.title='列印文件';const ready=new Promise<void>(resolve=>{frame.onload=()=>resolve();});frame.srcdoc=html;document.body.appendChild(frame);
  try{await ready;await frame.contentDocument!.fonts.ready;await Promise.all([...frame.contentDocument!.images].map(image=>image.decode().catch(()=>{})));frame.contentWindow!.focus();frame.contentWindow!.print();setTimeout(()=>frame.remove(),60000);return '已開啟瀏覽器列印；可選擇「儲存為 PDF」。請關閉瀏覽器頁首頁尾，並保留預覽紙張設定。';}catch(error){frame.remove();throw error;}
}
