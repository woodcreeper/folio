import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame, getInputProps, delayRender, continueRender, cancelRender} from 'remotion';
import timeline from './timeline.json';

const paper='#f5f4f7', ink='#29282f', muted='#77727f', violet='#8766ae';
const metal='"Metal Mania", fantasy';
const serif='"Iowan Old Style", "Baskerville", Georgia, serif';
const sans='-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
const ease=Easing.bezier(.2,.75,.25,1);
const tween=(f:number,a:number,b:number,x:number,y:number)=>interpolate(f,[a,b],[x,y],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:ease});
const shot=(s:string)=>staticFile(`screenshots/slaydown-${s}.png`);

function Mark({size=28,color=ink}:{size?:number;color?:string}) {
 return <svg width={size} height={size} viewBox="0 0 64 64"><path d="M49 14H24L13 25v12h27v6H14v10h28l10-10V27H25v-3h24z" fill={color}/><path d="m49 7-8 10h7l-4 9 13-14h-8l4-5z" fill="#ad82dc"/></svg>;
}
function Brand({dark=false,label='A LITTLE ROOM TO READ'}:{dark?:boolean;label?:string}) {
 const color=dark?'#f4f1f8':ink;
 return <div style={{position:'absolute',top:57,left:96,right:96,display:'flex',alignItems:'center',justifyContent:'space-between',color}}><div style={{display:'flex',gap:12,alignItems:'center'}}><Mark color={color}/><span style={{fontFamily:metal,fontSize:38,fontWeight:400,letterSpacing:.5,textTransform:'uppercase',transform:'skewX(-5deg)'}}>SlayDown<span style={{color:dark?'#bda5dc':violet}}>.</span></span></div><div style={{fontSize:13,letterSpacing:3.5,fontWeight:600,opacity:.62}}>{label}</div></div>;
}
function Base({children,dark=false}:{children:React.ReactNode;dark?:boolean}) {
 return <AbsoluteFill style={{background:dark?'#19181f':paper,color:dark?'#f5f3f8':ink,fontFamily:sans,overflow:'hidden'}}>{children}</AbsoluteFill>;
}
function Eyebrow({children,dark=false}:{children:React.ReactNode;dark?:boolean}) {
 return <div style={{display:'flex',alignItems:'center',gap:17,color:dark?'#bda6d7':violet,fontSize:13,letterSpacing:3,fontWeight:650,marginBottom:24}}><span style={{width:32,height:1,background:'currentColor'}}/>{children}</div>;
}
function Copy({title,subtitle,eyebrow,x=104,y=300,width=470,dark=false,size=78}:{title:React.ReactNode;subtitle?:React.ReactNode;eyebrow:string;x?:number;y?:number;width?:number;dark?:boolean;size?:number}) {
 return <div style={{position:'absolute',left:x,top:y,width}}><Eyebrow dark={dark}>{eyebrow}</Eyebrow><div style={{fontFamily:serif,fontSize:size,lineHeight:1.06,letterSpacing:-2.3}}>{title}</div>{subtitle&&<div style={{fontSize:25,lineHeight:1.55,color:dark?'#b8b3c1':muted,marginTop:28,maxWidth:440}}>{subtitle}</div>}</div>;
}
// Original capture dimensions. Reader captures share the same full-size surface.
const sizes:Record<string,[number,number,number]>={
 "search": [
  1224,
  768,
  0
 ],
 "reader": [
  560,
  800,
  0
 ],
 "folio": [
  1224,
  768,
  0
 ],
 "style-writer-rose": [
  1224,
  768,
  0
 ],
 "style-code-blue": [
  1224,
  768,
  0
 ],
 "style-omarchy-amber": [
  1224,
  768,
  0
 ],
 "finder": [
  1125,
  436,
  0
 ],
 "edit-after": [
  1116,
  768,
  0
 ],
 "edit-handoff": [
  1224,
  768,
  0
 ],
 "edit-selected": [
  1116,
  768,
  0
 ],
 "quicklook": [
  778,
  768,
  0
 ],
 "edit-before": [
  1116,
  768,
  0
 ],
 "edit-refreshed": [
  1224,
  768,
  0
 ],
 "edit-typed-1": [
  1116,
  768,
  0
 ],
 "edit-typed-3": [
  1116,
  768,
  0
 ],
 "edit-typed-2": [
  1116,
  768,
  0
 ]
};
function Screen({name,width=1120,style={},crop}:{name:string;width?:number;style?:React.CSSProperties;crop?:[number,number,number,number]}) {
 const [sw,sh,trim]=sizes[name];
 const [cx,cy,cw,ch]=crop||[0,trim,sw,sh-trim];
 const scale=width/cw;
 return <div style={{position:'absolute',width,height:ch*scale,borderRadius:17,overflow:'hidden',background:'#fff',boxShadow:'0 30px 85px #21132b22, 0 4px 16px #21132b0d',border:'1px solid #ffffff70',...style}}><Img src={shot(name)} style={{position:'absolute',width:sw*scale,height:sh*scale,maxWidth:'none',left:-cx*scale,top:-cy*scale}}/></div>;
}
function Key({pressed=false}:{pressed?:boolean}) {
 return <div style={{width:246,height:62,border:'1px solid '+(pressed?'#9c83b9':'#cac3d2'),borderBottomWidth:pressed?2:6,borderRadius:12,background:pressed?'#e0d5ee':'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:23,color:ink,transform:`translateY(${pressed?4:0}px)`,boxShadow:'0 7px 20px #3423470a'}}>space<span style={{marginLeft:22,fontSize:30,lineHeight:1}}>␣</span></div>;
}
function ClickPulse({x,y}:{x:number;y:number}) {
 const f=useCurrentFrame(); const ring=(f%15)/15;
 return <div style={{position:'absolute',left:x-27,top:y-27,width:54,height:54,border:'3px solid #b393d3',borderRadius:'50%',transform:`scale(${.6+ring*.7})`,opacity:1-ring}}/>;
}
function Pointer({x,y,click=false}:{x:number;y:number;click?:boolean}) {
 const f=useCurrentFrame(); const ring=(f%15)/15;
 return <div style={{position:'absolute',left:x,top:y}}>{click&&<div style={{position:'absolute',width:60,height:60,left:-27,top:-27,border:'3px solid #b393d3',borderRadius:'50%',transform:`scale(${.6+ring*.7})`,opacity:1-ring}}/>}<svg width="32" height="40" viewBox="0 0 24 30"><path d="M2 1v24l6-6 5 10 4-2-5-9h9z" fill="#2c2634" stroke="#fff" strokeWidth="1.8"/></svg></div>;
}
function Splash() {
 // Fully drawn from frame zero: this frame is also the shared video cover.
 return <AbsoluteFill style={{background:'#19181f',color:'#f5f3f8',fontFamily:sans,overflow:'hidden'}}>
  <div style={{position:'absolute',left:108,top:82,color:'#bda6d7',fontSize:17,letterSpacing:3.5,fontWeight:600}}>FOR THE MARKDOWN YOUR AI AGENT WRITES</div>
  <div style={{position:'absolute',left:108,top:233,width:870}}>
   <div style={{display:'flex',alignItems:'center',gap:27}}><Mark size={86} color="#d6c5e9"/><div style={{fontFamily:metal,fontSize:128,fontWeight:400,letterSpacing:1,textTransform:'uppercase',transform:'skewX(-5deg)',lineHeight:1.1}}>SlayDown<span style={{color:'#b79bd6'}}>.</span></div></div>
   <div style={{fontFamily:serif,fontSize:81,lineHeight:1.08,letterSpacing:-2.5,marginTop:39}}>Markdown.<br/>Beautifully read.</div>
   <div style={{display:'flex',alignItems:'center',gap:23,marginTop:49}}><Key/><span style={{fontSize:26,color:'#d6c5e9'}}>Select. Space. Read.</span></div>
   <div style={{fontSize:20,color:'#aaa0b4',marginTop:24}}>Instant preview in Finder on Mac.</div>
  </div>
  <Screen name="quicklook" width={730} style={{left:1080,top:173,boxShadow:'0 28px 75px #0006'}}/>
  <div style={{position:'absolute',left:108,bottom:66,color:'#b5aabd',fontSize:18,letterSpacing:2.3}}>MAC · WINDOWS · LINUX</div>
  <div style={{position:'absolute',right:110,bottom:66,color:'#b5aabd',fontSize:20}}>github.com/woodcreeper/slaydown</div>
 </AbsoluteFill>;
}
function AgentOutput() {
 const f=useCurrentFrame();
 return <Base dark><Brand dark label="FOR THE FILES YOUR AI AGENT LEAVES BEHIND"/><Copy eyebrow="THE WORK KEEPS MOVING" title={<>Your agent<br/>writes.</>} subtitle="Plans. READMEs. Research." dark y={314} size={95} width={660}/><div style={{position:'absolute',left:958,top:240,width:690}}>{['PLAN.md','README.md','RESEARCH.md','TASKS.md'].map((name,i)=><div key={name} style={{height:126,display:'flex',gap:28,alignItems:'center',borderBottom:'1px solid #38323f',opacity:tween(f,i*9,i*9+13,0,1),transform:`translateX(${tween(f,i*9,i*9+18,45,0)}px)`}}><div style={{width:52,height:64,border:'1.5px solid #81718f',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,color:'#bda6d7',fontFamily:'monospace'}}>md</div><span style={{fontSize:39,letterSpacing:-.6,color:i===0?'#f4edf9':'#aaa0b4'}}>{name}</span><span style={{marginLeft:'auto',color:'#bda6d7',fontSize:24}}>✓</span></div>)}</div><div style={{position:'absolute',left:108,bottom:104,color:'#9c92a7',fontSize:19}}>A folder full of ideas. One next step.</div></Base>;
}
function SelectFile() {
 const f=useCurrentFrame();
 return <Base><Brand label="START IN FINDER"/><Copy eyebrow="JUST A FILE OR TWO" title={<>You just<br/>need to read.</>} subtitle="Select a Markdown file in Finder." y={265} width={550}/><Screen name="finder" width={1130} style={{left:696,top:297,transform:`translateY(${tween(f,0,42,12,0)}px)`}}/><div style={{position:'absolute',left:109,top:726}}><Key pressed={f>=58}/></div>{f>=33&&f<46&&<ClickPulse x={776} y={410}/>}<div style={{position:'absolute',left:733,top:873,fontSize:18,color:muted}}>The plan your agent just wrote.</div></Base>;
}
function QuickLook() {
 const f=useCurrentFrame();
 return <Base><Brand label="ONE KEY. A BEAUTIFUL READ."/><Copy eyebrow="MACOS QUICK LOOK" title={<>Space.<br/>And there<br/>it is.</>} subtitle="Beautiful Markdown. Right in Finder." y={243} size={91} width={655}/><div style={{position:'absolute',left:110,top:778}}><Key pressed={f<11}/></div><Screen name="quicklook" width={817} style={{left:973,top:163,transform:`translateY(${tween(f,0,20,22,0)}px) scale(${tween(f,0,20,.98,1)})`,opacity:tween(f,0,14,0,1)}}/><div style={{position:'absolute',left:111,top:898,fontSize:18,color:muted}}>Headings. Quotes. Tasks. Already formatted.</div></Base>;
}
function OpenSlayDown() {
 const f=useCurrentFrame(); const opened=f>=30?1:0;
 return <Base><Brand label="KEEP THE SAME FILE. GO A LITTLE DEEPER."/><Copy eyebrow="WHEN YOU WANT MORE" title={<>Want to<br/>go deeper?</>} subtitle={<>Double-click.<br/>Open in SlayDown.</>} y={303} width={525}/><Screen name="finder" width={1120} style={{left:692,top:305,opacity:1-opened}}/>{f<30&&<ClickPulse x={772} y={415}/>}<Screen name="folio" width={1152} style={{left:690,top:170,opacity:opened,transform:`translateY(${tween(f,30,42,12,0)}px)`}}/><div style={{position:'absolute',left:107,bottom:118,fontSize:17,color:muted,maxWidth:430,lineHeight:1.6}}>Set SlayDown as your Markdown opener.</div></Base>;
}
function Features() {
 const f=useCurrentFrame();
 const active=f<33?0:f<66?1:2;
 const name=f<33?'folio':f<66?'search':f<99?'style-code-blue':f<132?'style-writer-rose':'style-omarchy-amber';
 const preset=f<99?{label:'VS Code preset · Blue tint',color:'#5776c8'}:f<132?{label:'iA Writer preset · Rose tint',color:'#b96683'}:{label:'Omarchy preset · Amber tint',color:'#a97735'};
 return <Base><Brand label="THE FULL SLAYDOWN READER"/><Copy eyebrow="YOUR NEXT LAYER" title={<>More room.<br/>More control.</>} y={269} size={75} width={560}/>
  <div style={{position:'absolute',left:108,top:569,width:424}}>{['Explore the outline','Search the document','Choose your style & tint'].map((label,k)=><div key={label} style={{display:'flex',alignItems:'center',gap:18,padding:'18px 0',borderBottom:'1px solid #ddd7e5',fontSize:25,color:active===k?ink:'#a59ead'}}><span style={{width:7,height:7,borderRadius:4,background:active===k?violet:'transparent'}}/>{label}</div>)}</div>
  <Screen name={name} width={1152} style={{left:690,top:170}}/>
  {active===2&&<div style={{position:'absolute',left:127,top:823,display:'flex',alignItems:'center',gap:13,fontSize:20,color:muted}}><span style={{width:15,height:15,borderRadius:'50%',background:preset.color}}/>{preset.label}</div>}
 </Base>;
}
function Handoff() {
 const f=useCurrentFrame();
 return <Base><Brand label="YOUR ORIGINAL FILE. YOUR FAVORITE EDITOR."/>
  <Copy eyebrow="MAKE THE NEXT CHANGE" title={<>Ready to<br/>make a<br/>change?</>} subtitle="Open in your local editor." y={248} size={81} width={530}/>
  <Screen name="edit-handoff" width={1152} style={{left:690,top:170}}/>
  <div style={{position:'absolute',left:110,bottom:101,fontSize:18,color:muted}}>The same PLAN.md. Right where it belongs.</div>
  {f>=25&&<Pointer x={tween(f,25,40,1720,1620)} y={tween(f,25,40,530,244)} click={f>=42&&f<56}/>}
 </Base>;
}
function Edit() {
 const f=useCurrentFrame();
 const name=f<25?'edit-before':f<40?'edit-selected':f<55?'edit-typed-1':f<70?'edit-typed-2':f<85?'edit-typed-3':'edit-after';
 return <Base><Brand label="EDIT IN THE APP YOU ALREADY LOVE."/>
  <Copy eyebrow="YOUR FAVORITE EDITOR" title={<>Make it<br/>yours.</>} subtitle={f<105?'Change the heading.':'Save your change.'} y={303} size={91} width={530}/>
  <Screen name={name} width={1120} crop={[240,44,650,410]} style={{left:710,top:190}}/>
  <div style={{position:'absolute',left:735,bottom:100,fontSize:19,color:muted}}>iA Writer · the original PLAN.md</div>
  {f>=105&&<div style={{position:'absolute',left:110,top:720,padding:'16px 26px',border:'1px solid #cac3d2',borderBottomWidth:4,borderRadius:12,background:f<126?'#e0d5ee':'#fff',fontSize:26}}>⌘ S <span style={{fontSize:20,color:muted,marginLeft:20}}>Saved</span></div>}
 </Base>;
}
function Refresh() {
 return <Base><Brand label="SAVE THERE. SEE IT HERE."/>
  <Copy eyebrow="AUTOMATICALLY UP TO DATE" title={<>SlayDown<br/>keeps up.</>} subtitle="Your saved change, beautifully rendered." y={290} size={85} width={550}/>
  <Screen name="edit-refreshed" width={1152} style={{left:690,top:170}}/>
  <div style={{position:'absolute',left:110,bottom:101,fontSize:18,color:muted}}>No reopening. Just keep reading.</div>
 </Base>;
}
function Outro() {
 return <Base dark><Brand dark label="READ IT. THEN KEEP BUILDING."/><div style={{position:'absolute',left:106,top:235,width:910}}><div style={{display:'flex',alignItems:'center',gap:25}}><Mark size={86} color="#d6c5e9"/><div style={{fontFamily:metal,fontSize:132,fontWeight:400,letterSpacing:1,textTransform:'uppercase',transform:'skewX(-5deg)',lineHeight:1.1}}>SlayDown<span style={{color:'#b79bd6'}}>.</span></div></div><div style={{fontFamily:serif,fontSize:55,lineHeight:1.17,letterSpacing:-1,color:'#e5ddeb',marginTop:30}}>From agent output<br/>to a beautiful read.</div><div style={{fontSize:23,color:'#b5aabd',marginTop:37}}>Preview. Explore. Edit in your own app.</div><div style={{fontSize:17,letterSpacing:2.5,color:'#c7bdd0',marginTop:62}}>MAC &nbsp;·&nbsp; WINDOWS &nbsp;·&nbsp; LINUX</div><div style={{fontSize:16,color:'#9689a3',marginTop:14}}>Space bar preview on Mac</div><div style={{fontSize:25,color:'#f2edf8',marginTop:44}}>github.com/woodcreeper/slaydown</div></div><Screen name="quicklook" width={663} style={{left:1160,top:214,transform:'rotate(2deg)',boxShadow:'0 35px 90px #0005'}}/></Base>;
}
export function SlayDownFilm() {
 const {brandFont} = getInputProps<{brandFont:string}>();
 const [fontHandle] = useState(() => delayRender('Loading SlayDown wordmark'));
 useEffect(() => {
   const font = new FontFace('Metal Mania', `url(${brandFont})`);
   font.load().then(loaded => {document.fonts.add(loaded); continueRender(fontHandle);}).catch(cancelRender);
 }, [brandFont,fontHandle]);
 const scenes={splash:Splash,agent:AgentOutput,finder:SelectFile,quicklook:QuickLook,open:OpenSlayDown,features:Features,handoff:Handoff,edit:Edit,refresh:Refresh,outro:Outro};
 return <AbsoluteFill style={{background:paper}}><Audio src={staticFile('eyesplit.m4a')} volume={1}/>{Object.entries(scenes).map(([name,Scene])=>{
  const [from,durationInFrames]=timeline.scenes[name as keyof typeof timeline.scenes];
  return <Sequence key={name} from={from} durationInFrames={durationInFrames}><Scene/></Sequence>;
 })}</AbsoluteFill>;
}
