import {useEffect} from 'react';
export function useModalFocus(name:string|null){useEffect(()=>{if(!name)return;const previous=document.activeElement instanceof HTMLElement?document.activeElement:null,dialog=[...document.querySelectorAll<HTMLElement>('[role="dialog"]')].find(el=>el.getAttribute('aria-label')===name);if(!dialog)return;
  const available=()=>[...dialog.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),a[href],summary,[tabindex="0"]')].filter(el=>el.getClientRects().length);
  const first=(name==='編輯主題'?dialog.querySelector<HTMLElement>('textarea:not(:disabled)'):undefined)??available()[0];first?.focus();
  const trap=(event:KeyboardEvent)=>{if(event.key!=='Tab')return;const elements=available();if(!elements.length){event.preventDefault();return;}const current=elements.indexOf(document.activeElement as HTMLElement),next=current+(event.shiftKey?-1:1);if(current<0||next<0||next>=elements.length){event.preventDefault();elements[event.shiftKey?elements.length-1:0].focus();}};
  document.addEventListener('keydown',trap,true);return()=>{document.removeEventListener('keydown',trap,true);if(previous?.isConnected)previous.focus();};
},[name]);}
