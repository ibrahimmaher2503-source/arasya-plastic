import { readdir, readFile, mkdir, writeFile, copyFile, cp } from 'node:fs/promises'
await mkdir('dist/server', {recursive:true})
await mkdir('dist/.openai', {recursive:true})
const files = Object.fromEntries(await Promise.all((await readdir('assets')).map(async name => [name, (await readFile('assets/'+name)).toString('base64')])))
let code = await readFile('site.js','utf8')
for (const [name,path] of Object.entries({ASSETS:null,CSS:'site.css',CLIENT:'client.js',SEED:'content.json'})) {
  const value = path ? await readFile(path,'utf8') : files
  code = code.replace('BUILD_'+name, () => JSON.stringify(value))
}
await writeFile('dist/server/index.js',code)
await copyFile('.openai/hosting.json','dist/.openai/hosting.json')
await cp('drizzle','dist/drizzle',{recursive:true})
