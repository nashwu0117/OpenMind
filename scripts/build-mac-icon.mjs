import {execFileSync} from 'node:child_process';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const root=process.cwd();
const assets=path.join(root,'assets');
const temp=await mkdtemp(path.join(os.tmpdir(),'openmind-icon-'));
const representations=[['icp4',16],['icp5',32],['icp6',64],['ic07',128],['ic08',256],['ic09',512],['ic10',1024]];
const swiftSource=`
import AppKit
import Foundation
let input = URL(fileURLWithPath: CommandLine.arguments[1])
let output = URL(fileURLWithPath: CommandLine.arguments[2])
guard let image = NSImage(contentsOf: input) else { fatalError("Cannot open OpenMind SVG icon") }
var rect = CGRect(origin: .zero, size: NSSize(width: 1024, height: 1024))
guard let cg = image.cgImage(forProposedRect: &rect, context: nil, hints: nil), cg.width == 1024, cg.height == 1024 else { fatalError("OpenMind SVG must rasterize to 1024 × 1024") }
let bitmap = NSBitmapImageRep(cgImage: cg)
guard let png = bitmap.representation(using: .png, properties: [:]) else { fatalError("Cannot encode OpenMind PNG icon") }
try png.write(to: output, options: .atomic)
`;

try{
  const rasterizer=path.join(temp,'render-icon.swift');
  const source=path.join(assets,'openmind-icon.svg');
  const pngPath=path.join(temp,'openmind-icon-1024.png');
  await writeFile(rasterizer,swiftSource);
  execFileSync('/usr/bin/swift',['-module-cache-path',path.join(temp,'swift-modules'),rasterizer,source,pngPath],{stdio:'ignore'});
  const pngSource=await readFile(pngPath);
  await writeFile(path.join(assets,'openmind-icon-1024.png'),pngSource);

  const chunks=[];
  for(const [type,size] of representations){
    const output=path.join(temp,`${size}.png`);
    execFileSync('/usr/bin/sips',['-z',String(size),String(size),pngPath,'--out',output],{stdio:'ignore'});
    const png=await readFile(output),header=Buffer.alloc(8);
    header.write(type,0,4,'ascii');header.writeUInt32BE(png.length+header.length,4);
    chunks.push(header,png);
  }
  const payload=Buffer.concat(chunks),header=Buffer.alloc(8);
  header.write('icns',0,4,'ascii');header.writeUInt32BE(payload.length+header.length,4);
  await writeFile(path.join(assets,'OpenMind.icns'),Buffer.concat([header,payload]));
}finally{await rm(temp,{recursive:true,force:true});}
