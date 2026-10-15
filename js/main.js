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

  // Navegação acessível para mobile e tablet, com fechamento pelo link, Escape ou clique fora.
  const menuToggle=nav.querySelector('.sf-menu-toggle');
  const menu=nav.querySelector('.sf-menu');
  const closeMenu=()=>{
    nav.classList.remove('sf-menu-open');
    menuToggle.setAttribute('aria-expanded','false');
    menuToggle.setAttribute('aria-label','Abrir menu de navegação');
  };
  menuToggle.addEventListener('click',()=>{
    const open=!nav.classList.contains('sf-menu-open');
    nav.classList.toggle('sf-menu-open',open);
    menuToggle.setAttribute('aria-expanded',String(open));
    menuToggle.setAttribute('aria-label',open?'Fechar menu de navegação':'Abrir menu de navegação');
  });
  menu.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('sf-menu-open')){closeMenu();menuToggle.focus();}});
  document.addEventListener('pointerdown',e=>{if(nav.classList.contains('sf-menu-open')&&!nav.contains(e.target))closeMenu();});
  matchMedia('(min-width: 981px)').addEventListener('change',e=>{if(e.matches)closeMenu();});
  // Webhook direto da LP estática. Dados do lead + atribuição são enviados em um único POST.
  const MAKE_WEBHOOK_URL='https://hook.us1.make.celonis.com/14fp11ov9z2bxivmt301qyg8nbx86c2w';
  const WHATSAPP_NUMBER='5511924862165';
  const TRACKING_SESSION_KEY='stopfire_lead_attribution_v2';
  const TRACKING_KEYS=[
    'utm_source','utm_medium','utm_campaign','utm_term','utm_content','utm_id',
    'gclid','gbraid','wbraid','dclid','fbclid','msclkid','ttclid','twclid',
    'li_fat_id','srsltid','gad_source','gad_campaignid',
    'campaign_id','adset_id','ad_id','campaign','adset','ad',
    'campanha','conjunto_grupo','anuncio_criativo','palavra_chave','tema','visivel'
  ];
  const TRACKING_RESERVED=new Set(['__proto__','prototype','constructor']);
  // Parâmetros de autenticação são removidos dos metadados e URLs para não registrar credenciais.
  const TRACKING_SECRET=/^(?:access_token|refresh_token|id_token|token|auth|authorization|password|passwd|senha|secret|api[_-]?key|client_secret|jwt|session_token|oauth_token|code)$/i;
  const limited=(value,max=600)=>String(value??'').slice(0,max);
  const trackingIsSafeKey=(key)=>!TRACKING_SECRET.test(key)&&!TRACKING_RESERVED.has(key.toLowerCase());
  const readUrlParams=(search)=>{
    const entries={};
    try{
      const params=new URLSearchParams(search);
      for(const [key,value] of params){
        if(!trackingIsSafeKey(key)||Object.keys(entries).length>=60&&!Object.hasOwn(entries,key))continue;
        // Suporta vários valores para o mesmo parâmetro, mantendo-os legíveis no Make.
        entries[key]=Object.hasOwn(entries,key)?`${entries[key]} | ${limited(value,200)}`:limited(value,200);
      }
    }catch(err){}
    return entries;
  };
  const safeTrackingUrl=(href)=>{
    if(!href)return '';
    try{
      const url=new URL(href,location.href);
      for(const key of [...url.searchParams.keys()]){
        if(!trackingIsSafeKey(key))url.searchParams.delete(key);
      }
      return limited(url.href,4000);
    }catch(err){return '';}
  };
  const currentUrlParams=readUrlParams(location.search);
  const firstTouch=(()=>{
    let state=null;
    try{state=JSON.parse(sessionStorage.getItem(TRACKING_SESSION_KEY)||'null');}catch(err){}
    if(!state||!state.landing_page||typeof state.params!=='object'||!state.params){
      state={landing_page:safeTrackingUrl(location.href),landing_referrer:safeTrackingUrl(document.referrer),landing_at:new Date().toISOString(),landing_params:currentUrlParams,params:{}};
    }
    state.params={...state.params,...currentUrlParams};
    try{sessionStorage.setItem(TRACKING_SESSION_KEY,JSON.stringify(state));}catch(err){}
    return state;
  })();
  const attributionParams=()=>({...firstTouch.params,...readUrlParams(location.search)});
  const cookieValue=(name)=>{
    try{
      const item=document.cookie.split(';').map(c=>c.trim()).find(c=>c.startsWith(name+'='));
      return item?limited(decodeURIComponent(item.slice(name.length+1)),400):'';
    }catch(err){return '';}
  };
  const gaClientId=()=>{
    const value=cookieValue('_ga');
    return /^GA\d+\.\d+\./.test(value)?value.split('.').slice(2).join('.'):'';
  };
  const trafficSource=()=>{
    const p=attributionParams();
    if(p.utm_source)return p.utm_source;
    if(p.gclid||p.gbraid||p.wbraid)return 'google_ads';
    if(p.fbclid)return 'meta_ads';
    if(p.msclkid)return 'microsoft_ads';
    if(firstTouch.landing_referrer){try{return new URL(firstTouch.landing_referrer).hostname;}catch(err){return 'referencia';}}
    return 'direto';
  };
  const deviceType=()=>innerWidth<=760?'mobile':innerWidth<=1024?'tablet':'desktop';
  const userBrowser=()=>{
    const ua=navigator.userAgent||'';
    return /Edg\//.test(ua)?'Edge':/Firefox\//.test(ua)?'Firefox':/Chrome\//.test(ua)?'Chrome':/Safari\//.test(ua)?'Safari':'Outro';
  };
  function buildTracking(formValues,doorType){
    const params=attributionParams();
    const valueFor=(key)=>params[key]||params[Object.keys(params).find(k=>k.toLowerCase()===key)]||'';
    const now=new Date();
    let timezone='';
    try{timezone=Intl.DateTimeFormat().resolvedOptions().timeZone||'';}catch(err){}
    const payload={
      // Campos existentes: manter os nomes para não quebrar o cenário atual do Make.
      nome:formValues[0],whatsapp:formValues[1],telefone:formValues[1].replace(/\D/g,''),
      cidade:formValues[2],tipo_porta:doorType,medida:formValues[3],
      site:'StopFire',empresa_marca:'StopFire',origem:'landing_page',origem_visita:trafficSource(),conversao:'solicitacao_orcamento',
      form_id:'stopfire-orcamento',form_name:'Solicite a cotação',form_type:'orcamento',
      pagina:safeTrackingUrl(location.href),page_url:safeTrackingUrl(location.href),
      page_title:limited(document.title,300),page_path:location.pathname,
      dominio:location.hostname,query_string:limited(new URLSearchParams(Object.entries(currentUrlParams)).toString(),4000),
      referrer:safeTrackingUrl(document.referrer),
      landing_page:firstTouch.landing_page,landing_referrer:firstTouch.landing_referrer,
      landing_at:firstTouch.landing_at,
      submitted_at:now.toISOString(),timestamp:now.toISOString(),enviado_em:now.toISOString(),data_hora_conversao:now.toISOString(),
      // IDs de anúncio + UTMs explícitos para colunas diretas no Make / Sheets / CRM.
      ...Object.fromEntries(TRACKING_KEYS.map(key=>[key,valueFor(key)])),
      // Outros parâmetros da URL: não se perde o que não foi previsto na campanha.
      url_parametros:JSON.stringify(params),
      url_parametros_atuais:JSON.stringify(readUrlParams(location.search)),
      url_parametros_entrada:JSON.stringify(firstTouch.landing_params||{}),
      fbp:cookieValue('_fbp'),fbc:cookieValue('_fbc'),
      ga_client_id:gaClientId(),ga_cookie:cookieValue('_ga'),
      user_agent:limited(navigator.userAgent||'',600),browser:userBrowser(),
      idioma:limited(navigator.language||'',40),timezone,
      screen_width:screen.width,screen_height:screen.height,
      viewport_width:innerWidth,viewport_height:innerHeight,device_pixel_ratio:devicePixelRatio||1,
      device_type:deviceType(),
      lead_id:typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function'?crypto.randomUUID():`sf-${Date.now()}-${Math.random().toString(36).slice(2,10)}`
    };
    // Todas as UTMs adicionais e parâmetros personalizados também ficam em colunas individuais.
    // Prefixo param_ evita que uma query sobrescreva os dados preenchidos no formulário.
    for(const [key,value] of Object.entries(params)){
      if(!trackingIsSafeKey(key))continue;
      const flatKey='param_'+key.replace(/[^a-z\d_]/gi,'_').slice(0,70);
      if(flatKey!=='param_'&&!Object.hasOwn(payload,flatKey))payload[flatKey]=value;
      if(/^utm_[a-z\d_]+$/i.test(key)&&!Object.hasOwn(payload,key))payload[key]=value;
    }
    return payload;
  }
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
    if(i===1){
      // Máscara brasileira: (11) 91234-5678. Também aceita colagem com +55.
      input.inputMode='numeric';
      input.autocomplete='tel-national';
      const formatPhone=(raw)=>{
        let digits=String(raw||'').replace(/\D/g,'');
        if(digits.length>11&&digits.startsWith('55'))digits=digits.slice(2);
        digits=digits.slice(0,11);
        if(!digits)return '';
        if(digits.length<=2)return '('+digits+(digits.length===2?') ':'');
        const area=digits.slice(0,2),number=digits.slice(2);
        const split=digits.length===10&&digits[2]!=='9'?4:5;
        return '('+area+') '+(number.length>split?number.slice(0,split)+'-'+number.slice(split):number);
      };
      const digitsBefore=(text,pos)=>text.slice(0,pos).replace(/\D/g,'').length;
      const positionAfterDigits=(text,count)=>{
        if(!count)return 0;
        let seen=0;
        for(let pos=0;pos<text.length;pos++){
          if(/\d/.test(text[pos])&&++seen===count)return pos+1;
        }
        return text.length;
      };
      input.addEventListener('input',()=>{
        const original=input.value,selection=input.selectionStart??original.length;
        const count=digitsBefore(original,selection),masked=formatPhone(original);
        if(original!==masked){
          input.value=masked;
          if(document.activeElement===input)input.setSelectionRange(positionAfterDigits(masked,count),positionAfterDigits(masked,count));
        }
      });
    }
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
  submit.type='button';
  submit.setAttribute('aria-label','Enviar solicitação de orçamento');
  submit.setAttribute('aria-disabled','false');
  const status=formPanel.querySelector('.sf-form-status');
  status.setAttribute('role','status');
  status.setAttribute('aria-live','polite');
  let sending=false;
  let completed=false;

  // A confirmação substitui o formulário dentro do MESMO card, sem redirecionar a LP.
  function showConfirmation(whatsappUrl,doorType,tracking){
    completed=true;
    formPanel.classList.add('sf-form-completed');
    const confirmation=document.createElement('div');
    confirmation.className='sf-form-success';
    confirmation.setAttribute('role','status');
    confirmation.setAttribute('aria-live','polite');
    confirmation.innerHTML=`
      <span class="sf-form-success-icon" aria-hidden="true">
        <svg viewBox="0 0 48 48" width="38" height="38" fill="none" focusable="false"><path d="M10 24.5 19.5 34 39 14" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </span>
      <div class="sf-form-success-label">STOP FIRE • ORÇAMENTOS</div>
      <h3 tabindex="-1">Mensagem enviada!</h3>
      <p>Sua solicitação de orçamento foi encaminhada. Você também pode continuar o atendimento pelo WhatsApp.</p>
      <a class="sf-form-success-link" target="_blank" rel="noopener noreferrer">Continuar no WhatsApp <span aria-hidden="true">→</span></a>
      <div class="sf-form-success-note">Resposta em até 2 horas em dias úteis, das 8h às 18h.</div>
    `;
    const whatsappLink=confirmation.querySelector('a');
    whatsappLink.href=whatsappUrl;
    whatsappLink.addEventListener('click',()=>{
      window.dataLayer=window.dataLayer||[];
      window.dataLayer.push({event:'whatsapp_form_open',channel:'whatsapp',form_type:'orcamento',door_type:doorType,lead_id:tracking.lead_id});
    });
    formPanel.replaceChildren(confirmation);
    confirmation.querySelector('h3').focus({preventScroll:true});
    window.dataLayer=window.dataLayer||[];
    // O evento indica despacho pelo navegador, não confirmação de processamento no Make.
    window.dataLayer.push({event:'lead_form_submit',channel:'make',form_type:'orcamento',door_type:doorType,lead_id:tracking.lead_id,form_id:tracking.form_id,utm_source:tracking.utm_source,utm_medium:tracking.utm_medium,utm_campaign:tracking.utm_campaign,gclid:tracking.gclid,fbclid:tracking.fbclid,page_url:tracking.page_url,dispatch_status:'queued'});
  }

  async function send(){
    if(sending||completed)return;
    const inputs=fields.map(el=>el.querySelector('input,textarea'));
    const values=inputs.map(input=>input.value.trim());
    if(!values[0]){inputs[0].setCustomValidity('Informe seu nome para solicitar a cotação.');inputs[0].reportValidity();inputs[0].focus();return;}
    const digits=values[1].replace(/\D/g,'');
    if(digits.length<10||digits.length>13){inputs[1].setCustomValidity('Informe seu WhatsApp com DDD.');inputs[1].reportValidity();inputs[1].focus();return;}
    const type=formPanel.querySelector('[aria-pressed="true"]')?.textContent.trim()||'Não informado';
    const payload=buildTracking(values,type);
    const message=[
      'Olá! Gostaria de solicitar um orçamento na StopFire. 🔥🚪','',
      'Nome: '+values[0],
      'WhatsApp: '+values[1],
      'Cidade / UF: '+(values[2]||'Não informado'),
      'Tipo de porta: '+type,
      'Medida do vão: '+(values[3]||'Não informado'),
      '', 'Enviado pela landing page StopFire.'
    ].join('\n');
    const whatsappUrl='https://wa.me/'+WHATSAPP_NUMBER+'?text='+encodeURIComponent(message);
    const body=new URLSearchParams(payload);
    sending=true;
    submit.setAttribute('aria-disabled','true');
    status.textContent='Enviando solicitação...';

    // sendBeacon enfileira o envio sem navegar; WhatsApp abre apenas se o lead clicar no botão.
    // Make não expõe confirmação de recebimento por CORS: não afirmar que o cenário foi processado.
    let queued=false;
    try{if(navigator.sendBeacon)queued=navigator.sendBeacon(MAKE_WEBHOOK_URL,body);}catch(err){queued=false;}
    if(queued){
      showConfirmation(whatsappUrl,type,payload);
      return;
    }
    // Se Beacon não conseguir enfileirar, tentar POST no-cors; a UI só muda após despacho.
    const request=fetch(MAKE_WEBHOOK_URL,{method:'POST',mode:'no-cors',body,keepalive:true,credentials:'omit'});
    try{
      await request;
      showConfirmation(whatsappUrl,type,payload);
    }catch(err){
      status.textContent='Não foi possível enviar automaticamente. Confira sua conexão e tente novamente, ou continue pelo WhatsApp.';
      sending=false;
      submit.setAttribute('aria-disabled','false');
    }
  }
  submit.addEventListener('click',send);
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
