export async function embeddedFile(file:File):Promise<{name:string;mime:string;data:string}>{
  if(file.size>2e6)throw new Error('每個附件上限為 2 MB。');
  const bytes=new Uint8Array(await file.arrayBuffer()),parts:string[]=[];
  for(let offset=0;offset<bytes.length;offset+=32768)parts.push(String.fromCharCode(...bytes.subarray(offset,offset+32768)));
  return {name:file.name,mime:file.type||'application/octet-stream',data:'data:application/octet-stream;base64,'+btoa(parts.join(''))};
}
export function attachmentBlob(data:string,mime:string):Blob{const encoded=data.slice(data.indexOf(',')+1),decoded=atob(encoded),bytes=Uint8Array.from(decoded,c=>c.charCodeAt(0));return new Blob([bytes],{type:mime});}
