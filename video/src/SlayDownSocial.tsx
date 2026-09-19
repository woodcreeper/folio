import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Composition, Img, registerRoot, staticFile, getInputProps, delayRender, continueRender, cancelRender} from 'remotion';

const serif = '"Iowan Old Style", "Baskerville", Georgia, serif';
const sans = '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';

function SlayDownSocial() {
  const {brandFont} = getInputProps<{brandFont: string}>();
  const [fontHandle] = useState(() => delayRender('Loading bundled wordmark font'));
  useEffect(() => {
    const font = new FontFace('Metal Mania', `url(${brandFont})`);
    font.load().then(loaded => { document.fonts.add(loaded); continueRender(fontHandle); }).catch(cancelRender);
  }, [brandFont, fontHandle]);
  return <AbsoluteFill style={{background:'#19181f', color:'#f5f3f8', fontFamily:sans, overflow:'hidden'}}>
    <div style={{position:'absolute', left:64, top:48, color:'#bda6d7', fontSize:12, fontWeight:600, letterSpacing:2.1}}>FOR THE MARKDOWN YOUR AI AGENT WRITES</div>
    <div style={{position:'absolute', left:61, top:109, display:'flex', alignItems:'center', gap:19}}>
      <svg width="53" height="53" viewBox="0 0 64 64"><path d="M49 14H24L13 25v12h27v6H14v10h28l10-10V27H25v-3h24z" fill="#d6c5e9"/><path d="m49 7-8 10h7l-4 9 13-14h-8l4-5z" fill="#ad82dc"/></svg>
      <div style={{fontFamily:'"Metal Mania", fantasy', fontSize:88, fontWeight:400, letterSpacing:1, textTransform:'uppercase', transform:'skewX(-5deg)', lineHeight:1.1}}>SlayDown<span style={{color:'#b79bd6'}}>.</span></div>
    </div>
    <div style={{position:'absolute', left:64, top:244, fontFamily:serif, fontSize:65, lineHeight:1.09, letterSpacing:-1.7}}>Markdown.<br/>Beautifully read.</div>
    <div style={{position:'absolute', left:64, top:427, display:'flex', alignItems:'center', gap:22}}>
      <div style={{width:158, height:51, border:'1px solid #c4bace', borderBottomWidth:5, borderRadius:10, background:'#fff', color:'#29282f', display:'flex', alignItems:'center', justifyContent:'center', gap:22, fontSize:19}}>space <span style={{fontSize:26}}>␣</span></div>
      <span style={{fontSize:22, color:'#d6c5e9', letterSpacing:-.4}}>Select. Space. Read.</span>
    </div>
    <div style={{position:'absolute', left:64, top:504, fontSize:16, color:'#b5aabd'}}>Instant Markdown preview in Finder on Mac.</div>
    <div style={{position:'absolute', left:709, top:55, width:503, height:497, borderRadius:15, overflow:'hidden', boxShadow:'0 22px 60px #0008', border:'1px solid #ffffff55', background:'#fff'}}>
      <Img src={staticFile('screenshots/slaydown-reader.png')} style={{display:'block', width:'100%', height:'100%', objectFit:'contain'}}/>
    </div>
    <div style={{position:'absolute', left:64, bottom:38, fontSize:12, letterSpacing:2, color:'#b5aabd'}}>MAC · WINDOWS · LINUX</div>
    <div style={{position:'absolute', right:68, bottom:37, fontSize:15, color:'#b5aabd'}}>github.com/woodcreeper/slaydown</div>
  </AbsoluteFill>;
}

registerRoot(() => <Composition id="SlayDownSocial" component={SlayDownSocial} durationInFrames={1} fps={30} width={1280} height={640}/>);
