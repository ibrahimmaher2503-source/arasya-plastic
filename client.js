
for(const section of document.querySelectorAll('.block')) {
  const cards=section.querySelector('.cards')
  const filters=section.querySelectorAll('[data-project-filter]')
  const catalog=section.querySelector('[data-catalog-select]')
  if(catalog){
    const tabs=section.querySelectorAll('[data-catalog-group]')
    const apply=()=>{
      const group=catalog.value
      tabs.forEach(tab=>tab.setAttribute('aria-pressed',String(tab.dataset.catalogGroup===group)))
      section.querySelectorAll('article[data-group]').forEach(card=>card.hidden=Boolean(group&&card.dataset.group!==group))
      const more=section.querySelector('.catalog-more')
      if(more)more.open=Boolean(group)
    }
    catalog.addEventListener('change',apply)
    tabs.forEach(tab=>tab.onclick=()=>{catalog.value=catalog.value===tab.dataset.catalogGroup?'':tab.dataset.catalogGroup;apply()})
  }
  const notes=Array.from(section.querySelectorAll('.home-note'))
  if(notes.length>1){
    const markers=section.querySelectorAll('.home-note-dot')
    let selected=0
    for(const button of section.querySelectorAll('[data-note]'))button.onclick=()=>{
      selected=(selected+Number(button.dataset.note)+notes.length)%notes.length
      notes.forEach((note,index)=>note.hidden=index!==selected)
      markers.forEach((dot,index)=>dot.classList.toggle('active',index===selected))
    }
  }
  const dialog=section.querySelector('.project-lightbox')
  if(dialog){
    const preview=dialog.querySelector('img')
    for(const anchor of section.querySelectorAll('.project-mosaic a,.featured-project-preview'))anchor.addEventListener('click',event=>{
      if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return
      event.preventDefault()
      preview.src=anchor.href
      preview.alt=(anchor.querySelector('img')||anchor.parentElement.querySelector('img')).alt
      dialog.showModal()
    })
    section.querySelector('[data-project-show-all]').onclick=()=>{
      section.querySelector('[data-project-filter][data-filter=""]').click()
      section.querySelector('.project-mosaic a')?.focus()
    }
  }
  for(const filter of filters) filter.onclick=()=>{
    for(const item of filters) item.setAttribute('aria-pressed',String(item===filter))
    for(const item of section.querySelectorAll('.project-mosaic a'))item.hidden=Boolean(filter.dataset.filter&&!item.dataset.sector.split(/\s+/).includes(filter.dataset.filter))
    section.querySelector('.project-mosaic').classList.toggle('is-filtered',Boolean(filter.dataset.filter))
  }
  for(const button of section.querySelectorAll('[data-slide]')) button.onclick=()=>{
    const direction=document.dir==='rtl'?-1:1
    const step=section.id==='testimonials'?cards.firstElementChild.getBoundingClientRect().width+parseFloat(getComputedStyle(cards).columnGap):cards.clientWidth*.75
    cards.scrollBy({left:direction*Number(button.dataset.slide)*step,behavior:'smooth'})
  }
}
if(document.body.classList.contains('admin')) initialize()
async function initialize(){
  const lang=document.body.dataset.lang, ar=lang==='ar', query='?lang='+lang
  const t=(en,arabic)=>ar?arabic:en
  const el=(tag,text)=>{const node=document.createElement(tag);if(text)node.textContent=text;return node}
  const status=document.querySelector('#status'), root=document.querySelector('#editor')
  const names={brand:'اسم الشركة',tagline:'الشعار النصي',headline:'العنوان الرئيسي',subtitle:'العنوان الفرعي',subtitleAccent:'الجزء المميز من العنوان الفرعي',navigationSectors:'فلاتر قطاعات المشروعات',navigation:'رابط التنقل',intro:'المقدمة',hero:'صورة الواجهة',logo:'الشعار',green:'اللون الرئيسي',orange:'لون التمييز',video:'رابط الفيديو',stats:'الإحصاءات',features:'المميزات',socialLinks:'روابط شبكات التواصل',contactLinks:'روابط التواصل',sections:'الأقسام',pages:'الصفحات',chrome:'نصوص الهيدر والفوتر',brandTitle:'اسم العلامة التجارية',brandSubtitle:'السطر الثاني للعلامة',footerIntro:'وصف الشركة في الفوتر',footerServices:'عنوان عمود الخدمات',footerProducts:'عنوان عمود الحلول',homeProof:'خبرة الشركة في الرئيسية',key:'معرّف القطاع',sector:'معرّف القطاع للصورة',aboutFeatures:'مزايا الشركة',aboutSummary:'نبذة عن الشركة',processSubtitle:'وصف خطوات العمل',customerTitle:'عنوان قسم العملاء',customers:'شعارات العملاء',facts:'حقائق الشركة',reasons:'مزايا الشركة',officeCity:'المدينة',officeContactTitle:'عنوان التواصل مع المكتب',officeContactText:'نص التواصل مع المكتب',supportIcon:'أيقونة الدعم',company:'الشركة',projectType:'نوع المشروع',projectDetails:'عنوان تفاصيل المشروع',detailsHint:'النص الإرشادي',sendInquiry:'زر إرسال الطلب',projectAction:'رابط كل المشروعات',benefits:'المزايا',detail:'تفاصيل الخدمة',caption:'وصف بطاقة الرئيسية',compactImage:'صورة بطاقة الرئيسية للشاشات الضيقة',projectCaption:'نوع تطبيق المشروع',location:'موقع المشروع',year:'سنة المشروع',projectPreviews:'صور معاينة المشروعات',catalogOrder:'ترتيب المنتج في الكتالوج',catalogMore:'منتجات إضافية',heroBenefits:'مزايا الواجهة',slug:'معرّف الرابط',body:'نص المقال',role:'الصفة أو المنصب',rating:'التقييم من ١ إلى ٥',backToArticles:'العودة إلى المقالات',emptyText:'رسالة قائمة فارغة',summary:'وصف المنتج',source:'مصدر المنتج',backToCatalog:'العودة إلى الكتالوج',companySource:'المنتج على موقع الشركة',detailImage:'صورة صفحة تفاصيل المنتج',blocks:'أقسام المحتوى',sourceHref:'رابط المصدر',sourceLabel:'تسمية المصدر',catalogGroups:'فئات الكتالوج',catalogFilter:'تسمية مرشح الكتالوج',catalogAll:'كل المنتجات',group:'معرّف الفئة',catalogLabel:'تسمية الكتالوج',overviewLabel:'تسمية نظرة الخدمات',secondaryAction:'زر التواصل الإضافي',secondaryHref:'رابط التواصل الإضافي',featureLabel:'تسمية العنصر البارز',ctaImage:'صورة دعوة التواصل',ctaText:'نص دعوة التواصل',specs:'المواصفات',specTitle:'عنوان المواصفات',specHref:'رابط المواصفات',icon:'الأيقونة',benefitTitle:'عنوان المزايا',benefitLabel:'تسمية المزايا',benefitText:'مقدمة المزايا',processTitle:'عنوان خطوات العمل',processLabel:'تسمية خطوات العمل',processText:'مقدمة خطوات العمل',gallery:'معرض الصور',sectors:'القطاعات',galleryTitle:'عنوان المعرض',galleryAction:'زر عرض الصور',galleryClose:'إغلاق الصورة',sectorAction:'زر عرض التطبيقات',sectorTitle:'عنوان القطاعات',ctaTitle:'عنوان دعوة التواصل',ui:'نصوص الواجهة',id:'معرّف القسم',label:'التسمية',title:'العنوان',background:'الخلفية',items:'العناصر',image:'الصورة',description:'الوصف',href:'الرابط',value:'القيمة',home:'الرئيسية',contact:'التواصل',consult:'الاستشارة',solutions:'الحلول',watch:'الفيديو',all:'الكل',more:'المزيد',formTitle:'عنوان النموذج',formIntro:'مقدمة النموذج',name:'الاسم',email:'البريد',phone:'الهاتف',service:'الخدمة',details:'التفاصيل',send:'إرسال',sent:'رسالة الاستلام',error:'رسالة الخطأ',quick:'الروابط السريعة',rights:'حقوق النشر',next:'التالي',previous:'السابق'}
  const name=k=>ar?(names[k]||k):k.replace(/[A-Z]/g,c=>' '+c.toLowerCase()).replace(/^./,c=>c.toUpperCase())
  const action=(title,handler)=>{const b=el('button',title);b.type='button';b.onclick=handler;return b}
  let current
  function render(parent, obj, key) {
    const value=obj[key]
    if(typeof value==='string'){
      const label=el('label',name(String(key)))
      const input=el(value.length>100?'textarea':'input')
      input.value=value; input.maxLength=4000
      if(key==='id')input.readOnly=true
      const imageField=['image','pageImage','detailImage','hero','logo','compactImage','featureImage','ctaImage','supportImage'].includes(key)
      const preview=imageField?el('img'):null
      const updatePreview=()=>{
        if(!preview)return
        const value=input.value.trim()
        const valid=/^(\/(?!\/)|https:\/\/)/i.test(value)
        preview.hidden=!valid
        if(valid)preview.src=value
        else preview.removeAttribute('src')
      }
      input.oninput=()=>{obj[key]=input.value;updatePreview()}
      if(preview){
        label.classList.add('admin-image-field')
        preview.alt=''
        preview.loading='lazy'
        preview.onerror=()=>preview.hidden=true
        preview.onload=()=>preview.hidden=false
        label.append(preview)
        updatePreview()
      }
      label.append(input);parent.append(label);return
    }
    const group=el('details');group.append(el('summary',name(String(key))))
    if(Array.isArray(value)){
      const draw=()=>{
        group.querySelectorAll(':scope > :not(summary)').forEach(x=>x.remove())
        value.forEach((item,index)=>{
          const row=el('fieldset')
          row.append(el('legend',item.title||item.label||String(index+1)))
          if(typeof item==='string')render(row,value,index)
          else Object.keys(item).forEach(k=>render(row,item,k))
          for(const [delta,label] of [[-1,t('Move up','للأعلى')],[1,t('Move down','للأسفل')]]){
            const b=action(label,()=>{[value[index],value[index+delta]]=[value[index+delta],value[index]];draw()})
            b.disabled=index+delta<0||index+delta>=value.length;row.append(b)
          }
          if(key!=='sections')row.append(action(t('Remove','حذف'),()=>{value.splice(index,1);draw()}))
          group.append(row)
        })
        const templates={projectPreviews:{title:'',image:''},socialLinks:{title:'',href:'',icon:''},navigationSectors:{key:'',title:'',icon:''},facts:{icon:'',value:'',title:''},reasons:{title:'',description:''},methods:{icon:'',title:'',description:'',label:'',href:''},specs:{title:'',description:''},benefits:{icon:'',title:'',description:''},gallery:{title:'',image:'',sector:''},sectors:{title:'',description:'',image:'',href:'',icon:'',key:''},items:key==='items'&&obj.id==='testimonials'?{title:'',description:'',image:'',href:'',role:'',rating:''}:key==='items'&&obj.id==='articles'?{title:'',description:'',image:'',href:'',slug:'',body:''}:key==='items'&&obj.id==='products'?{title:'',description:'',image:'',href:'',slug:'',summary:'',source:'',detailImage:'',group:'',specs:[]}:{title:'',description:'',image:'',href:''},stats:{title:'',value:''},contactLinks:{title:'',href:''},features:''}
        if(Object.hasOwn(templates,key))group.append(action(t('Add','إضافة'),()=>{value.push(structuredClone(templates[key]));draw()}))
      };draw()
    }else Object.keys(value).forEach(k=>render(group,value,k))
    parent.append(group)
  }
  try{
    const result=await fetch('/admin/content'+query)
    if(!result.ok)throw Error()
    current=await result.json()

    const title=document.querySelector('#admin-title'), description=document.querySelector('#admin-description')
    const media=document.querySelector('#media-panel'), inquiries=document.querySelector('#inquiries-panel')
    const links=[]
    const panels=[
      ['home','Homepage','الصفحة الرئيسية','Edit the opening section, key facts and trust cards.','عدّل الواجهة الرئيسية وحقائق الشركة والمزايا.'],
      ['pages','Pages','الصفحات','Edit the content and images of each interior page.','عدّل نصوص وصور كل صفحة داخلية.'],
      ['sections','Collections','الأقسام والعناصر','Edit and reorder sections, products, services and projects.','عدّل ورتّب الأقسام والمنتجات والخدمات والمشروعات.'],
      ['settings','Brand & settings','الهوية والإعدادات','Manage colors, the logo, contact links and interface labels.','أدر الألوان والشعار وروابط التواصل ونصوص الواجهة.'],
      ['media','Media upload','رفع الصور','Upload an image, then paste its URL into an image field.','ارفع الصورة ثم الصق رابطها في حقل الصورة.'],
      ['inquiries','Consultation requests','طلبات الاستشارة','Review the latest requests submitted from the website.','راجع أحدث الطلبات المرسلة من الموقع.']
    ]
    function select(panel) {
      const [key,en,arabic,enDescription,arDescription]=panel
      links.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.panel===key)))
      title.textContent=t(en,arabic)
      description.textContent=t(enDescription,arDescription)
      root.replaceChildren()
      media.hidden=key!=='media'
      inquiries.hidden=key!=='inquiries'
      if(key==='pages'){
        const picker=el('select')
        picker.setAttribute('aria-label',t('Choose a page','اختر صفحة'))
        for(const [id,page] of Object.entries(current.data.pages)){
          const option=el('option',page.title);option.value=id;picker.append(option)
        }
        const fields=el('div')
        fields.className='admin-fields'
        const draw=()=>{
          fields.replaceChildren()
          const page=current.data.pages[picker.value]
          Object.keys(page).forEach(field=>render(fields,page,field))
        }
        picker.onchange=draw
        root.append(picker,fields)
        draw()
      }else{
        const groups={home:['tagline','headline','subtitle','subtitleAccent','intro','hero','video','features','stats','homeProof'],sections:['sections'],settings:['brand','chrome','logo','green','orange','contactLinks','socialLinks','ui']}
        for(const field of groups[key]||[])render(root,current.data,field)
      }
    }
    for(const panel of panels){
      const button=action(t(panel[1],panel[2]),()=>select(panel))
      button.dataset.panel=panel[0]
      links.push(button)
      document.querySelector('#admin-nav').append(button)
    }
    select(panels[0])


    const save=action(t('Save changes','حفظ التغييرات'),async()=>{
      try{
        const result=await fetch('/admin/content'+query,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(current)})
        if(result.status===409){status.textContent=t('Content changed in another session. Reload before saving.','تم تعديل المحتوى في جلسة أخرى. حدّث الصفحة قبل الحفظ.');return}
        if(!result.ok)throw Error()
        current.revision=(await result.json()).revision
        status.textContent=t('Changes saved.','تم حفظ التغييرات.')
      }catch{status.textContent=t('Could not save.','تعذّر الحفظ.')}
    })
    document.querySelector('.admin-toolbar').append(save)
    const requests=await fetch('/admin/inquiries')
    const entries=requests.ok?await requests.json():[]
    if(!entries.length)document.querySelector('#inquiries').append(el('p',requests.ok?t('No consultation requests yet.','لا توجد طلبات استشارة حتى الآن.'):t('Could not load requests.','تعذّر تحميل الطلبات.')))
    for(const row of entries){
      const article=el('article')
      article.append(el('h3',row.name),el('p',[row.created_at,row.email,row.phone,row.company,row.service].filter(Boolean).join(' · ')),el('p',row.details))
      document.querySelector('#inquiries').append(article)
    }
  }catch{status.textContent=t('Could not load content.','تعذّر تحميل المحتوى.')}
  document.querySelector('#upload').onclick=async()=>{
    const file=document.querySelector('#file').files[0]
    if(!file)return
    try{
      const result=await fetch('/admin/upload',{method:'POST',headers:{'content-type':file.type},body:file})
      if(!result.ok)throw Error()
      document.querySelector('#asset-url').value=(await result.json()).url
      status.textContent=t('Image uploaded. Copy the URL into an image field.','تم رفع الصورة. انسخ الرابط إلى حقل الصورة.')
    }catch{status.textContent=t('Upload failed. Use a supported image under 4 MB.','تعذّر الرفع. اختر صورة مدعومة أقل من ٤ ميجابايت.')}
  }
}
