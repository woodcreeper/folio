import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';

const paper = '#f5f4f7';
const ink = '#29282f';
const muted = '#797680';
const violet = '#8766ae';
const serif = '"Iowan Old Style", "Baskerville", Georgia, serif';
const sans = '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
const ease = Easing.bezier(.2, .75, .25, 1);
const tween = (f: number, a: number, b: number, start: number, end: number) => interpolate(f, [a, b], [start, end], {extrapolateLeft:'clamp', extrapolateRight:'clamp', easing:ease});
const image = (name: string) => staticFile(`screenshots/${name}.png`);

function Mark({size=28, color=ink}: {size?:number; color?:string}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h5a3 3 0 0 1 3 3v13a4 4 0 0 0-4-2H4z"/><path d="M20 4h-5a3 3 0 0 0-3 3v13a4 4 0 0 1 4-2h4z"/></svg>;
}

function Brand({dark=false, label='A LITTLE ROOM TO READ'}: {dark?:boolean; label?:string}) {
  const color = dark ? '#f4f1f8' : ink;
  return <div style={{position:'absolute',top:62,left:96,right:96,display:'flex',alignItems:'center',justifyContent:'space-between',color}}>
    <div style={{display:'flex',gap:12,alignItems:'center'}}><Mark color={color}/><span style={{fontFamily:serif,fontSize:38,fontWeight:600,letterSpacing:-2}}>folio<span style={{color:dark?'#bda5dc':violet}}>.</span></span></div>
    <div style={{fontSize:12,letterSpacing:4,fontWeight:600,opacity:.62}}>{label}</div>
  </div>;
}

function Base({children, dark=false}: {children:React.ReactNode; dark?:boolean}) {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{background:dark?'#19181f':paper,color:dark?'#f5f3f8':ink,fontFamily:sans,opacity:tween(f,0,14,0,1),overflow:'hidden'}}>{children}</AbsoluteFill>;
}

function Screen({name, width=1280, style={}, zoom=1, origin='center center'}: {name:string; width?:number; style?:React.CSSProperties; zoom?:number; origin?:string}) {
  return <div style={{position:'absolute',width,height:width/1.6,borderRadius:18,overflow:'hidden',background:'#fff',boxShadow:'0 34px 90px #21132b21, 0 4px 16px #21132b0d',border:'1px solid #ffffff66',...style}}>
    <Img src={image(name)} style={{width:'100%',height:'100%',display:'block',transform:`scale(${zoom})`,transformOrigin:origin}}/>
  </div>;
}

function Eyebrow({children,dark=false}: {children:React.ReactNode; dark?:boolean}) {
  return <div style={{display:'flex',alignItems:'center',gap:18,color:dark?'#b9a5d0':violet,fontSize:13,letterSpacing:3.5,fontWeight:650,marginBottom:24}}><span style={{width:32,height:1,background:'currentColor'}}/>{children}</div>;
}

function Copy({title, subtitle, eyebrow, x=104,y=290,width=450,dark=false,size=76}: {title:React.ReactNode;subtitle?:React.ReactNode;eyebrow:string;x?:number;y?:number;width?:number;dark?:boolean;size?:number}) {
  const f=useCurrentFrame();
  return <div style={{position:'absolute',left:x,top:y,width,transform:`translateY(${tween(f,8,34,20,0)}px)`,opacity:tween(f,8,30,0,1)}}>
    <Eyebrow dark={dark}>{eyebrow}</Eyebrow>
    <div style={{fontFamily:serif,fontSize:size,lineHeight:1.03,letterSpacing:-2.4,fontWeight:400}}>{title}</div>
    {subtitle && <div style={{fontSize:24,lineHeight:1.6,color:dark?'#b8b3c1':muted,marginTop:28,maxWidth:410}}>{subtitle}</div>}
  </div>;
}

function Hook() {
  const f=useCurrentFrame();
  const reveal=tween(f,51,82,0,100);
  return <AbsoluteFill style={{background:'#19181f',fontFamily:sans,color:'#f6f3fb',overflow:'hidden'}}>
    <Brand dark label="YOUR WORDS, WITH ROOM TO BREATHE"/>
    <div style={{position:'absolute',left:112,top:300,width:600}}>
      <Eyebrow dark>MEET FOLIO</Eyebrow>
      <div style={{fontFamily:serif,fontSize:90,lineHeight:1.05,letterSpacing:-3,opacity:tween(f,4,27,0,1),transform:`translateY(${tween(f,4,32,30,0)}px)`}}>Plain text.</div>
      <div style={{fontFamily:serif,fontSize:90,lineHeight:1.05,letterSpacing:-3,color:'#c8b5e0',marginTop:14,opacity:tween(f,46,69,0,1),transform:`translateY(${tween(f,46,75,24,0)}px)`}}>Beautifully<br/>read.</div>
    </div>
    <div style={{position:'absolute',left:810,top:205,transform:`translateY(${tween(f,0,120,18,-10)}px) rotate(-2deg)`}}>
      <Screen name="source" width={1240} style={{position:'relative'}}/>
      <Screen name="folio" width={1240} style={{left:0,top:0,clipPath:`inset(0 ${100-reveal}% 0 0)`}}/>
    </div>
    <div style={{position:'absolute',bottom:84,left:114,fontSize:17,color:'#9a92a5',letterSpacing:1}}>A lightweight Markdown viewer.</div>
  </AbsoluteFill>;
}

function Read() {
  const f=useCurrentFrame();
  return <Base><Brand/>
    <Copy eyebrow="OPEN A MARKDOWN FILE" title={<>Open it.<br/>Settle in.</>} subtitle="A clear, comfortable view of your Markdown."/>
    <Screen name="folio" width={1280} style={{left:608,top:186,transform:`translateY(${tween(f,0,180,22,-10)}px) rotate(${tween(f,0,180,1.2,0)}deg)`}} zoom={tween(f,20,180,1,1.035)} origin="57% 30%"/>
    <div style={{position:'absolute',left:106,bottom:123,display:'flex',gap:12,alignItems:'center',fontSize:17,color:muted}}><div style={{padding:'10px 14px',border:'1px solid #d4cfdc',borderRadius:9,color:ink,fontSize:20}}>⌘ O</div>Open. Read. Done.</div>
  </Base>;
}

function Navigate() {
  const f=useCurrentFrame();
  const search=tween(f,70,88,0,1);
  return <Base><Brand label="LESS SEARCHING. MORE READING."/>
    <div style={{position:'absolute',left:104,top:169,right:104}}><Eyebrow>FOLLOW THE THREAD</Eyebrow><div style={{fontFamily:serif,fontSize:76,letterSpacing:-2}}>Find your place.</div><div style={{position:'absolute',right:0,bottom:10,fontSize:24,color:muted}}>An outline to explore. Search when you need it.</div></div>
    <Screen name="outline" width={1490} style={{left:214,top:342}} zoom={1.04} origin="left top"/>
    <Screen name="search" width={1490} style={{left:214,top:342,opacity:search}} zoom={1.04} origin="left top"/>
    <div style={{position:'absolute',left:221,top:649,width:244,height:252,border:'2px solid #a995c9',borderRadius:12,opacity:(1-search)*.85,boxShadow:'0 0 0 8px #9e89c00b'}}/>
    <div style={{position:'absolute',left:472,top:469,width:1198,height:56,border:'2px solid #a995c9',borderRadius:9,opacity:search*.85,boxShadow:'0 0 0 8px #9e89c00b'}}/>
  </Base>;
}

const styles = [{name:'Folio',file:'folio',description:'Calm & spacious'}, {name:'VS Code',file:'code',description:'Compact & technical'}, {name:'iA Writer',file:'writer',description:'Classic serif'}, {name:'GitHub',file:'github',description:'Familiar & structured'}];
function Styles() {
  const f=useCurrentFrame();
  const index=Math.min(3,Math.floor(f/60));
  return <Base><Brand label="SAME WORDS. A DIFFERENT FEEL."/>
    <Copy eyebrow="CHOOSE YOUR READING STYLE" title={<>Four styles.<br/>One file.</>} y={265} subtitle="Find the view that feels like you."/>
    <div style={{position:'absolute',left:104,top:629,width:352}}>{styles.map((s,i)=><div key={s.name} style={{display:'flex',gap:15,alignItems:'center',height:58,borderBottom:'1px solid #dfdbe5',opacity:i===index?1:.42}}><span style={{height:6,width:6,borderRadius:3,background:i===index?violet:'transparent'}}/><span style={{fontSize:23,fontWeight:i===index?550:400}}>{s.name}</span></div>)}</div>
    {styles.map((s,i)=><Screen key={s.name} name={s.file} width={1280} style={{left:610,top:191,opacity:i===0?1:tween(f,i*60,i*60+12,0,1)}}/>) }
    <div style={{position:'absolute',left:650,bottom:46,fontSize:13,letterSpacing:.6,color:muted}}>Original reading styles inspired by familiar editors.</div>
  </Base>;
}

function Tint() {
  const f=useCurrentFrame();
  const dark=tween(f,107,127,0,1);
  const clean=tween(f,167,184,0,1);
  return <Base><AbsoluteFill style={{background:'#19181f',opacity:dark}}/><Brand dark={f>=117} label="A LITTLE MORE YOU"/>
    <div style={{color:f>=117?'#f3f0f8':ink}}><Copy eyebrow="TINT & APPEARANCE" title={<>Make it<br/>yours.</>} subtitle="Your color. Your light. Your reading rhythm." dark={f>=117} y={269}/></div>
    <div style={{position:'absolute',left:111,top:641,display:'flex',gap:18}}>{['#797680','#5776c8','#9365b8','#b96683','#bd8844'].map((c,i)=><div key={c} style={{background:c,width:32,height:32,borderRadius:'50%',boxShadow:(f<51?i===0:f<117?i===2:i===1)?`0 0 0 5px ${f>=117?'#19181f':paper}, 0 0 0 6px ${c}`:'none'}}/>)}</div>
    <Screen name="appearance-neutral" width={1320} style={{left:602,top:185}}/>
    <Screen name="appearance-purple" width={1320} style={{left:602,top:185,opacity:tween(f,44,62,0,1)}}/>
    <Screen name="appearance-dark" width={1320} style={{left:602,top:185,opacity:dark}}/>
    <Screen name="dark" width={1320} style={{left:602,top:185,opacity:clean}}/>
  </Base>;
}

function Local() {
  const f=useCurrentFrame();
  return <Base><Brand label="LOCAL BY DESIGN"/>
    <div style={{position:'absolute',left:104,top:208,width:725}}><Eyebrow>ORDINARY FILES. BEAUTIFULLY RENDERED.</Eyebrow><div style={{fontFamily:serif,fontSize:83,lineHeight:1.08,letterSpacing:-2.8}}>Your files.<br/>Your space.</div><div style={{fontSize:27,lineHeight:1.7,color:muted,marginTop:37}}>No account. No upload.<br/>Just open and read.</div></div>
    <Screen name="folio" width={1170} style={{left:856,top:170,transform:`rotate(-2deg) translateY(${tween(f,0,150,15,-10)}px)`}}/>
    <div style={{position:'absolute',left:108,top:801,width:596,height:114,overflow:'hidden',borderRadius:16,border:'1px solid #ddd9e2',boxShadow:'0 20px 50px #2b173611',background:'#f1f1f2'}}>
      <Img src={image('folio')} style={{position:'absolute',width:3456,maxWidth:'none',left:0,top:-2032}}/>
    </div>
    <div style={{position:'absolute',left:110,top:950,color:muted,fontSize:15}}>Your original Markdown stays untouched.</div>
  </Base>;
}

function Outro() {
  const f=useCurrentFrame();
  return <Base dark>
    <div style={{position:'absolute',left:1360,top:118,width:880,height:950,opacity:.13,transform:'rotate(-8deg)'}}><Screen name="dark" width={1080} style={{left:0,top:0}}/></div>
    <div style={{position:'absolute',left:0,right:0,top:204,textAlign:'center',transform:`translateY(${tween(f,0,45,20,0)}px)`}}>
      <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:28}}><Mark size={100} color="#ddd0ec"/><div style={{fontFamily:serif,fontSize:176,fontWeight:600,letterSpacing:-10,lineHeight:1.1}}>folio<span style={{color:'#b79bd6'}}>.</span></div></div>
      <div style={{fontFamily:serif,fontSize:51,marginTop:35,letterSpacing:-.6,color:'#ddd8e5'}}>A little room to read.</div>
      <div style={{width:60,height:1,background:'#74647f',margin:'50px auto 33px'}}/>
      <div style={{fontSize:18,letterSpacing:3,color:'#b8afc4'}}>MAC&nbsp;&nbsp; · &nbsp;&nbsp;WINDOWS&nbsp;&nbsp; · &nbsp;&nbsp;LINUX</div>
      <div style={{fontSize:27,color:'#f2edf8',marginTop:57,letterSpacing:.2}}>github.com/woodcreeper/folio</div>
      <div style={{fontSize:14,color:'#92859e',marginTop:19}}>Explore the desktop preview</div>
    </div>
  </Base>;
}

export function FolioFilm() {
  return <AbsoluteFill style={{background:paper}}>
    <Audio src={staticFile('ambient.wav')} volume={.8}/>
    <Sequence from={0} durationInFrames={134}><Hook/></Sequence>
    <Sequence from={120} durationInFrames={194}><Read/></Sequence>
    <Sequence from={300} durationInFrames={164}><Navigate/></Sequence>
    <Sequence from={450} durationInFrames={254}><Styles/></Sequence>
    <Sequence from={690} durationInFrames={224}><Tint/></Sequence>
    <Sequence from={900} durationInFrames={164}><Local/></Sequence>
    <Sequence from={1050} durationInFrames={150}><Outro/></Sequence>
  </AbsoluteFill>;
}
