import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const html = readFileSync('management/index.html', 'utf8');
const priceFnMatch = html.match(/function renderSuggestedPrice\(\)\{([\s\S]*?)\n\}/);
const checks = [
  ['session load deduplication state', /activeCloudUserId=null,cloudLoadPromise=null/.test(html)],
  ['same-user concurrent auth event guard', /if\(activeCloudUserId===userId\)[\s\S]{0,180}if\(cloudLoadPromise\)/.test(html)],
  ['failed initial cloud bootstrap is not reported as connected', /const saved=await persistCloudData\(\);\s*if\(!saved\)/.test(html)],
  ['cloud save returns explicit success', /cloudRevision=Number\(data\);cloudSaveFailed=false;setSyncMessage\('تم حفظ التغييرات سحابيًا — الإصدار '\+cloudRevision\);return true/.test(html)],
  ['cloud conflict blocks further saves', /ROFLA_CONFLICT[\s\S]{0,220}cloudReady=false/.test(html)],
  ['non-owner email is rejected', /toLowerCase\(\)!==ROFLA_EMAIL/.test(html)],
  ['new cloud sync build marker', /ROFLA_BUILD_20261112_COMPLETE_REVIEW_V13/.test(html)],
  ['cloud refresh tracks pending writes', /cloudWritesPending=0/.test(html) && /cloudWritesPending>0/.test(html)],
  ['automatic cloud refresh every 30 seconds', /setInterval\(\(\)=>\{if\(document\.visibilityState==='visible'\)refreshCloudIfSafe\(false\)\},30000\)/.test(html)],
  ['refreshes when app returns to foreground', /addEventListener\('focus',\(\)=>refreshCloudIfSafe\(false\)\)/.test(html)],
  ['automatic refresh protects local unsaved changes', /if\(!force&&\(cloudSaveFailed\|\|JSON\.stringify\(db\)!==lastSavedSnapshot\)\)return false/.test(html)],
  ['manual refresh warns before replacing failed local changes', /force&&\(!cloudReady\|\|cloudSaveFailed\)/.test(html)],
  ['optional suggested price calculator is present', /id="priceItem"/.test(html) && /id="targetMargin"/.test(html)],
  ['suggested price uses actual unit cost and margin formula', /const price=cost\/\(1-margin\/100\)/.test(html)],
  ['suggested price never saves or changes sale price', !!priceFnMatch && !priceFnMatch[0].includes('save(')],
  ['existing product editor is present', /id="editItemSelect"/.test(html) && /id="editRecipeRows"/.test(html)],
  ['recipe editor supports add, edit and save', /function addEditRecipeRow\(/.test(html) && /function loadItemEditor\(/.test(html) && /function saveItemEdits\(/.test(html)],
  ['product type and unit changes are blocked after transactions', /if\(\(type!==item\.type\|\|unit!==item\.unit\)&&\(hasHistory\|\|hasStock\)\)/.test(html)],
  ['manufactured product requires recipe ingredients', /if\(!recipe\.length\)return alert\('أضف خامة واحدة على الأقل لو الصنف بيتصنع في المحل'\)/.test(html)]
];
for (const [name, ok] of checks) { assert.ok(ok, 'FAIL '+name); console.log('PASS '+name); }
console.log('CLOUD SYNC GUARD RESULT: PASS ('+checks.length+' checks)');
assert.ok(priceFnMatch,'FAIL suggested price function can be extracted');
const priceHost={textContent:'',innerHTML:''};
const priceDB={items:[{id:'item-1',name:'اختبار',type:'bought'}],stock:{'جاهز:اختبار':{costPer:10}}};
const priceValues={priceItem:'item-1',targetMargin:'25'};
new Function('db','val','document','money',priceFnMatch[0])(
 priceDB,key=>priceValues[key]||'',{getElementById:id=>id==='priceSuggestion'?priceHost:null},n=>Number(n).toFixed(2)+' ج'
);
assert.match(priceHost.innerHTML,/سعر البيع المقترح:[\s\S]*13\.33/,'FAIL 25% margin calculation');
console.log('PASS suggested price calculation: cost 10, margin 25%, price 13.33');
const toggleMatch=html.match(/function toggleRecipeEditor\(type\)\{[^}]+\}/);
assert.ok(toggleMatch && /onchange="toggleRecipeEditor\(this.value\)"/.test(html),'FAIL recipe editor visibility handler');
let visibilityArgs=null;
new Function('type','document',toggleMatch[0])('made',{getElementById:()=>({classList:{toggle:(...args)=>{visibilityArgs=args}}})});
assert.deepEqual(visibilityArgs,['hidden',false],'FAIL made product should show recipe editor');
console.log('PASS recipe editor appears when product is marked made in-house');


