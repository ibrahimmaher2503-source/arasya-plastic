
import {DatabaseSync} from 'node:sqlite'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'
import assert from 'node:assert/strict'
import worker from './dist/server/index.js'
const db = new DatabaseSync(':memory:')
db.exec(readFileSync('drizzle/0000_initial.sql','utf8'))
db.exec(readFileSync('drizzle/0001_inquiry_company.sql','utf8'))
const DB={prepare(sql){
  const statement=db.prepare(sql)
  return this.bindStatement(statement,[])
},bindStatement(statement,args){
  return {bind:(...args)=>this.bindStatement(statement,args),run:()=>({meta:statement.run(...args)}),first:()=>statement.get(...args),all:()=>({results:statement.all(...args)})}
}}
const origin='http://127.0.0.1:8769'
const admin={'oai-authenticated-user-id':'local-owner'}
const call=(path,options={})=>worker.fetch(new Request(origin+path,options),{DB})
test('homepage project previews save independently of the interior gallery',async()=>{
  const state=await (await call('/admin/content',{headers:admin})).json()
  const original=structuredClone(state.data.homeProof.projectPreviews)
  state.data.homeProof.projectPreviews=[{title:'Editable preview',image:'/media/gallery-field.jpg'}]
  const save=async()=>{const result=await call('/admin/content',{method:'POST',headers:{...admin,origin},body:JSON.stringify(state)});assert.equal(result.status,200);state.revision=(await result.json()).revision}
  await save()
  const html=await (await call('/')).text()
  assert.match(html,/aria-label="Editable preview"/)
  assert.doesNotMatch(await (await call('/projects')).text(),/Editable preview/)
  state.data.homeProof.projectPreviews=original
  await save()
})
test('social links are localized and editable in both shared site regions',async()=>{
  const state=await (await call('/admin/content?lang=ar',{headers:admin})).json()
  state.data.socialLinks=[{title:'رابط تجريبي',href:'https://example.com/social',icon:'↗'}]
  const result=await call('/admin/content?lang=ar',{method:'POST',headers:{...admin,origin},body:JSON.stringify(state)})
  assert.equal(result.status,200)
  const html=await (await call('/contact?lang=ar')).text()
  assert.equal(html.split('href="https://example.com/social" aria-label="رابط تجريبي"').length-1,2)
  assert.doesNotMatch(await (await call('/contact')).text(),/example\.com\/social/)
})
test('locale content, owner access, revision protection, and consultation persistence',async()=>{
  assert.match(await (await call('/?lang=ar')).text(),/lang="ar" dir="rtl"/)
  assert.equal((await call('/admin')).status,401)
  const state=await (await call('/admin/content',{headers:admin})).json()
  state.data.headline='Updated <script>'
  const save={method:'POST',headers:{...admin,origin},body:JSON.stringify(state)}
  assert.equal((await call('/admin/content',save)).status,200)
  assert.equal((await call('/admin/content',save)).status,409)
  assert.match(await (await call('/')).text(),/Updated &lt;script&gt;/)
  assert.doesNotMatch(await (await call('/?lang=ar')).text(),/Updated/)
  const form={method:'POST',headers:{origin},body:new URLSearchParams({name:'QA',company:'Example Engineering',email:'qa@example.com',service:state.data.sections[0].items[0].title,details:'Check persistence'})}
  assert.equal((await call('/inquiry',form)).status,201)
  assert.equal((await call('/inquiry',{...form,body:'name=QA'})).status,400)
  assert.equal((await (await call('/admin/inquiries',{headers:admin})).json())[0].company,'Example Engineering')
})

test('interior pages use the same database and keep the active locale in navigation',async()=>{
  for(const slug of ['contact','projects','products','services','about','articles','applications','technical-specifications','how-to-choose-the-right-product']){
    const result=await call('/'+slug+'?lang=ar')
    assert.equal(result.status,200)
    assert.match(await result.text(),new RegExp('href="/'+slug+'\\?lang=en"'))
  }
  const original=await (await call('/admin/content',{headers:admin})).json()
  original.data.pages.services.title='Editable service page'
  const saved=await call('/admin/content',{method:'POST',headers:{...admin,origin},body:JSON.stringify(original)})
  assert.equal(saved.status,200)
  assert.match(await (await call('/services')).text(),/<h1>Editable service page<\/h1>/)
})

test('catalog links lead to local product details in both locales',async()=>{
  for(const lang of ['en','ar']){
    const {data}=await (await call('/admin/content?lang='+lang,{headers:admin})).json()
    const catalog=await (await call('/products?lang='+lang)).text()
    for(const item of data.sections.find(section=>section.id==='products').items){
      const path='/products/'+item.slug
      assert.ok(catalog.includes('href="'+path+'?lang='+lang+'"'))
      const response=await call(path+'?lang='+lang)
      assert.equal(response.status,200)
      assert.ok((await response.text()).includes('href="'+path+'?lang='+(lang==='ar'?'en':'ar')+'"'))
    }
  }
  assert.equal((await call('/products/no-such-product')).status,404)
})

test('product specifications are localized and editable without changing other products',async()=>{
  const en=await (await call('/products/geotextile')).text()
  assert.match(en,/50–1000 g\/m²/)
  const ar=await (await call('/products/geotextile?lang=ar')).text()
  assert.match(ar,/٥٠–١٠٠٠ غرام\/م²/)
  const state=await (await call('/admin/content',{headers:admin})).json()
  const products=state.data.sections.find(section=>section.id==='products').items
  products.find(item=>item.slug==='geotextile').specs[0].description='Updated specification'
  const result=await call('/admin/content',{method:'POST',headers:{...admin,origin},body:JSON.stringify(state)})
  assert.equal(result.status,200)
  assert.match(await (await call('/products/geotextile')).text(),/Updated specification/)
  assert.doesNotMatch(await (await call('/products/hdpe-geomembrane')).text(),/Updated specification/)
  assert.doesNotMatch(await (await call('/products/geotextile?lang=ar')).text(),/Updated specification/)
})
test('articles support local listing, editing, deletion and reject duplicate routes',async()=>{
  const state=await (await call('/admin/content',{headers:admin})).json()
  const articles=state.data.sections.find(section=>section.id==='articles').items
  const save=async()=>{const result=await call('/admin/content',{method:'POST',headers:{...admin,origin},body:JSON.stringify(state)});if(result.ok)state.revision=(await result.json()).revision;return result.status}
  articles.push({title:'Engineering notes',description:'Lining guide',image:'',href:'',slug:'lining-guide',body:'First paragraph.\n\n<script>unsafe</script>'})
  assert.equal(await save(),200)
  assert.match(await (await call('/articles')).text(),/href="\/articles\/lining-guide\?lang=en"/)
  assert.match(await (await call('/articles/lining-guide')).text(),/&lt;script&gt;unsafe&lt;\/script&gt;/)
  assert.equal((await call('/articles/lining-guide?lang=ar')).status,404)
  articles.push({...articles[0]})
  assert.equal(await save(),400)
  articles.pop()
  articles[0].body='Updated article'
  assert.equal(await save(),200)
  assert.match(await (await call('/articles/lining-guide')).text(),/Updated article/)
  articles.pop()
  assert.equal(await save(),200)
  assert.equal((await call('/articles/lining-guide')).status,404)
})

test('testimonials preserve locale, escape text and validate optional ratings',async()=>{
  const state=await (await call('/admin/content',{headers:admin})).json()
  const items=state.data.sections.find(section=>section.id==='testimonials').items
  const save=async()=>{const result=await call('/admin/content',{method:'POST',headers:{...admin,origin},body:JSON.stringify(state)});if(result.ok)state.revision=(await result.json()).revision;return result.status}
  items.push({title:'Test reviewer',description:'<script>Test feedback</script>',image:'',href:'',role:'Test role',rating:'5'})
  assert.equal(await save(),200)
  const html=await (await call('/')).text()
  assert.match(html,/&lt;script&gt;Test feedback&lt;\/script&gt;/)
  assert.match(html,/class="testimonial-rating" aria-label="5 \/ 5"/)
  assert.match(html,/Test role/)
  assert.doesNotMatch(await (await call('/?lang=ar')).text(),/Test reviewer/)
  for(const invalid of ['6','0','4.5','<script>']){
    items[0].rating=invalid
    assert.equal(await save(),400)
  }
  delete items[0].rating
  assert.equal(await save(),200)
  assert.doesNotMatch(await (await call('/')).text(),/class="testimonial-rating"/)
  items.pop()
  assert.equal(await save(),200)
  assert.doesNotMatch(await (await call('/')).text(),/Test reviewer/)
})

test('catalog icons render vectors and safely preserve custom CMS symbols',async()=>{
  const html=await (await call('/products')).text()
  const tabs=html.split('<div class="catalog-tabs">')[1].split('<div class="catalog-heading">')[0]
  assert.equal((tabs.match(/<svg /g)||[]).length,4)
  const state=await (await call('/admin/content',{headers:admin})).json()
  const original=state.data.pages.products.catalogGroups[0].icon
  state.data.pages.products.catalogGroups[0].icon='<img onerror="alert(1)">'
  const save=async()=>{const result=await call('/admin/content',{method:'POST',headers:{...admin,origin},body:JSON.stringify(state)});assert.equal(result.status,200);state.revision=(await result.json()).revision}
  await save()
  assert.match(await (await call('/products')).text(),/&lt;img onerror=&quot;alert\(1\)&quot;&gt;/)
  state.data.pages.products.catalogGroups[0].icon=original
  await save()
})

test('project filter navigation is editable independently of sector cards',async()=>{
  const state=await (await call('/admin/content',{headers:admin})).json()
  const page=state.data.pages.projects
  assert.equal(page.sectors.length,4)
  assert.equal(page.navigationSectors.length,5)
  assert.ok(page.gallery.some(item=>item.sector.split(/\s+/).includes('infrastructure')))
  page.navigationSectors[4].title='Edited infrastructure'
  const result=await call('/admin/content',{method:'POST',headers:{...admin,origin},body:JSON.stringify(state)})
  assert.equal(result.status,200)
  const html=await (await call('/projects')).text()
  assert.match(html,/data-filter="infrastructure"/)
  assert.match(html,/Edited infrastructure/)
  assert.equal((html.match(/id="sector-\d+"/g)||[]).length,4)
  assert.doesNotMatch(await (await call('/projects?lang=ar')).text(),/Edited infrastructure/)
})

test('older page collections receive missing fields while keeping edits and deletions',async()=>{
  const {data}=await (await call('/admin/content?lang=ar',{headers:admin})).json()
  const gallery=data.pages.projects.gallery
  gallery.pop()
  gallery[0].title='عنوان معدّل'
  delete gallery[0].sector
  db.prepare('UPDATE content SET document=? WHERE locale=?').run(JSON.stringify(data),'ar')
  const result=await (await call('/admin/content?lang=ar',{headers:admin})).json()
  assert.equal(result.data.pages.projects.gallery.length,4)
  assert.equal(result.data.pages.projects.gallery[0].title,'عنوان معدّل')
  assert.equal(result.data.pages.projects.gallery[0].sector,'industry')
})
