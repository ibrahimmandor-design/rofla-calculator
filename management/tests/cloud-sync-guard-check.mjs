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
  ['build marker exists and is versioned', /ROFLA_BUILD_[A-Z0-9_]+/.test(html)],
  ['Eastern sweets and bakery are the only in-house manufacturing categories', /function roflaSupplyType\(category\)\{return \['شرقي','مخبوزات'\]\.includes\(category\)\?'made':'bought'\}/.test(html)],
  ['competitor price entries carry an explicit category', /const marketCategory=x=>/.test(html) && /id="marketCategory"/.test(html) && /esc\(m\.category\|\|'—'\)/.test(html)],
  ['competitor benchmark set is expanded for Eastern, Western and bakery products', /ROFLA_COMPETITOR_PRICE_REFERENCE=\[/.test(html) && html.includes('تسيباس – مصر الجديدة') && html.includes('La Poire – القائمة الرسمية') && html.includes('VENUS Bakery & Cafe – هليوبوليس')],
  ['purchase invoice rows switch to the separate operating supplies list', /function setPurchaseRowChoiceList\(select\)[\s\S]*?select\.value==='supplies'\?'roflaSupplyChoices'/.test(html)],
  ['operating supplies are a separate purchase and stock type', /ROFLA_OPERATING_SUPPLIES=\[/.test(html) && /value="supplies">مستلزمات تشغيل/.test(html) && /مستلزم:/.test(html) && /roflaSupplyChoices/.test(html)],
  ['raw ingredients exclude packaging and cleaning supplies', /filter\(x=>!supplySet\.has\(x\)\)/.test(html) && /supplyItems=\[\.\.\.new Set/.test(html)],
  ['supplier names and average purchase unit price are shown in the lifecycle ledger', /supplierNames=\[\.\.\.new Set\(purchases\.map/.test(html) && /متوسط تكلفة الشراء للوحدة/.test(html) && /supplierNames\.join/.test(html)],
  ['lifecycle ledger includes the full catalog and suggested raw materials from zero balance', /productKeys=\(db\.items\|\|\[\]\)\.map/.test(html) && /rawNames=\[\.\.\.new Set/.test(html) && /كل كتالوج الأصناف والخامات ومستلزمات التشغيل ظاهر/.test(html)],
  ['complete purchase-to-sale traceability columns are present', /قيمة المشتريات/.test(html) && /المرتجعات/.test(html) && /صافي المباع/.test(html) && /قيمة المخزون المتبقي/.test(html) && /function renderFlowSummary\(/.test(html)],
  ['supplier and customer inputs support saved choices and free typing', /buySupplier[\s\S]{0,180}اسم المورد/.test(html) && /roflaSupplierChoices/.test(html) && /roflaCustomerChoices/.test(html) && /setAttribute\('list','roflaSupplierChoices'\)/.test(html)],
  ['fixed costs are automatically prorated in daily reports', /function getPeriodFixedRows\(mode,selected\)/.test(html) && /prorated:true/.test(html)],
  ['fixed overhead is separated and allocated to each sold unit', /function getPeriodOverheadSplit\(/.test(html) && /function overheadShareForProduct\(/.test(html) && /المصاريف الثابتة للوحدة/.test(html) && /نصيبه من المصاريف الثابتة/.test(html)],
  ['custom product category is writable', /id="itemCategoryOther"/.test(html) && /toggleCustomChoice\('itemCategory','itemCategoryOther'\)/.test(html)],
  ['custom sales channels are writable in quick and invoice sales', /id="sellChannelOther"/.test(html) && /id="invoiceChannelOther"/.test(html) && /channel=val\('sellChannel'\)==='أخرى'/.test(html) && /channel=val\('invoiceChannel'\)==='أخرى'/.test(html)],
  ['custom expense names can be entered for one-off and recurring costs', /id="expCustomType"/.test(html) && /id="recCustomType"/.test(html) && /function toggleCustomExpenseType\(/.test(html)],
  ['baking pan unit is available across unit selectors', (html.match(/<option>صاج<\/option>/g)||[]).length >= 5],
  ['live setup progress overview is present', /id="setupProgress"/.test(html) && /function renderSetupProgress\(/.test(html) && /renderSetupProgress\(\)/.test(html)],
  ['setup overview reads real catalog, recipe, stock and activity counts', /const total=db\.items\.length/.test(html) && /recipes=made\.filter/.test(html) && /stockCount=Object\.values\(db\.stock\)/.test(html) && /activity=\(db\.purchases/.test(html)],
  ['cloud refresh tracks pending writes', /cloudWritesPending=0/.test(html) && /cloudWritesPending>0/.test(html)],
  ['automatic cloud refresh every 30 seconds', /setInterval\(\(\)=>\{if\(document\.visibilityState==='visible'\)refreshCloudIfSafe\(false\)\},30000\)/.test(html)],
  ['refreshes when app returns to foreground', /addEventListener\('focus',\(\)=>refreshCloudIfSafe\(false\)\)/.test(html)],
  ['automatic refresh protects local unsaved changes', /if\(!force&&\(cloudSaveFailed\|\|JSON\.stringify\(db\)!==lastSavedSnapshot\)\)return false/.test(html)],
  ['manual refresh warns before replacing failed local changes', /force&&\(!cloudReady\|\|cloudSaveFailed\)/.test(html)],
  ['optional suggested price calculator is present', /id="priceItem"/.test(html) && /id="targetMargin"/.test(html)],
  ['suggested price uses full unit cost and margin formula', html.includes('price=fullCost/(1-margin/100)')],
  ['suggested price never saves or changes sale price', !!priceFnMatch && !priceFnMatch[0].includes('save(')],
  ['existing product editor is present', /id="editItemSelect"/.test(html) && /id="editRecipeRows"/.test(html)],
  ['recipe editor supports add, edit and save', /function addEditRecipeRow\(/.test(html) && /function loadItemEditor\(/.test(html) && /function saveItemEdits\(/.test(html)],
  ['searchable product editor loads selected product fields', /id="roflaExistingItemChoices"/.test(html) && /document\.getElementById\('editItemType'\)\.value=item\.type/.test(html) && /document\.getElementById\('editItemCategory'\)\.value/.test(html)],
  ['product type and unit changes are blocked after transactions', /if\(\(type!==item\.type\|\|unit!==item\.unit\)&&\(hasHistory\|\|hasStock\)\)/.test(html)],
  ['manufactured product requires recipe ingredients', /if\(!recipe\.length\)return alert\('أضف خامة واحدة على الأقل لو الصنف بيتصنع في المحل'\)/.test(html)]
];
for (const [name, ok] of checks) { assert.ok(ok, 'FAIL '+name); console.log('PASS '+name); }
console.log('CLOUD SYNC GUARD RESULT: PASS ('+checks.length+' checks)');
assert.ok(priceFnMatch,'FAIL suggested price function can be extracted');
const priceHost={textContent:'',innerHTML:''};
const priceDB={items:[{id:'item-1',name:'اختبار',type:'bought'}],stock:{'جاهز:اختبار':{costPer:10}}};
const priceValues={priceItem:'item-1',targetMargin:'25'};
new Function('db','val','document','money','overheadPerUnitBreakdown',priceFnMatch[0]+';renderSuggestedPrice();')(
 priceDB,key=>priceValues[key]||'',{getElementById:id=>id==='priceSuggestion'?priceHost:null},n=>Number(n).toFixed(2)+' ج',()=>({fixed:0,other:0,total:0})
);
assert.ok(priceHost.innerHTML.includes('13.33 ج'),'FAIL 25% margin calculation: '+priceHost.innerHTML);
console.log('PASS suggested price calculation: cost 10, margin 25%, price 13.33');
const toggleMatch=html.match(/function toggleRecipeEditor\(type\)\{[^}]+\}/);
assert.ok(toggleMatch && /onchange="toggleRecipeEditor\(this.value\)"/.test(html),'FAIL recipe editor visibility handler');
let visibilityArgs=null;
new Function('type','document',toggleMatch[0]+';toggleRecipeEditor(type);')('made',{getElementById:()=>({classList:{toggle:(...args)=>{visibilityArgs=args}}})});
assert.deepEqual(visibilityArgs,['hidden',false],'FAIL made product should show recipe editor');
console.log('PASS recipe editor appears when product is marked made in-house');

const fixedRowsMatch=html.match(/function getPeriodFixedRows\(mode,selected\)\{[\s\S]*?\n\}/);
assert.ok(fixedRowsMatch,'FAIL fixed expense period rows can be extracted');
const fixedRowsFn=new Function('db','mode','selected',fixedRowsMatch[0]+';return getPeriodFixedRows(mode,selected);');
const recurringFixture={recurringExpenses:[{id:'rent',type:'إيجار',amount:1200,startMonth:'2026-11',active:true}],expenseAccruals:[]};
const monthRows=fixedRowsFn(recurringFixture,'month','2026-11');
const dayRows=fixedRowsFn(recurringFixture,'day','2026-11-15');
assert.equal(monthRows.length,1,'FAIL monthly fixed cost should be included before accrual generation');
assert.equal(monthRows[0].amount,1200,'FAIL monthly fixed cost amount');
assert.equal(dayRows.length,1,'FAIL daily fixed cost row');
assert.equal(dayRows[0].amount,40,'FAIL 1,200 EGP fixed cost should be allocated as 40 EGP/day in a 30-day month');
console.log('PASS monthly fixed cost auto-inclusion and daily proration: 1,200 EGP / 30 = 40 EGP/day');

const allocationMatch=html.match(/function overheadShareForProduct\(amount,product,totals,method\)\{[\s\S]*?\n\}/);
assert.ok(allocationMatch,'FAIL overhead allocation helper can be extracted');
const allocationFn=new Function('amount','product','totals','method',allocationMatch[0].replace(/^function overheadShareForProduct\(amount,product,totals,method\)\{/,'return (function(amount,product,totals,method){').replace(/\n\}$/,'\n})(amount,product,totals,method);'));
const fixedShare=allocationFn(1200,{revenue:500,cost:200,qty:10},{revenue:1000,cost:400,qty:20},'direct');
assert.equal(fixedShare,600,'FAIL fixed overhead share should follow direct cost share');
assert.equal(fixedShare/10,60,'FAIL fixed overhead per sold unit');
console.log('PASS fixed overhead allocation: 1,200 monthly fixed cost, 50% direct-cost share, 60 EGP per sold unit');



