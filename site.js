
const assets = BUILD_ASSETS
const css = BUILD_CSS
const client = BUILD_CLIENT
const seed = JSON.parse(BUILD_SEED)
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const link = value => /^(\/(?!\/)[\w/?.=#%&-]*|https:\/\/|mailto:|tel:|#[\w-]+$)/i.test(value ?? '') ? escape(value) : ''
const image = (url, alt = '', eager = false) => link(url) ? '<img src="'+link(url)+'" alt="'+escape(alt)+'" '+(eager?'fetchpriority="high"':'loading="lazy"')+'>' : ''
const color = (value, fallback) => /^#[\da-f]{6}$/i.test(value) ? value : fallback
const button = (href, title) => '<a class="button" href="'+link(href)+'">'+escape(title)+' <span aria-hidden="true">→</span></a>'
const text = (body, status = 200, type = 'text/html; charset=utf-8') => new Response(body,{status,headers:{'content-type':type,'x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin'}})
const json = (data, status = 200) => Response.json(data,{status,headers:{'cache-control':'no-store'}})
const shell = (lang, title, body, description = '') => '<!doctype html><html lang="'+lang+'" dir="'+(lang==='ar'?'rtl':'ltr')+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>'+escape(title)+'</title><meta name="description" content="'+escape(description)+'"><link rel="stylesheet" href="/site.css"><script src="/client.js" defer></script></head>'+body+'</html>'
function card(item, section, u, index) {
  return '<article data-category="'+escape(item.description)+'">'+image(item.image,item.title)+'<div class="card-body"><span class="symbol" aria-hidden="true">'+(section==='process'?String(index+1).padStart(2,'0'):['◈','◎','⚙','◇'][index%4])+'</span><h3>'+escape(item.title)+'</h3><p>'+escape(item.displayDescription||item.description)+'</p>'+(section==='services'||item.href?(section==='services'?'<a class="button" aria-label="'+escape(u.more+' — '+item.title)+'" href="'+link(item.href||'#contact')+'"><span aria-hidden="true">→</span></a>':button(item.href,u.more)):'')+'</div></article>'
}
function home(lang, data, route = "", entry) {
  const {ui:u,sections}=data
  const navigation=['about','services','products','projects','articles']
  const visibleSections=navigation.map(id=>sections.find(section=>section.id===id)).filter(section=>section?.items.length)
  const nav=visibleSections.map(section=>sectionLink(section,lang,route)).join('')
  const headerNav='<a href="/?lang='+lang+'"'+(route?'':' aria-current="page"')+'>'+escape(u.home)+'</a>'+nav
  const contactHref='/contact?lang='+lang
  const contactLink='<a href="'+contactHref+'"'+(route==='contact'?' aria-current="page"':'')+'>'+escape(u.contact)+'</a>'
  const consultHref=route&&route!=='contact'?contactHref+'#contact':'#contact'
  const contacts = data.contactLinks.map(item=>'<a href="'+link(item.href)+'"><span aria-hidden="true">'+(item.href.startsWith('tel:')?'☎':item.href.startsWith('mailto:')?'✉':'⌖')+'</span>'+escape(item.title)+'</a>').join('')
  const logo = brandMark(data,lang)
  const services = sections.find(s=>s.id==='services')?.items ?? []
  const other=lang==='ar'?'en':'ar'
  const proof=data.homeProof
  const video=data.video||proof.video
  const testimonials=sections.find(section=>section.id==='testimonials')
  const body = '<body style="--green:'+color(data.green,'#063328')+';--orange:'+color(data.orange,'#f58220')+'"><header><div class="top"><div class="wrap">'+contacts+socialLinks(data.socialLinks)+'</div></div><div class="nav wrap">'+logo+'<details class="mobile"><summary aria-label="'+escape(u.quick)+'">☰</summary><nav>'+headerNav+contactLink+'</nav></details><nav class="desktop">'+headerNav+contactLink+'</nav><a lang="'+other+'" href="/'+route+(entry?'/'+entry.slug:'')+'?lang='+other+'">'+(lang==='ar'?'EN':'عربي')+'</a>'+button(consultHref,u.consult)+'</div></header><main><section class="hero">'+homeHeroImage(data.hero)+'<div class="wrap hero-copy"><span class="eyebrow">'+escape(data.tagline)+'</span><h1>'+escape(data.headline)+'</h1><p class="subtitle">'+escape(data.subtitle)+(data.subtitleAccent?' <strong class="accent">'+escape(data.subtitleAccent)+'</strong>':'')+'</p><p>'+escape(data.intro)+'</p><div class="actions">'+button('#services',u.solutions)+(link(video)?'<a class="button video-link" href="'+link(video)+'"><span aria-hidden="true">▶</span> '+escape(u.watch)+'</a>':'')+'</div><div class="features">'+data.features.map((x,i)=>'<span>'+heroIcon(i)+escape(x)+'</span>').join('')+'</div></div></section>'+
  homeFacts(data.stats.length?data.stats:proof.facts)+
  sections.filter(s=>s.id!=='testimonials'&&s.items.length).map(s=>{
    let content
    if(s.id==='products'){
      const catalogLink=button('/products?lang='+lang,data.pages.products.catalogAll)
      content='<div class="cards">'+s.items.slice(0,4).map(item=>homeProduct(item,lang)).join('')+'</div><div class="home-catalog-link">'+catalogLink+'</div>'
    }else if(s.id==='projects')content=homeProject(s.items,proof,data.pages.projects,lang)
    else if(s.id==='about')content=homeAbout(s.items,proof,lang,u)
    else if(s.id==='process')content=homeProcess(s.items)
    else content='<div class="cards">'+s.items.map((item,index)=>card({...item,href:s.id==='articles'&&item.slug?'/articles/'+item.slug+'?lang='+lang:item.href},s.id,u,index)).join('')+'</div>'
    const projectIntro=lang==='ar'?'مشروعات حقيقية. أثر يدوم.':'Real projects. Lasting impact.'
    const intro=s.intro||(s.id==='projects'?projectIntro:s.id==='process'?proof.processSubtitle:'')
    const eyebrow=s.id==='projects'?'':'<span class="eyebrow">'+escape(s.label)+'</span>'
    return '<section id="'+escape(s.id)+'" class="block '+escape(s.id)+'">'+(s.background?'<div class="section-bg">'+image(s.background)+'</div>':'')+'<div class="wrap"><div class="section-title">'+eyebrow+'<h2>'+escape(s.title)+'</h2>'+(intro?'<p>'+escape(intro)+'</p>':'')+'</div>'+content+'</div></section>'
  }).join('')+
  homeTrust(proof,u,data.logo,testimonials)+'<section id="contact" class="contact"><div class="wrap"><div><h2>'+escape(u.formTitle)+'</h2><p>'+escape(u.formIntro)+'</p></div><form method="post" action="/inquiry?lang='+lang+'">'+
  inquiryFields(u,services,route==='contact'?data.pages.contact:null)+'</form></div></section></main>'+siteFooter(data,lang,route,nav,contacts,services)+'</body>'
  return route ? interior(lang,data,route,body,entry) : shell(lang,data.brand,body,data.intro)
}
function validate(data, lang) {
  const baseline = seed[lang]
  const string = v => typeof v==='string' && v.length<=4000
  const records = (list, fields) => Array.isArray(list)&&list.length<=100&&list.every(x=>x&&fields.every(k=>string(x[k])))
  return data && (!data.chrome || Object.keys(baseline.chrome).every(k=>string(data.chrome[k]))) && (!data.homeProof || ['video','title','kicker','projectAction','processSubtitle','aboutSummary','projectCaption','customerTitle'].every(k=>string(data.homeProof[k]))&&records(data.homeProof.facts,['icon','value','title'])&&records(data.homeProof.aboutFeatures,['title','icon'])&&records(data.homeProof.reasons,['title','description'])&&records(data.homeProof.customers,['title','image'])&&(data.homeProof.projectPreviews===undefined||records(data.homeProof.projectPreviews,['title','image']))) && (!data.pages || Object.keys(baseline.pages).every(id=>Object.entries(baseline.pages[id]).every(([key,value])=>Array.isArray(value)?records(data.pages[id]?.[key],Object.keys(value[0])):string(data.pages[id]?.[key])))) && Object.keys(baseline).filter(k=>typeof baseline[k]==='string').every(k=>(k==='subtitleAccent'&&data[k]===undefined)||string(data[k])) &&
    Object.keys(baseline.ui).every(k=>string(data.ui?.[k])) &&
    Array.isArray(data.features)&&data.features.length<=12&&data.features.every(string) &&
    records(data.stats,['value','title'])&&records(data.contactLinks,['title','href'])&&records(data.socialLinks,['title','href','icon']) &&
    records(data.sections,['id','label','title','background'])&&data.sections.every(s=>baseline.sections.some(b=>b.id===s.id)&&['intro','navigation'].every(k=>s[k]===undefined||string(s[k]))&&records(s.items,['image','title','description','href'])&&new Set(s.items.map(item=>item.slug).filter(Boolean)).size===s.items.filter(item=>item.slug).length&&s.items.every(item=>(item.specs===undefined||records(item.specs,['title','description']))&&(item.rating===undefined||item.rating===''||/^[1-5]$/.test(item.rating))&&(!item.slug||/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug))&&[item.pageImage,item.detail,item.location,item.year,item.catalogOrder,item.summary,item.source,item.slug,item.detailImage,item.icon,item.caption,item.compactImage,item.group,item.body,item.role,item.rating].every(value=>value===undefined||string(value)))) &&
    new Set(data.sections.map(s=>s.id)).size===data.sections.length
}

function admin(lang) {
  const t=(en,ar)=>lang==='ar'?ar:en
  const title=t('Content Studio','إدارة محتوى الموقع')
  return shell(lang,title,'<body class="admin" data-lang="'+lang+'"><div class="admin-layout"><aside class="admin-sidebar"><a class="admin-brand" href="/admin?lang='+lang+'"><span aria-hidden="true">A</span><div><strong>Arasya Plastic</strong><small>'+t('Content Studio','إدارة المحتوى')+'</small></div></a><nav id="admin-nav" aria-label="'+t('Content areas','أقسام المحتوى')+'"></nav></aside><main class="admin-main"><header class="admin-toolbar"><nav aria-label="'+t('Language and preview','اللغة والمعاينة')+'"><a href="/admin?lang=en" '+(lang==='en'?'aria-current="page"':'')+'>EN</a><a href="/admin?lang=ar" '+(lang==='ar'?'aria-current="page"':'')+'>عربي</a><a href="/?lang='+lang+'">'+t('View website ↗','عرض الموقع ↗')+'</a></nav></header><div class="admin-content"><div class="admin-heading"><span class="eyebrow">'+t('Website management','إدارة الموقع')+'</span><h1 id="admin-title">'+title+'</h1><p id="admin-description"></p></div><p role="status" id="status"></p><div id="editor"></div><section id="media-panel" class="admin-panel" hidden><label>'+t('Choose image','اختر صورة')+'<input id="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif"></label><button id="upload" type="button">'+t('Upload','رفع')+'</button><label>'+t('Image URL','رابط الصورة')+'<input id="asset-url" readonly></label></section><section id="inquiries-panel" class="admin-panel" hidden><div id="inquiries"></div></section></div></main></div></body>')
}


async function readContent(db, lang) {
  await db.prepare('INSERT OR IGNORE INTO content (locale,document) VALUES (?,?)').bind(lang,JSON.stringify(seed[lang])).run()
  const row=await db.prepare('SELECT document,revision FROM content WHERE locale=?').bind(lang).first()
  const stored=JSON.parse(row.document)
  const data={...seed[lang],...stored,homeProof:{...seed[lang].homeProof,...stored.homeProof},chrome:{...seed[lang].chrome,...stored.chrome},contactLinks:stored.pages||stored.contactLinks?.length?stored.contactLinks:seed[lang].contactLinks,pages:Object.fromEntries(Object.entries(seed[lang].pages).map(([key,page])=>[key,{...page,...stored.pages?.[key],...Object.fromEntries(Object.entries(page).filter(([field,value])=>Array.isArray(value)&&Array.isArray(stored.pages?.[key]?.[field])).map(([field,defaults])=>[field,stored.pages[key][field].map(item=>({...defaults.find(base=>base.title===item.title||base.image&&base.image===item.image),...item}))]))}])),sections:stored.sections.map(section=>({...seed[lang].sections.find(item=>item.id===section.id),...section,items:section.items.map(item=>({...seed[lang].sections.find(base=>base.id===section.id)?.items.find(base=>base.title===item.title),...item})).concat(!stored.pages&&section.id==='products'?seed[lang].sections.find(base=>base.id==='products').items.filter(item=>!section.items.some(old=>old.title===item.title)):[])}))}
  data.pages.projects.gallery=data.pages.projects.gallery.map(item=>{
    const legacy=/^\/media\/projects-gal-([1-5])\.jpg$/.exec(item.image)
    if(!legacy)return item
    const replacement=seed[lang].pages.projects.gallery[Number(legacy[1])-1]
    return {...item,title:replacement.title,image:replacement.image}
  })
  return {data,revision:row.revision}
}
export default {async fetch(request,env) {
  const url=new URL(request.url), path=url.pathname, lang=url.searchParams.get('lang')==='ar'?'ar':'en', method=request.method
  const isAdmin=path==='/admin'||path.startsWith('/admin/')
  // Sites grants access to the owner at the platform boundary. This site must stay owner-private.
  if(isAdmin&&!request.headers.get('oai-authenticated-user-id')) return text('Sign-in required',401)
  if(method==='POST'&&request.headers.get('origin')!==url.origin) return text('Forbidden',403)
  if(path==='/site.css'&&method==='GET') return text(css,200,'text/css; charset=utf-8')
  if(path==='/client.js'&&method==='GET') return text(client,200,'text/javascript; charset=utf-8')
  if(path.startsWith('/media/')&&method==='GET') {
    const key=path.slice(7)
    if(Object.hasOwn(assets,key)) return new Response(Uint8Array.from(atob(assets[key]),c=>c.charCodeAt(0)),{headers:{'content-type':key.endsWith('.woff2')?'font/woff2':'image/jpeg','cache-control':'public, max-age=86400','x-content-type-options':'nosniff'}})
    if(!/^[0-9a-f-]{36}\.(jpg|png|webp|avif)$/.test(key)) return text('Not found',404)
    const file=await env.BUCKET.get(key)
    return file?new Response(file.body,{headers:{'content-type':file.httpMetadata.contentType,'x-content-type-options':'nosniff','cache-control':'private, max-age=86400'}}):text('Not found',404)
  }
  const route=path.replace(/^\/|\/$/g,'')
  const articleRoute=/^articles\/([a-z0-9-]+)$/.exec(route)
  if(method==='GET'&&articleRoute){
    const {data}=await readContent(env.DB,lang)
    const article=data.sections.find(section=>section.id==='articles')?.items.find(item=>item.slug===articleRoute[1])
    return article?text(home(lang,data,'articles',article)):text('Not found',404)
  }
  const productRoute=/^products\/([a-z0-9-]+)$/.exec(route)
  if(method==='GET'&&productRoute){
    const {data}=await readContent(env.DB,lang)
    const product=data.sections.find(section=>section.id==='products')?.items.find(item=>item.slug===productRoute[1])
    return product?text(home(lang,data,'products',product)):text('Not found',404)
  }
  if(method==='GET'&&(path==='/'||Object.hasOwn(seed[lang].pages,route))) return text(home(lang,(await readContent(env.DB,lang)).data,route))
  if(method==='GET'&&path==='/admin') return text(admin(lang))
  if(path==='/admin/content'&&method==='GET') return json(await readContent(env.DB,lang))
  if(path==='/admin/content'&&method==='POST') {
    if(Number(request.headers.get('content-length'))>500000) return json({error:'Size'},413)
    const raw=await request.text()
    if(raw.length>500000) return json({error:'Size'},413)
    let input
    try { input=JSON.parse(raw) } catch { return json({error:'JSON'},400) }
    if(!Number.isSafeInteger(input?.revision)||!validate(input.data,lang)) return json({error:'Invalid content'},400)
    const result=await env.DB.prepare('UPDATE content SET document=?,revision=revision+1 WHERE locale=? AND revision=?').bind(JSON.stringify(input.data),lang,input.revision).run()
    return result.meta.changes?json({revision:input.revision+1}):json({error:'Conflict'},409)
  }
  if(path==='/admin/inquiries'&&method==='GET') return json((await env.DB.prepare('SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 100').all()).results)
  if(path==='/admin/upload'&&method==='POST') {
    const mime=request.headers.get('content-type'), ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif'}[mime]
    if(!ext||Number(request.headers.get('content-length'))>4000000) return json({error:'Invalid image'},400)
    const bytes=await request.arrayBuffer()
    const prefix=new Uint8Array(bytes,0,Math.min(bytes.byteLength,16))
    const header=String.fromCharCode(...prefix)
    const valid={jpg:prefix[0]===255&&prefix[1]===216&&prefix[2]===255,png:header.startsWith('\x89PNG\r\n\x1a\n'),webp:header.startsWith('RIFF')&&header.slice(8,12)==='WEBP',avif:header.slice(4,12)==='ftypavif'}
    if(bytes.byteLength>4000000||!valid[ext]) return json({error:'Invalid image'},400)
    const key=crypto.randomUUID()+'.'+ext
    await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:mime}})
    return json({url:'/media/'+key},201)
  }
  if(path==='/inquiry'&&method==='POST') {
    const body=await request.text()
    const {data}=await readContent(env.DB,lang)
    const form=new URLSearchParams(body)
    const values=['name','email','phone','service','details','company'].map(k=>(form.get(k)||'').trim())
    const [name,email,phone,service,details,company]=values
    const valid=body.length<=20000&&name&&name.length<=120&&email.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)&&phone.length<=60&&company.length<=160&&details&&details.length<=3000&&data.sections.find(s=>s.id==='services')?.items.some(x=>x.title===service)
    if(valid) await env.DB.prepare('INSERT INTO inquiries (id,name,email,phone,service,details,company) VALUES (?,?,?,?,?,?,?)').bind(crypto.randomUUID(),...values).run()
    return text(shell(lang,data.brand,'<body><main class="wrap response"><h1>'+escape(valid?data.ui.sent:data.ui.error)+'</h1>'+button('/?lang='+lang+'#contact',data.ui.home)+'</main></body>'),valid?201:400)
  }
  return text('Not found',404)
}}
export { home, validate, seed }


function interior(lang,data,route,homeBody,entry) {
  const page=data.pages[route], u=data.ui
  const locale='?lang='+lang
  const section=data.sections.find(s=>s.id===route)
  const items=section?.items??[]
  const header=homeBody.slice(0,homeBody.indexOf('<main>'))
  const footer=homeBody.slice(homeBody.indexOf('<footer>'))
  const contact=homeBody.slice(homeBody.indexOf('<section id="contact"'),homeBody.indexOf('</main>'))
  if(entry)return route==='articles'?articleDetail(lang,data,page,entry,header,footer):productDetail(lang,data,page,entry,header,footer)
  const cards=(page.blocks||items).map((item,index)=>card({...item,image:item.pageImage||item.image,href:route==='articles'&&item.slug?'/articles/'+item.slug+locale:item.href},route,u,index)).join('')
  const title='<h2>'+escape(page.heading)+'</h2>'
  const hero='<section class="inner-hero '+route+'-hero">'+image(page.image,'',true)+'<div class="wrap"><span class="eyebrow">'+escape(page.eyebrow||data.tagline)+'</span><h1>'+escape(page.title)+'</h1><p>'+escape(page.intro)+'</p>'+(page.heroBenefits?.length?'<div class="product-hero-benefits">'+page.heroBenefits.map(item=>'<span><b aria-hidden="true">'+engineeringIcon(item.icon)+'</b>'+escape(item.title)+'</span>').join('')+'</div>':'')+'</div></section>'
  const intro=page.featureImage?'<div class="feature-split">'+image(page.featureImage,'')+'<div>'+(page.overviewLabel?'<span class="eyebrow">'+escape(page.overviewLabel)+'</span>':'')+title+'<p>'+escape(page.featureText)+'</p></div></div>':title
  const process=data.sections.find(s=>s.id==='process')
  const processSection=route==='services'?serviceSupport(page,process,u):''
  const listing='<section class="block inner-content inner-'+route+'"><div class="wrap">'+
    (route==='projects'?projectNavigation(page)+(items.length?featuredProject(page,items[0],u,locale):''):'')+
    (route==='projects'?projectSections(page):route==='services'?intro+serviceRows(items):(route==='products'?productFilters(page,title)+productCatalog(items,page,u,locale):(route==='about'?intro:title)+(route==='articles'&&!items.length?'<p class="articles-empty">'+escape(page.emptyText)+'</p>':'<div class="cards">'+cards+'</div>')))+'</div></section>'
  const feature=route==='products'&&items.length?productFeature(page,items[0],u,locale):''
  const main=route==='contact'?contactContent(page,contact,u):
    listing+feature+(route==='services'?processSection+homeTrust({...data.homeProof,customers:[]},u):'')+(route==='services'||page.blocks?resourceLinks(data,locale):'')+(page.sourceHref?'<div class="wrap resource-source">'+button(page.sourceHref,page.sourceLabel)+'</div>':'')+'<section class="inner-cta">'+(page.ctaImage?image(page.ctaImage):'')+'<div class="wrap"><div><h2>'+escape(page.ctaTitle||u.formTitle)+'</h2>'+(page.ctaText?'<p>'+escape(page.ctaText)+'</p>':'')+'</div>'+('<div class="cta-actions">'+button('/contact'+locale,u.consult)+(link(page.secondaryHref)?button(page.secondaryHref,page.secondaryAction):'')+'</div>')+'</div></section>'
  return shell(lang,page.title+' | '+data.brand,header+'<main class="interior">'+hero+main+'</main>'+footer,page.intro)
}



function featuredProject(page,item,u,locale) {
  const benefits=page.featureBenefits.split('•').map(value=>'<li>'+escape(value.trim())+'</li>').join('')
  const photo=page.featureImage||item.image
  const preview=link(photo)?'<a class="featured-project-preview" href="'+link(photo)+'" aria-label="'+escape(page.previewLabel)+'"><span aria-hidden="true">⤢</span></a>':''
  return '<div id="featured-case-study" class="feature-split featured-project"><div class="featured-project-photo">'+image(photo,item.title)+'<span>'+escape(page.featureLabel)+'</span>'+preview+'</div><div><span class="eyebrow">'+escape(page.featureLabel)+'</span><h2>'+escape(page.featureTitle)+'</h2><dl><dt>'+escape(page.featureScope)+'</dt><dd>'+escape(page.featureDetails)+'</dd><dt>'+escape(page.featureOutcome)+'</dt><dd><ul>'+benefits+'</ul></dd></dl>'+button('/contact'+locale,u.consult)+'</div></div>'
}
function projectSections(page) {
  const gallery=page.gallery.map(item=>'<a data-sector="'+escape(item.sector)+'" href="'+link(item.image)+'" aria-label="'+escape(item.title)+'">'+image(item.image,item.title)+'</a>').join('')
  const sectors=page.sectors.map((item,index)=>'<article id="sector-'+index+'"><div class="sector-photo">'+image(item.image,item.title)+'<span aria-hidden="true">'+escape(item.icon)+'</span></div><div class="card-body"><h3>'+escape(item.title)+'</h3><p>'+escape(item.description)+'</p>'+(link(item.href)?button(item.href,page.sectorAction):'')+'</div></article>').join('')
  return '<div class="project-gallery"><div class="project-gallery-heading"><div><span class="eyebrow">'+escape(page.galleryLabel)+'</span><h2>'+escape(page.galleryTitle)+'</h2></div><button type="button" class="button" data-project-show-all>'+escape(page.galleryAction)+'</button></div><div class="project-mosaic">'+gallery+'</div><dialog class="project-lightbox"><form method="dialog"><button type="submit" aria-label="'+escape(page.galleryClose)+'">×</button></form><img alt=""></dialog></div><div class="project-sectors"><span class="eyebrow">'+escape(page.sectorLabel)+'</span><h2>'+escape(page.sectorTitle)+'</h2><div class="cards">'+sectors+'</div></div>'
}
function projectNavigation(page) {
  const tabs=(page.navigationSectors||page.sectors).map(item=>'<button type="button" data-project-filter data-filter="'+escape(item.key)+'" aria-pressed="false"><span aria-hidden="true">'+engineeringIcon(item.icon)+'</span>'+escape(item.title)+'</button>').join('')
  return '<nav class="project-navigation"><button type="button" data-project-filter data-filter="" aria-pressed="true"><span aria-hidden="true">▦</span>'+escape(page.allSectors)+'</button>'+tabs+'</nav>'
}


function serviceRows(items) {
  return '<div class="service-rows">'+items.map((item,index)=>{
    const detail=item.detail
    const points=detail?'<ul>'+detail.split('•').map(point=>'<li>'+escape(point.trim())+'</li>').join('')+'</ul>':''
    return '<article><div class="service-photo">'+image(item.pageImage||item.image,item.title)+'<span>'+String(index+1).padStart(2,'0')+'</span></div><div class="service-summary"><h3><span aria-hidden="true">'+engineeringIcon(item.icon==='◇'?'compass':item.icon||'compass')+'</span>'+escape(item.title)+'</h3><p>'+escape(item.description)+'</p></div><div class="service-detail">'+points+'</div></article>'
  }).join('')+'</div>'
}
function serviceSupport(page,process,u) {
  const lead=(label,title,description)=>'<div class="service-lead"><span class="eyebrow">'+escape(label)+'</span><h2>'+escape(title)+'</h2><p>'+escape(description)+'</p></div>'
  const steps=process?.items.map((item,index)=>'<article><div class="step-icon" aria-hidden="true">'+engineeringIcon(item.icon||['discussion','plan','layers','checklist'][index%4])+'</div><div class="card-body"><span class="symbol">'+String(index+1).padStart(2,'0')+'</span><h3>'+escape(item.title)+'</h3></div></article>').join('')||''
  const benefits=page.benefits.map(item=>'<article><span class="symbol" aria-hidden="true">'+engineeringIcon(item.icon)+'</span><h3>'+escape(item.title)+'</h3><p>'+escape(item.description)+'</p></article>').join('')
  return '<section class="block process service-process"><div class="wrap">'+lead(page.processLabel,page.processTitle,page.processText)+'<div class="cards">'+steps+'</div></div></section><section class="block service-benefits"><div class="wrap">'+lead(page.benefitLabel,page.benefitTitle,page.benefitText)+'<div class="benefit-list">'+benefits+'</div></div></section>'
}


function productCatalog(items,page,u,locale) {
  const ordered=items.filter(item=>Number(item.catalogOrder)>0).sort((a,b)=>Number(a.catalogOrder)-Number(b.catalogOrder))
  const featured=ordered.length?ordered:items.slice(0,8)
  const more=items.filter(item=>!featured.includes(item))
  const cards=list=>'<div class="cards">'+list.map((item,index)=>card({...item,image:item.pageImage||item.image,displayDescription:item.caption||item.summary,href:item.slug?'/products/'+item.slug+locale:item.href||'/contact'+locale},'products',u,index).replace('<article ', '<article data-group="'+escape(item.group)+'" ')).join('')+'</div>'
  return cards(featured)+(more.length?'<details class="catalog-more"><summary>'+escape(page.catalogMore)+'</summary>'+cards(more)+'</details>':'')
}
function productFeature(page,item,u,locale) {
  const specs=page.specs.map(spec=>'<div><strong>'+escape(spec.title)+'</strong><span>'+escape(spec.description)+'</span></div>').join('')
  const benefits=page.benefits.map(benefit=>'<article><span class="symbol" aria-hidden="true">'+engineeringIcon(benefit.icon)+'</span><h3>'+escape(benefit.title)+'</h3><p>'+escape(benefit.description)+'</p></article>').join('')
  return '<section id="featured-product" class="block inner-highlight"><div class="wrap feature-split">'+image(page.featureImage||item.image,item.title)+'<div><span class="eyebrow">'+escape(page.featureLabel)+'</span><h2>'+escape(item.title)+'</h2><p>'+escape(page.featureText)+'</p><div class="product-specs">'+specs+'</div><div class="product-actions">'+button('/contact'+locale,u.consult)+(link(page.specHref)?button(page.specHref,page.specTitle):'')+'</div></div></div></section><section id="product-benefits" class="block product-benefits"><div class="wrap"><div><span class="eyebrow">'+escape(page.benefitLabel)+'</span><h2>'+escape(page.benefitTitle)+'</h2></div><div class="benefit-list">'+benefits+'</div></div></section>'
}



function contactContent(page, contact, u) {
  const methods=page.methods.map(item=>'<article><span class="contact-icon" aria-hidden="true">'+engineeringIcon(item.icon)+'</span><div><h3>'+escape(item.title)+'</h3><p>'+escape(item.description)+'</p><a href="'+link(item.href)+'">'+escape(item.label)+'</a></div></article>').join('')
  const form=contact.replace('<div><h2>'+escape(u.formTitle)+'</h2><p>'+escape(u.formIntro)+'</p></div>','<div><span class="eyebrow">'+escape(page.formLabel)+'</span><h2>'+escape(page.heading)+'</h2><p>'+escape(page.formText)+'</p></div>')
  const map='<a class="office-map" href="'+link(page.map)+'"><span aria-hidden="true">⌖</span><strong>'+escape(page.mapAction)+'</strong></a>'
  const office='<section class="block office"><div class="wrap">'+map+'<div><span class="eyebrow">'+escape(page.officeLabel)+'</span><h2>'+escape(page.officeTitle)+'</h2><div class="office-address"><span aria-hidden="true">'+engineeringIcon('⌖')+'</span><div><strong>'+escape(page.officeCity)+'</strong><p>'+escape(page.address)+'</p></div></div><div class="office-contact"><h3>'+escape(page.officeContactTitle)+'</h3><p>'+escape(page.officeContactText)+'</p>'+button(page.map,page.mapAction)+'</div></div></div></section>'
  const support='<section class="contact-support">'+image(page.supportImage)+'<div class="wrap"><span class="support-icon" aria-hidden="true">'+escape(page.supportIcon)+'</span><div><h2>'+escape(page.supportTitle)+'</h2><p>'+escape(page.supportText)+'</p></div>'+button('#contact',page.supportAction)+'</div></section>'
  return '<div class="wrap contact-ways">'+methods+'</div>'+form+office+support
}


function homeFacts(items) {
  return items.length?'<div class="stats wrap">'+items.map(item=>'<div><span aria-hidden="true">'+escape(item.icon||'◇')+'</span><div><strong>'+escape(item.value)+'</strong><small>'+escape(item.title)+'</small></div></div>').join('')+'</div>':''
}
function homeProject(items,proof,page,lang) {
  const first=items[0]
  const target='/projects?lang='+lang
  const caseStudy=target+'#featured-case-study'
  const isDefaultReservoir=first.image==='/media/reservoir.jpg'
  const photoUrl=isDefaultReservoir?'/media/gallery-reservoir.jpg':first.image
  const photo=image(photoUrl,first.title)
  const photos=proof.projectPreviews.slice(0,3).map(photo=>{
    const url=photo.image==='/media/gallery-field.jpg'?'/media/projects-gal-1.jpg':
      photo.image==='/media/gallery-piping.jpg'?'/media/pipes.jpg':photo.image
    return '<a href="'+target+'" aria-label="'+escape(photo.title)+'">'+image(url,photo.title)+'</a>'
  }).join('')
  const category=(isDefaultReservoir&&proof.projectCaption)||first.description
  const detail=first.detail||(isDefaultReservoir?page.featureDetails:'')
  const metadata=[['⌖',first.location],['calendar',first.year],['layers',category]]
    .filter(([,value])=>value)
    .map(([icon,value])=>'<li>'+engineeringIcon(icon)+escape(value)+'</li>').join('')
  const action=lang==='ar'?'عرض دراسة الحالة':'View Case Study'
  const cover=photo?'<a class="home-project-photo" href="'+link(photoUrl)+'" aria-label="'+escape(page.previewLabel)+'">'+photo+'<span aria-hidden="true">⤢</span></a>':''
  return '<div class="home-project"><article>'+cover+'<div><h3>'+escape(first.title)+'</h3>'+
    (metadata?'<ul class="home-project-meta">'+metadata+'</ul>':'')+
    (detail?'<p class="home-project-detail">'+escape(detail)+'</p>':'')+button(caseStudy,action)+'</div></article>'+
    (photos?'<div class="home-project-previews">'+photos+'</div>':'')+'</div>'
}

function homeTrust(proof,u,logo,testimonials) {
  const reviews=testimonials?.items.length?testimonials:null
  const brand=image(logo,'')
  const items=reviews?.items||proof.reasons
  const notes=items.map((item,index)=>{
    const portrait=(reviews&&image(item.image,''))||brand
    const avatar=portrait?'<div class="home-note-brand">'+portrait+'</div>':''
    const content=reviews?testimonialContent(item):'<div><h3>'+escape(item.title)+'</h3><p>'+escape(item.description)+'</p></div>'
    return '<article class="home-note"'+(index?' hidden':'')+'>'+avatar+(reviews?'':'<span aria-hidden="true">“</span>')+content+'</article>'
  }).join('')
  const controls=items.length>1
  const noteButton=(step,label)=>'<button type="button" data-note="'+step+'" aria-label="'+escape(label)+'">'+(step<0?'‹':'›')+'</button>'
  const customers=proof.customers.map(item=>'<div>'+image(item.image,item.title)+'</div>').join('')
  return '<section class="block home-trust home-proof"><div class="wrap"><span class="eyebrow">'+escape(reviews?.label||proof.kicker)+'</span><h2>'+escape(reviews?.title||proof.title)+'</h2>'+
    (notes?'<div class="home-note-view">'+(controls?noteButton(-1,u.previous):'')+'<div aria-live="polite">'+notes+'</div>'+(controls?noteButton(1,u.next):'')+'</div>':'')+
    (controls?'<div class="home-note-position" aria-hidden="true">'+items.map((_,i)=>'<span class="home-note-dot'+(i?'':' active')+'"></span>').join('')+'</div>':'')+
    (customers?'<div class="home-customers"><h3>'+escape(proof.customerTitle)+'</h3><div>'+customers+'</div></div>':'')+'</div></section>'
}


function homeHeroImage(url) {
  if(url!=='/media/hero.jpg') return image(url,'',true)
  return '<picture><source media="(max-width:720px)" srcset="/media/hero-compact.jpg">'+image(url,'',true)+'</picture>'
}

function brandMark(data,lang) {
  return '<a class="brand" href="/?lang='+lang+'" aria-label="'+escape(data.brand)+'">'+image(data.logo,'',true)+'<strong>'+escape(data.chrome.brandTitle)+'<span>'+escape(data.chrome.brandSubtitle)+'</span></strong></a>'
}
function siteFooter(data,lang,route,nav,contacts,services) {
  const u=data.ui, chrome=data.chrome, locale='?lang='+lang
  const products=data.sections.find(section=>section.id==='products')?.items||[]
  const entries=route==='products'?[...new Set(products.map(item=>item.description).filter(Boolean))].slice(0,4).map(title=>({title,href:'/products'+locale})):services.slice(0,4).map(item=>({title:item.title,href:'/services'+locale}))
  if(route!=='products')entries.push({title:data.pages.applications.title,href:'/applications'+locale})
  const list=entries.map(item=>'<a href="'+link(item.href)+'"><span aria-hidden="true">›</span>'+escape(item.title)+'</a>').join('')
  return '<footer><div class="wrap footer"><div class="footer-identity">'+brandMark(data,lang)+'<p>'+escape(chrome.footerIntro)+'</p></div><div><h3>'+escape(u.quick)+'</h3><a href="/'+locale+'">'+escape(u.home)+'</a>'+nav+'<a href="/contact'+locale+'">'+escape(u.contact)+'</a></div><div class="footer-solutions"><h3>'+escape(route==='products'?chrome.footerProducts:chrome.footerServices)+'</h3>'+list+'</div><div class="footer-contact"><h3>'+escape(u.contact)+'</h3>'+contacts+socialLinks(data.socialLinks)+'</div></div><div class="wrap legal">© '+escape(data.brand)+' · '+escape(u.rights)+'</div></footer>'
}

function socialLinks(items) {
  const links=items.filter(item=>/^https:\/\//i.test(item.href)&&item.title.trim()).map(item=>
    '<a href="'+link(item.href)+'" aria-label="'+escape(item.title)+'"><span aria-hidden="true">'+escape(item.icon||'↗')+'</span></a>'
  ).join('')
  return links?'<div class="social-links">'+links+'</div>':''
}



function homeAbout(items,proof,lang,u) {
  const item=items[0]
  const photo=image(item.image,item.title)
  const responsivePhoto=item.image==='/media/about.jpg'?'<picture><source media="(max-width:720px)" srcset="/media/about-compact.jpg">'+photo+'</picture>':photo
  const defaultIcons=['trophy','shield','leaf','team']
  const features=proof.aboutFeatures.map((feature,index)=>{
    const icon=feature.icon==='✓'?(defaultIcons[index]||feature.icon):feature.icon
    return '<span><b aria-hidden="true">'+engineeringIcon(icon)+'</b>'+escape(feature.title)+'</span>'
  }).join('')
  return '<div class="about-content">'+responsivePhoto+'<div><p>'+escape(proof.aboutSummary||item.description)+'</p><div class="about-features">'+features+'</div>'+button('/about?lang='+lang,u.more)+'</div></div>'
}
function homeProcess(items) {
  const icons=['discussion','plan','layers','checklist']
  const steps=items.map((item,index)=>{
    const icon=engineeringIcon(item.icon||icons[index%icons.length])
    const number=String(index+1).padStart(2,'0')
    return '<li><div class="home-step-marker" aria-hidden="true">'+icon+'<span>'+number+'</span></div><h3>'+escape(item.title)+'</h3></li>'
  })
  return '<ol class="home-steps" role="list">'+steps.join('')+'</ol>'
}




function resourceLinks(data,locale) {
  const routes=['applications','technical-specifications','how-to-choose-the-right-product']
  return '<nav class="wrap resource-links">'+routes.map(route=>button('/'+route+locale,data.pages[route].title)).join('')+'</nav>'
}

function productDetail(lang,data,page,item,header,footer) {
  const locale='?lang='+lang
  const specs=item.specs??(item.slug==='hdpe-geomembrane'?page.specs:[])
  const specification=specs.length?'<section class="detail-specification"><h2>'+escape(page.specTitle)+'</h2><dl class="product-specs">'+specs.map(spec=>'<div><dt>'+escape(spec.title)+'</dt><dd>'+escape(spec.description)+'</dd></div>').join('')+'</dl></section>':''
  const content='<main class="interior"><section class="block detail-product"><div class="wrap">'+button('/products'+locale,page.backToCatalog)+'<div class="detail-product-grid">'+image(item.detailImage||item.pageImage||item.image,item.title,true)+'<div><span class="eyebrow">'+escape(item.description)+'</span><h1>'+escape(item.title)+'</h1><p>'+escape(item.summary)+'</p>'+specification+'<div class="product-actions">'+button('/contact'+locale,data.ui.consult)+(link(item.source)?button(item.source,page.companySource):'')+'</div></div></div></div></section>'+resourceLinks(data,locale)+'</main>'
  return shell(lang,item.title+' | '+data.brand,header+content+footer,item.summary)
}


function inquiryFields(u,services,contact) {
  const fields=[['name','text',120,u.name,'♙','name'],['email','email',254,u.email,'✉','email'],['phone','tel',60,u.phone,'☎','tel']]
  if(contact)fields.splice(2,0,['company','text',160,contact.company,'▥','organization'])
  const wrap=(label,icon,control,wide=false)=>'<label'+(wide?' class="wide"':'')+'><span class="inquiry-label">'+escape(label)+'</span>'+(contact&&icon?'<span class="inquiry-icon" aria-hidden="true">'+engineeringIcon(icon)+'</span>':'')+control+'</label>'
  const textInputs=fields.map(([name,type,max,label,icon,autocomplete])=>wrap(label,icon,'<input name="'+name+'" type="'+type+'" maxlength="'+max+'" autocomplete="'+autocomplete+'" '+(contact?'placeholder="'+escape(label)+'" ':'')+(['name','email'].includes(name)?'required':'')+'>')).join('')
  const select=wrap(contact?.projectType||u.service,contact?'▱':'','<select name="service" required><option value="">'+escape(contact?.projectType||'')+'</option>'+services.map(item=>'<option>'+escape(item.title)+'</option>').join('')+'</select>',Boolean(contact))
  const details=wrap(contact?.projectDetails||u.details,contact?'✎':'','<textarea name="details" required maxlength="3000"'+(contact?' placeholder="'+escape(contact.detailsHint)+'"':'')+'></textarea>',true)
  return textInputs+select+details+'<button class="button" type="submit">'+escape(contact?.sendInquiry||u.send)+' →</button>'
}


function homeProduct(item,lang) {
  const photo=image(item.image,item.title)
  const visual=photo&&link(item.compactImage)?'<picture><source media="(max-width:720px)" srcset="'+link(item.compactImage)+'">'+photo+'</picture>':photo
  const href=item.slug?'/products/'+item.slug+'?lang='+lang:'/products?lang='+lang
  return '<article><a href="'+link(href)+'">'+visual+'<div class="card-body"><h3>'+escape(item.title)+'</h3></div></a></article>'
}
function heroIcon(index) {
  const paths=[
    'M12 2 4 5v6c0 5 3 8 8 11 5-3 8-6 8-11V5l-8-3Zm-4 10 3 3 5-6',
    'm12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5',
    'M9 3h6l1 3 3 1 2 4-2 3v4l-4 3-3-1-3 1-4-3v-4l-2-3 2-4 3-1 1-3Z M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
    'M20 4c-8 0-15 3-15 10a5 5 0 0 0 5 5c7 0 10-7 10-15ZM3 21l12-12'
  ]
  return '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="'+paths[index%paths.length]+'"/></svg>'
}


function productFilters(page,title) {
  const tabs=page.catalogGroups.map(group=>'<button type="button" data-catalog-group="'+escape(group.key)+'" aria-pressed="false"><span aria-hidden="true">'+engineeringIcon(group.icon)+'</span>'+escape(group.title)+'</button>').join('')
  const options=page.catalogGroups.map(group=>'<option value="'+escape(group.key)+'">'+escape(group.title)+'</option>').join('')
  return '<div class="catalog-tabs">'+tabs+'</div><div class="catalog-heading"><div><span class="eyebrow">'+escape(page.catalogLabel)+'</span>'+title+'</div><select aria-label="'+escape(page.catalogFilter)+'" data-catalog-select><option value="">'+escape(page.catalogAll)+'</option>'+options+'</select></div>'
}

function engineeringIcon(value) {
  const paths={
    'calendar':'M3 5h20v16H3V5Zm0 5h20M8 2v6m10-6v6M8 14h2m3 0h2m3 0h2M8 18h2m3 0h2',
    'trophy':'M7 3h12v5a6 6 0 0 1-12 0V3Zm0 2H3v2a5 5 0 0 0 5 5m11-7h4v2a5 5 0 0 1-5 5m-5 2v6m-5 1h10',
    'shield':'M13 2 22 6v6c0 5-5 8-9 10-4-2-9-5-9-10V6Zm-4 10 3 3 5-6',
    'team':'M13 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM5 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm16 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM8 21v-4a5 5 0 0 1 10 0v4m-16 0v-4a4 4 0 0 1 5-4m17 8v-4a4 4 0 0 0-5-4',
    'discussion':'M2 3h20v12H10l-6 5v-5H2V3Zm5 6h1m3 0h1m3 0h1',
    'plan':'M2 3h20v14H2V3Zm10 14v4m-5 0h10M5 13l4-5 4 3 4-5 2 2',
    'layers':'m12 2 10 5-10 5L2 7l10-5ZM2 12l10 5 10-5M2 17l10 5 10-5',
    'checklist':'M8 5H4v17h16V5h-4M8 3h8v5H8V3Zm0 12 3 3 5-6',
    'compass':'M12 2v3m0 0a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm-2 6L4 23l7-4m3-8 6 12-7-4M6 15h12',
    '☎':'M7 3H4c-4 5 7 18 13 18l4-4-5-4-3 3c-3-2-5-4-6-7l3-2-3-4Z',
    '✉':'M2 5h20v14H2zM2 5l10 8L22 5',
    '⌖':'M12 22c-2-3-8-9-8-13a8 8 0 1 1 16 0c0 4-6 10-8 13ZM12 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
    '♙':'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM4 21v-2a8 6 0 0 1 16 0v2Z',
    '▥':'M3 22V9h6v13m0 0V3h12v19H3M13 7h4m-4 4h4m-4 4h4m-4 4h4',
    '✎':'m3 16 13-13 5 5L8 21H3v-5Zm10-10 5 5M3 23h19',
    'water':'M12 2C10 6 4 12 4 16a8 8 0 0 0 16 0c0-4-6-10-8-14Zm-4 14c0 2 1 3 3 4',
    'leaf':'M23 2C8 2 3 7 3 15a6 6 0 0 0 6 6c8 0 13-7 14-19ZM2 24 17 9',
    'factory':'M2 22V11l7 4V9l7 4V3h4v19H2Zm3-3h2m3 0h2m3 0h2M17 7h2',
    'infrastructure':'M7 2h12M9 2 5 22m12-20 4 20M3 22h20M8 8h10M7 14h12M10 3l7 18M16 3 9 21',
    'recycle':'m9 4 3-3 5 8m-4-1 4 1 1-4M21 12l3 4-5 6h-7m3-3-3 3 3 3M8 22H3l-2-6 5-8m-4 1 4-1 1 4',
    '▱':'M14 3h4c3 0 5 3 5 6s-2 6-5 6h-2M12 5h4c3 0 5 3 5 6M10 7h4c3 0 5 3 5 6M8 9h4c3 0 5 3 5 6M8 9a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm0 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
    '▦':'M3 8 21 3v18H3V8Zm0 5h18M3 17h18M9 6v15M15 5v16M3 9h18',
    '◎':'M9 9 17 3c4 0 6 3 6 6l-7 9M17 3l-1 8M19 5l-1 8M9 9a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm0 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z'
  }
  if(value==='◇')return heroIcon(0)
  if(value==='⚙')return heroIcon(2)
  if(value==='♧')return heroIcon(2)
  if(!paths[value])return escape(value)
  return '<svg aria-hidden="true" viewBox="0 0 26 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="'+paths[value]+'"/></svg>'
}


function sectionLink(section,lang,route) {
  return '<a href="/'+escape(section.id)+'?lang='+lang+'"'+(route===section.id?' aria-current="page"':'')+'>'+escape(section.navigation||section.label||section.title)+'</a>'
}





function articleDetail(lang,data,page,item,header,footer) {
  const paragraphs=(item.body||item.description).split(/\r?\n\s*\r?\n/).map(paragraph=>'<p>'+escape(paragraph).replace(/\r?\n/g,'<br>')+'</p>').join('')
  return shell(lang,item.title+' | '+data.brand,header+'<main class="interior"><article class="wrap article-detail">'+button('/articles?lang='+lang,page.backToArticles)+'<h1>'+escape(item.title)+'</h1>'+image(item.image,item.title,true)+'<div class="article-body">'+paragraphs+'</div></article></main>'+footer,item.description)
}



function testimonialContent(item) {
  const rating=Number(item.rating)||0
  const stars=rating?'<span class="testimonial-rating" aria-label="'+rating+' / 5"><span aria-hidden="true">'+ '★'.repeat(rating)+'</span></span>':''
  return '<div class="home-review"><blockquote><span aria-hidden="true">“</span><p>'+escape(item.description)+'</p></blockquote><div class="testimonial-person"><div><h3>'+escape(item.title)+'</h3>'+(item.role?'<p>'+escape(item.role)+'</p>':'')+'</div>'+stars+'</div></div>'
}
