// tiny-stack-vm — @syukuran entry: a closure-compiled interpreter for make.fun's tiny stack ISA v1.
// Design: one decode pass compiles EVERY byte offset into a closure (so a jump into the middle of an
// immediate decodes that byte as an opcode, exactly as the reference VM does). The run loop then only
// checks the step limit, pc bounds, unknown opcode and truncated immediate — in the reference order —
// advances pc, and calls the closure; each closure checks its own stack needs first, then its own
// traps, then its effect. No dispatch switch runs per step. All ten trap codes, the 1,000,000-step
// and 65,536-output limits, and every hard rule in ISA.md are honoured.
// SPDX-License-Identifier: MIT
import {mkdirSync,readdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';

function run(p:Uint8Array,inp:Uint8Array):{o:Uint8Array;c:number}{
  const D=new Int32Array(256),C=new Int32Array(64),M=new Int32Array(256),o=new Uint8Array(65536),F=new Array(p.length);
  let sp=0,cp=0,ol=0,pc=0,ip=0,st=0;
  const X=(c:number):never=>{throw c};
  const ck=(a:number,b:number)=>{if(sp<a)X(2);if(sp-a+b>256)X(3)};
  const B=(op:number)=>{
    return ()=>{
      ck(2,1);
      const b=D[sp-1],a=D[sp-2];let r=0;
      if(op===0x10)r=(a+b)|0;
      else if(op===0x11)r=(a-b)|0;
      else if(op===0x12)r=Math.imul(a,b);
      else if(op===0x13){if(!b)X(4);r=a===-2147483648&&b===-1?a:(a/b)|0}
      else if(op===0x14){if(!b)X(4);r=b===-1?0:a%b|0}
      else if(op===0x15){if(!b)X(4);r=Math.floor((a>>>0)/(b>>>0))|0}
      else if(op===0x16){if(!b)X(4);r=(a>>>0)%(b>>>0)|0}
      else if(op===0x18)r=a&b;
      else if(op===0x19)r=a|b;
      else if(op===0x1a)r=a^b;
      else if(op===0x1c)r=a<<(b&31);
      else if(op===0x1d)r=a>>(b&31);
      else if(op===0x1e)r=(a>>>(b&31))|0;
      else if(op===0x20)r=a===b?1:0;
      else if(op===0x21)r=a<b?1:0;
      else r=(a>>>0)<(b>>>0)?1:0;
      D[sp-2]=r;sp--;
    };
  };
  const mk=(op:number,a:number)=>{
    switch(op){
      case 0x00:return ()=>X(0);
      case 0x01:case 0x02:return ()=>{ck(0,1);D[sp++]=a};
      case 0x03:return ()=>{ck(1,0);sp--};
      case 0x04:return ()=>{ck(1,2);D[sp]=D[sp-1];sp++};
      case 0x05:return ()=>{ck(2,2);const t=D[sp-1];D[sp-1]=D[sp-2];D[sp-2]=t};
      case 0x06:return ()=>{ck(2,3);D[sp]=D[sp-2];sp++};
      case 0x07:return ()=>{ck(3,3);const t=D[sp-3];D[sp-3]=D[sp-2];D[sp-2]=D[sp-1];D[sp-1]=t};
      case 0x17:return ()=>{ck(1,1);D[sp-1]=-D[sp-1]|0};
      case 0x1b:return ()=>{ck(1,1);D[sp-1]=~D[sp-1]};
      case 0x30:return (nx:number)=>{pc=nx+a};
      case 0x31:return (nx:number)=>{ck(1,0);if(D[--sp]===0)pc=nx+a};
      case 0x32:return (nx:number)=>{ck(1,0);if(D[--sp]!==0)pc=nx+a};
      case 0x33:return (nx:number)=>{if(cp===64)X(7);C[cp++]=nx;pc=a};
      case 0x34:return ()=>{if(cp===0)X(8);pc=C[--cp]};
      case 0x40:return ()=>{ck(1,1);const v=D[sp-1];if(v<0||v>255)X(6);D[sp-1]=M[v]};
      case 0x41:return ()=>{ck(2,0);const v=D[sp-1],w=D[sp-2];if(v<0||v>255)X(6);sp-=2;M[v]=w};
      case 0x50:return ()=>{ck(1,0);const t=String(D[sp-1]);if(ol+t.length>65536)X(11);sp--;for(let k=0;k<t.length;k++)o[ol++]=t.charCodeAt(k)};
      case 0x51:return ()=>{ck(1,0);if(ol+1>65536)X(11);o[ol++]=D[--sp]&255};
      case 0x52:return ()=>{ck(0,1);D[sp++]=ip<inp.length?inp[ip++]:-1};
      case 0x53:return ()=>{ck(1,0);X(D[--sp]&255)};
      default:
        if(op>=0x10&&op<=0x22&&op!==0x1f)return B(op);
        return undefined;
    }
  };
  for(let i=0;i<p.length;i++){
    const op=p[i];let a=0;
    if(op===1)a=(p[i+1]<<24)>>24;
    else if(op===2)a=p[i+1]|p[i+2]<<8|p[i+3]<<16|p[i+4]<<24;
    else if(op>=48&&op<=50)a=((p[i+1]|p[i+2]<<8)<<16)>>16;
    else if(op===51)a=p[i+1]|p[i+2]<<8;
    F[i]=mk(op,a);
  }
  let code=0;
  try{
    for(;;){
      if(st===1e6)X(10);
      if(pc<0||pc>=p.length)X(9);
      const f=F[pc];
      if(!f)X(5);
      const op=p[pc],L=op===1?1:op===2?4:op>=48&&op<=51?2:0;
      if(pc+L>=p.length)X(9);
      st++;pc+=1+L;f(pc);
    }
  }catch(c){code=typeof c==='number'&&c>=0&&c<256?c:1}
  return{o:o.slice(0,ol),c:code};
}

const I=process.env.MAKEFUN_INPUT_DIR??'/input';
const O=process.env.MAKEFUN_OUTPUT_DIR??'/output';
for(const id of readdirSync(I).sort()){
  const r=run(new Uint8Array(readFileSync(join(I,id,'program.bin'))),new Uint8Array(readFileSync(join(I,id,'input.bin'))));
  mkdirSync(join(O,id),{recursive:true});
  writeFileSync(join(O,id,'stdout.bin'),r.o);
  writeFileSync(join(O,id,'exit.txt'),r.c+'\n');
}
