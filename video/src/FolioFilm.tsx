import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';

const paper='#f5f4f7', ink='#29282f', muted='#77727f', violet='#8766ae';
const serif='"Iowan Old Style", "Baskerville", Georgia, serif';
const sans='-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
const ease=Easing.bezier(.2,.75,.25,1);
const tween=(f:number,a:number,b:number,x:number,y:number)=>interpolate(f,[a,b],[x,y],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:ease});
const shot=(s:string)=>staticFile(`screenshots/workflow-${s}.png`);

function Mark({size=28,color=ink}:{size?:number;color?:string}) {
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h5a3 3 0 0 1 3 3v13a4 4 0 0 0-4-2H4z"/><path d="M20 4h-5a3 3 0 0 0-3 3v13a4 4 0 0 1 4-2h4z"/></svg>;
}
function Brand({dark=false,label='A LITTLE ROOM TO READ'}:{dark?:boolean;label?:string}) {
 const color=dark?'#f4f1f8':ink;
 return <div style={{position:'absolute',top:57,left:96,right:96,display:'flex',alignItems:'center',justifyContent:'space-between',color}}><div style={{display:'flex',gap:12,alignItems:'center'}}><Mark color={color}/><span style={{fontFamily:serif,fontSize:38,fontWeight:600,letterSpacing:-2}}>folio<span style={{color:dark?'#bda5dc':violet}}>.</span></span></div><div style={{fontSize:13,letterSpacing:3.5,fontWeight:600,opacity:.62}}>{label}</div></div>;
}
function Base({children,dark=false}:{children:React.ReactNode;dark?:boolean}) {
 const f=useCurrentFrame();
 return <AbsoluteFill style={{background:dark?'#19181f':paper,color:dark?'#f5f3f8':ink,fontFamily:sans,opacity:tween(f,0,10,0,1),overflow:'hidden'}}>{children}</AbsoluteFill>;
}
function Eyebrow({children,dark=false}:{children:React.ReactNode;dark?:boolean}) {
 return <div style={{display:'flex',alignItems:'center',gap:17,color:dark?'#bda6d7':violet,fontSize:13,letterSpacing:3,fontWeight:650,marginBottom:24}}><span style={{width:32,height:1,background:'currentColor'}}/>{children}</div>;
}
function Copy({title,subtitle,eyebrow,x=104,y=300,width=470,dark=false,size=78}:{title:React.ReactNode;subtitle?:React.ReactNode;eyebrow:string;x?:number;y?:number;width?:number;dark?:boolean;size?:number}) {
 const f=useCurrentFrame();
 return <div style={{position:'absolute',left:x,top:y,width,transform:`translateY(${tween(f,4,26,20,0)}px)`,opacity:tween(f,4,24,0,1)}}><Eyebrow dark={dark}>{eyebrow}</Eyebrow><div style={{fontFamily:serif,fontSize:size,lineHeight:1.06,letterSpacing:-2.3}}>{title}</div>{subtitle&&<div style={{fontSize:25,lineHeight:1.55,color:dark?'#b8b3c1':muted,marginTop:28,maxWidth:440}}>{subtitle}</div>}</div>;
}
// Original screenshot coordinates. Native Folio's OS title strip is cropped;
// all product controls and document content remain unchanged.
const sizes:Record<string,[number,number,number]>={finder:[920,436,0],quicklook:[777,768,0],folio:[1076,768,30],search:[1076,768,30],appearance:[1076,768,30],tinted:[1076,768,30],editor:[1223,768,0],'style-code-blue':[1224,768,0],'style-writer-amber':[1224,768,0]};
function Screen({name,width=1120,style={},crop}:{name:string;width?:number;style?:React.CSSProperties;crop?:[number,number,number,number]}) {
 const [sw,sh,trim]=sizes[name];
 const [cx,cy,cw,ch]=crop||[0,trim,sw,sh-trim];
 const scale=width/cw;
 return <div style={{position:'absolute',width,height:ch*scale,borderRadius:17,overflow:'hidden',background:'#fff',boxShadow:'0 30px 85px #21132b22, 0 4px 16px #21132b0d',border:'1px solid #ffffff70',...style}}><Img src={shot(name)} style={{position:'absolute',width:sw*scale,height:sh*scale,maxWidth:'none',left:-cx*scale,top:-cy*scale}}/></div>;
}
function Key({pressed=false}:{pressed?:boolean}) {
 return <div style={{width:246,height:62,border:'1px solid '+(pressed?'#9c83b9':'#cac3d2'),borderBottomWidth:pressed?2:6,borderRadius:12,background:pressed?'#e0d5ee':'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:23,color:ink,transform:`translateY(${pressed?4:0}px)`,boxShadow:'0 7px 20px #3423470a'}}>space<span style={{marginLeft:22,fontSize:30,lineHeight:1}}>␣</span></div>;
}
function Pointer({x,y,click=false}:{x:number;y:number;click?:boolean}) {
 const f=useCurrentFrame(); const ring=(f%15)/15;
 return <div style={{position:'absolute',left:x,top:y}}>{click&&<div style={{position:'absolute',width:60,height:60,left:-27,top:-27,border:'3px solid #b393d3',borderRadius:'50%',transform:`scale(${.6+ring*.7})`,opacity:1-ring}}/>}<svg width="32" height="40" viewBox="0 0 24 30"><path d="M2 1v24l6-6 5 10 4-2-5-9h9z" fill="#2c2634" stroke="#fff" strokeWidth="1.8"/></svg></div>;
}
function AgentOutput() {
 const f=useCurrentFrame();
 return <Base dark><Brand dark label="FOR THE FILES YOUR AI AGENT LEAVES BEHIND"/><Copy eyebrow="THE WORK KEEPS MOVING" title={<>Your agent<br/>writes.</>} subtitle="Plans. READMEs. Research." dark y={314} size={95} width={660}/><div style={{position:'absolute',left:958,top:240,width:690}}>{['PLAN.md','README.md','RESEARCH.md','TASKS.md'].map((name,i)=><div key={name} style={{height:126,display:'flex',gap:28,alignItems:'center',borderBottom:'1px solid #38323f',opacity:tween(f,i*13,i*13+16,0,1),transform:`translateX(${tween(f,i*13,i*13+22,45,0)}px)`}}><div style={{width:52,height:64,border:'1.5px solid #81718f',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,color:'#bda6d7',fontFamily:'monospace'}}>md</div><span style={{fontSize:39,letterSpacing:-.6,color:i===0?'#f4edf9':'#aaa0b4'}}>{name}</span><span style={{marginLeft:'auto',color:'#bda6d7',fontSize:24}}>✓</span></div>)}</div><div style={{position:'absolute',left:108,bottom:104,color:'#9c92a7',fontSize:19}}>A folder full of ideas. One next step.</div></Base>;
}
function SelectFile() {
 const f=useCurrentFrame();
 return <Base><Brand label="START IN FINDER"/><Copy eyebrow="JUST A FILE OR TWO" title={<>You just<br/>need to read.</>} subtitle="Select a Markdown file in Finder." y={265} width={550}/><Screen name="finder" width={1130} style={{left:696,top:297,transform:`translateY(${tween(f,0,120,12,-6)}px)`}}/><div style={{position:'absolute',left:109,top:726}}><Key pressed={f>=102}/></div><Pointer x={tween(f,18,53,1600,869)} y={tween(f,18,53,802,436)} click={f>56&&f<74}/><div style={{position:'absolute',left:733,top:873,fontSize:18,color:muted}}>The plan your agent just wrote.</div></Base>;
}
function QuickLook() {
 const f=useCurrentFrame();
 return <Base><Brand label="ONE KEY. A BEAUTIFUL READ."/><Copy eyebrow="MACOS QUICK LOOK" title={<>Space.<br/>And there<br/>it is.</>} subtitle="Beautiful Markdown. Right in Finder." y={243} size={91} width={655}/><div style={{position:'absolute',left:110,top:778}}><Key pressed={f<11}/></div><Screen name="quicklook" width={817} style={{left:973,top:163,transform:`translateY(${tween(f,0,27,34,0)}px) scale(${tween(f,0,27,.97,1)})`,opacity:tween(f,0,18,0,1)}}/><div style={{position:'absolute',left:111,top:898,fontSize:18,color:muted}}>Headings. Quotes. Tasks. Already formatted.</div></Base>;
}
function OpenFolio() {
 const f=useCurrentFrame(); const opened=tween(f,38,57,0,1);
 return <Base><Brand label="KEEP THE SAME FILE. GO A LITTLE DEEPER."/><Copy eyebrow="WHEN YOU WANT MORE" title={<>Want to<br/>go deeper?</>} subtitle={<>Double-click.<br/>Open in Folio.</>} y={303} width={525}/><Screen name="finder" width={1120} style={{left:692,top:305,opacity:1-opened}}/>{f<55&&<Pointer x={866} y={436} click={f>=17&&f<47}/>}<Screen name="folio" width={1152} style={{left:690,top:170,opacity:opened,transform:`translateY(${tween(f,38,61,20,0)}px)`}}/><div style={{position:'absolute',left:107,bottom:118,fontSize:17,color:muted,maxWidth:430,lineHeight:1.6}}>Set Folio as your Markdown opener.</div></Base>;
}
function Features() {
 const f=useCurrentFrame();
 const active=f<45?0:f<90?1:2;
 const presets=[
  {name:'style-code-blue',from:90,label:'VS Code preset · Blue tint',color:'#5776c8'},
  {name:'style-writer-amber',from:135,label:'iA Writer preset · Amber tint',color:'#a97735'},
 ];
 const preset=presets[f<135?0:1];
 return <Base><Brand label="THE FULL FOLIO READER"/><Copy eyebrow="YOUR NEXT LAYER" title={<>More room.<br/>More control.</>} y={269} size={75} width={560}/>
  <div style={{position:'absolute',left:108,top:569,width:424}}>{['Explore the outline','Search the document','Choose your style & tint'].map((label,k)=><div key={label} style={{display:'flex',alignItems:'center',gap:18,padding:'18px 0',borderBottom:'1px solid #ddd7e5',fontSize:25,color:active===k?ink:'#a59ead'}}><span style={{width:7,height:7,borderRadius:4,background:active===k?violet:'transparent'}}/>{label}</div>)}</div>
  <div style={{opacity:1-tween(f,90,100,0,1)}}><Screen name="folio" width={1152} style={{left:690,top:170}}/><Screen name="search" width={1152} style={{left:690,top:170,opacity:tween(f,45,55,0,1)}}/></div>
  {presets.map(p=><Screen key={p.name} name={p.name} width={1152} style={{left:690,top:204,opacity:tween(f,p.from,p.from+10,0,1)}}/>)}
  <div style={{position:'absolute',left:127,top:823,display:'flex',alignItems:'center',gap:13,fontSize:20,color:muted,opacity:tween(f,94,104,0,1)}}><span style={{width:15,height:15,borderRadius:'50%',background:preset.color}}/>{preset.label}</div>
 </Base>;
}
function Edit() {
 const f=useCurrentFrame(); const editor=tween(f,115,132,0,1); const button=tween(f,52,66,0,1);
 return <Base><Brand label="YOUR ORIGINAL FILE. YOUR FAVORITE EDITOR."/><Copy eyebrow="MAKE THE NEXT CHANGE" title={<>Ready to<br/>make a<br/>change?</>} subtitle={f<125?'Choose your local editor.':'Open it. Make it yours.'} y={248} size={81} width={530}/><div style={{opacity:1-editor}}><Screen name="appearance" width={1040} crop={[620,480,456,268]} style={{left:749,top:253,opacity:1-button}}/><Screen name="tinted" width={1152} style={{left:690,top:170,opacity:button}}/>{f>73&&<div style={{position:'absolute',left:1478,top:243,width:141,height:49,border:'2px solid #9b7eb9',borderRadius:10,opacity:tween(f,73,87,0,1)}}/>}</div><Screen name="editor" width={1110} crop={[285,25,730,480]} style={{left:724,top:190,opacity:editor,transform:`translateY(${tween(f,115,140,20,0)}px)`}}/><div style={{position:'absolute',left:724,bottom:91,fontSize:18,color:muted,opacity:editor}}>iA Writer · your original PLAN.md</div><div style={{position:'absolute',left:110,bottom:101,fontSize:18,color:muted}}>Reading in Folio. Editing in your app.</div></Base>;
}
function Outro() {
 return <Base dark><Brand dark label="READ IT. THEN KEEP BUILDING."/><div style={{position:'absolute',left:106,top:235,width:910}}><div style={{display:'flex',alignItems:'center',gap:25}}><Mark size={86} color="#d6c5e9"/><div style={{fontFamily:serif,fontSize:158,fontWeight:600,letterSpacing:-8,lineHeight:1.1}}>folio<span style={{color:'#b79bd6'}}>.</span></div></div><div style={{fontFamily:serif,fontSize:55,lineHeight:1.17,letterSpacing:-1,color:'#e5ddeb',marginTop:30}}>From agent output<br/>to a beautiful read.</div><div style={{fontSize:23,color:'#b5aabd',marginTop:37}}>Preview. Explore. Edit in your own app.</div><div style={{fontSize:17,letterSpacing:2.5,color:'#c7bdd0',marginTop:62}}>MAC &nbsp;·&nbsp; WINDOWS &nbsp;·&nbsp; LINUX</div><div style={{fontSize:16,color:'#9689a3',marginTop:14}}>Space bar preview on Mac</div><div style={{fontSize:25,color:'#f2edf8',marginTop:44}}>github.com/woodcreeper/folio</div></div><Screen name="quicklook" width={663} style={{left:1160,top:214,transform:'rotate(2deg)',boxShadow:'0 35px 90px #0005'}}/></Base>;
}
export function FolioFilm() {
 return <AbsoluteFill style={{background:paper}}><Audio src={staticFile('ambient.wav')} volume={.9}/><Sequence from={0} durationInFrames={130}><AgentOutput/></Sequence><Sequence from={120} durationInFrames={130}><SelectFile/></Sequence><Sequence from={240} durationInFrames={250}><QuickLook/></Sequence><Sequence from={480} durationInFrames={190}><OpenFolio/></Sequence><Sequence from={660} durationInFrames={190}><Features/></Sequence><Sequence from={840} durationInFrames={250}><Edit/></Sequence><Sequence from={1080} durationInFrames={180}><Outro/></Sequence></AbsoluteFill>;
}
