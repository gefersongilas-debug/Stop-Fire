(() => {
  'use strict';
  const page=document.querySelector('.sf-page'),hero=document.querySelector('.sf-hero'),nav=document.querySelector('.sf-nav');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover: hover) and (pointer: fine) and (min-width: 761px)');
  let motion=!reduced.matches&&fine.matches;
  const decorations=['grid','orbit','points'].map((name,i)=>{const el=document.createElement('span');el.className='sf-decor sf-decor-'+name;el.setAttribute('aria-hidden','true');hero.append(el);return {el,depth:[3,9,15][i]};});
  const dot=document.createElement('span'),ring=document.createElement('span'),progress=document.createElement('span');dot.className='sf-cursor-dot';ring.className='sf-cursor-ring';progress.className='sf-progress';[dot,ring,progress].forEach(el=>{el.setAttribute('aria-hidden','true');document.body.append(el);});
  const revealTargets=[...document.querySelectorAll('h1,h2,.sf-hero .sf-container>div>div,.sf-hero p,.sf-card,.sf-proof .sf-grid>div,.sf-process .sf-grid>div,.sf-faq .sf-container>div:last-child>div,.sf-closing .sf-container>*')];
  let observer;
  if('IntersectionObserver' in window&&!reduced.matches){
    observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('sf-enter');entry.target.closest('.sf-grid')?.style.setProperty('--line-progress','1');observer.unobserve(entry.target);}}),{threshold:.08,rootMargin:'0px 0px -20px 0px'});
    revealTargets.forEach((el,i)=>{el.classList.add('sf-reveal');el.style.setProperty('--delay',`${Math.min(i%3*85,170)}ms`);observer.observe(el);});
    const headline=hero.querySelector('h1');headline.style.setProperty('--delay','170ms');hero.querySelector('p').style.setProperty('--delay','290ms');hero.querySelector('.h-red').parentElement.style.setProperty('--delay','400ms');
  }
  // Mantém o formulário visual original e envia a cotação ao WhatsApp comercial.
  const WHATSAPP_NUMBER='5511924862165';
  const formPanel=document.querySelector('.sf-contact .sf-card');
  const fields=[...formPanel.querySelectorAll('div[style*="color:#6d6d6d"]')];
  fields.forEach((el,i)=>{
    el.classList.add('sf-field');
    const input=document.createElement(i===3?'textarea':'input');
    input.setAttribute('aria-label',el.previousElementSibling.textContent.trim());
    input.setAttribute('placeholder',' ');
    input.name=['nome','whatsapp','cidade','medida'][i];
    if(i<3){input.type=i===1?'tel':'text';input.autocomplete=['name','tel','address-level2'][i];}
    if(i<2){input.required=true;input.addEventListener('input',()=>input.setCustomValidity(''));}
    el.append(input);
  });
  const typeLabel=[...formPanel.querySelectorAll('div')].find(el=>el.childElementCount===0&&el.textContent.trim()==='Tipo de porta');
  if(typeLabel){
    const choices=[...typeLabel.nextElementSibling.children];
    choices.forEach((el,i)=>{
      el.classList.add('sf-choice');el.setAttribute('role','button');el.tabIndex=0;el.setAttribute('aria-pressed',String(i===0));
      const choose=()=>choices.forEach(item=>item.setAttribute('aria-pressed',String(item===el)));
      el.addEventListener('click',choose);
      el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}});
    });
  }
  const submit=[...formPanel.children].find(el=>el.style.justifyContent==='center');
  submit.classList.add('sf-submit');
  submit.setAttribute('role','button');submit.tabIndex=0;
  submit.setAttribute('aria-label','Enviar solicitação de orçamento pelo WhatsApp');
  submit.setAttribute('aria-disabled','false');
  function send(){
    const inputs=fields.map(el=>el.querySelector('input,textarea'));
    const values=inputs.map(input=>input.value.trim());
    if(!values[0]){inputs[0].setCustomValidity('Informe seu nome para solicitar a cotação.');inputs[0].reportValidity();inputs[0].focus();return;}
    const digits=values[1].replace(/\D/g,'');
    if(digits.length<10||digits.length>13){inputs[1].setCustomValidity('Informe seu WhatsApp com DDD.');inputs[1].reportValidity();inputs[1].focus();return;}
    const type=formPanel.querySelector('[aria-pressed="true"]')?.textContent.trim()||'Não informado';
    const message=[
      'Olá! Gostaria de solicitar um orçamento na StopFire. 🔥🚪','',
      'Nome: '+values[0],
      'WhatsApp: '+values[1],
      'Cidade / UF: '+(values[2]||'Não informado'),
      'Tipo de porta: '+type,
      'Medida do vão: '+(values[3]||'Não informado'),
      '', 'Enviado pela landing page StopFire.'
    ].join('\n');
    window.dataLayer=window.dataLayer||[];
    // Evento sem dados pessoais: compatível com tags de conversão no GTM.
    window.dataLayer.push({event:'whatsapp_form_open',channel:'whatsapp',form_type:'orcamento',door_type:type});
    window.open('https://wa.me/'+WHATSAPP_NUMBER+'?text='+encodeURIComponent(message),'_blank','noopener,noreferrer');
  }
  submit.addEventListener('click',send);
  submit.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();send();}});
  document.querySelectorAll('a[href^="https://wa.me/5511924862165"]').forEach(link=>{
    link.addEventListener('click',()=>{
      const section=link.closest('section,header,footer');
      window.dataLayer=window.dataLayer||[];
      window.dataLayer.push({event:'whatsapp_click',channel:'whatsapp',click_location:section?.classList[0]||'pagina'});
    });
  });
  const ctas=[...document.querySelectorAll('.h-red,.h-ghost,.h-dark')];
  let metrics=[],card=null,cardRect=null,raf=0,dirty=true,visible=true;
  const pointer={x:innerWidth/2,y:innerHeight/2,rx:innerWidth/2,ry:innerHeight/2,active:false,hover:false,scale:1};
  const image=hero.querySelector('img');let heroRect=hero.getBoundingClientRect();
  function measure(){metrics=ctas.map(el=>({el,rect:el.getBoundingClientRect()}));heroRect=hero.getBoundingClientRect();dirty=true;wake();}
  function wake(){if(!raf&&visible)raf=requestAnimationFrame(frame);}
  function frame(){raf=0;if(!visible)return;const y=window.scrollY,max=document.documentElement.scrollHeight-innerHeight;progress.style.setProperty('--progress',max>0?y/max:0);nav.classList.toggle('sf-scrolled',y>28);
    let unsettled=false;
    if(motion){
      pointer.rx+=(pointer.x-pointer.rx)*.16;pointer.ry+=(pointer.y-pointer.ry)*.16;const target=pointer.hover?1.65:1;pointer.scale+=(target-pointer.scale)*.12;
      dot.style.transform=`translate3d(${pointer.x-2.5}px,${pointer.y-2.5}px,0)`;ring.style.transform=`translate3d(${pointer.rx-17}px,${pointer.ry-17}px,0) scale(${pointer.scale})`;
      unsettled=Math.abs(pointer.rx-pointer.x)+Math.abs(pointer.ry-pointer.y)+Math.abs(target-pointer.scale)>.08;
      if(dirty){const nx=pointer.active?(pointer.x/innerWidth-.5)*2:0,ny=pointer.active?(pointer.y/innerHeight-.5)*2:0;
        if(heroRect.bottom>0&&heroRect.top<innerHeight){decorations.forEach(({el,depth})=>{el.style.setProperty('--px',nx*depth+'px');el.style.setProperty('--py',ny*depth+Math.min(y,900)*depth*.009+'px');});image.style.setProperty('--px',nx*5+'px');image.style.setProperty('--py',ny*5+Math.min(y,900)*.028+'px');hero.style.setProperty('--hx',pointer.x-heroRect.left+'px');hero.style.setProperty('--hy',pointer.y-heroRect.top+'px');}
        metrics.forEach(({el,rect:r})=>{const dx=pointer.x-(r.left+r.width/2),dy=pointer.y-(r.top+r.height/2);const near=pointer.active&&Math.abs(dx)<r.width/2+28&&Math.abs(dy)<r.height/2+28;el.style.setProperty('--mx',near?Math.max(-7,Math.min(7,dx*.065))+'px':'0px');el.style.setProperty('--my',near?Math.max(-5,Math.min(5,dy*.11))+'px':'0px');el.style.setProperty('--ms',near?'1.018':'1');el.style.setProperty('--lx',pointer.x-r.left+'px');el.style.setProperty('--ly',pointer.y-r.top+'px');});
        if(card&&cardRect){const r=cardRect,x=(pointer.x-r.left)/r.width-.5,y=(pointer.y-r.top)/r.height-.5;card.style.setProperty('--rx',-y*2+'deg');card.style.setProperty('--ry',x*2+'deg');card.style.setProperty('--cx',x*2+'px');card.style.setProperty('--cy',y*2+'px');card.style.setProperty('--lx',pointer.x-r.left+'px');card.style.setProperty('--ly',pointer.y-r.top+'px');}
      }
    }dirty=false;if(unsettled)wake();
  }
  const resetCard=()=>{if(card){['--rx','--ry','--cx','--cy'].forEach(p=>card.style.removeProperty(p));}card=null;cardRect=null;};
  document.addEventListener('pointermove',e=>{if(!motion||e.pointerType==='touch')return;pointer.x=e.clientX;pointer.y=e.clientY;pointer.active=true;document.body.classList.add('sf-cursor-active');dirty=true;wake();},{passive:true});
  document.addEventListener('pointerover',e=>{if(!motion)return;pointer.hover=!!e.target.closest('a,button,input,textarea,.sf-choice');document.body.classList.toggle('sf-cursor-hover',pointer.hover);const next=e.target.closest('.sf-card');if(next!==card){resetCard();card=next;cardRect=card?.getBoundingClientRect();}dirty=true;wake();},{passive:true});
  function leave(){pointer.active=false;document.body.classList.remove('sf-cursor-active');resetCard();dirty=true;wake();}
  document.documentElement.addEventListener('pointerleave',leave);window.addEventListener('blur',leave);
  let scrollScheduled=false;
  window.addEventListener('scroll',()=>{if(scrollScheduled)return;scrollScheduled=true;requestAnimationFrame(()=>{scrollScheduled=false;resetCard();measure();});},{passive:true});
  window.addEventListener('resize',measure,{passive:true});
  document.addEventListener('visibilitychange',()=>{visible=!document.hidden;if(!visible){cancelAnimationFrame(raf);raf=0;leave();}else measure();});
  function preferences(){motion=!reduced.matches&&fine.matches;leave();if(!motion){decorations.concat([{el:image}]).forEach(({el})=>{el.style.removeProperty('--px');el.style.removeProperty('--py');});ctas.forEach(el=>['--mx','--my','--ms'].forEach(p=>el.style.removeProperty(p)));}if(reduced.matches){observer?.disconnect();revealTargets.forEach(el=>el.classList.remove('sf-enter'));}measure();}
  reduced.addEventListener('change',preferences);fine.addEventListener('change',preferences);
  document.fonts?.ready.then(measure);window.addEventListener('load',measure);measure();
})();
