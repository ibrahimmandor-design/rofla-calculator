import { chromium, devices } from 'playwright';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ headless: true });
const results = [];

async function runScenario(name, contextOptions) {
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  const jsErrors = [];
  page.on('pageerror', error => jsErrors.push('pageerror: '+error.message));
  page.on('console', message => { if(message.type()==='error' && /Uncaught|SyntaxError|ReferenceError|TypeError|Script error/i.test(message.text())) jsErrors.push('console: '+message.text()); });
  page.on('dialog', dialog => dialog.accept());
  await page.goto(process.env.ROFLA_BASE_URL || 'http://127.0.0.1:4173/management/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('rofla_mvp_v1', JSON.stringify({items:[],stock:{},sales:[{id:'PRIVATE_TEST_SENTINEL',name:'اختبار خصوصية',qty:1,price:1}]}));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof window.showTab === 'function' && localStorage.getItem('rofla_mvp_v1') === null, { timeout: 10000 });

  const check = (label, condition, detail = '') => {
    assert.ok(condition, name + ': ' + label + (detail ? ' — ' + detail : ''));
    results.push('PASS ' + name + ' ' + label + (detail ? ' — ' + detail : ''));
  };
  const access = await page.evaluate(() => ({
    tabsHidden: document.querySelector('.tabs').classList.contains('hidden'),
    panelsHidden: [...document.querySelectorAll('.panel')].every(p => p.classList.contains('hidden')),
    localDataCleared: localStorage.getItem('rofla_mvp_v1') === null,
    memoryCleared: db.sales.length === 0
  }));
  check('signed-out privacy gate', access.tabsHidden && access.panelsHidden && access.localDataCleared && access.memoryCleared, JSON.stringify(access));
  await page.evaluate(() => {
    document.getElementById('authGate').classList.add('hidden');
    document.querySelector('.tabs').classList.remove('hidden');
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('hidden'));
  });
  const operatorView = await page.evaluate(() => ({
    defaultMode: document.body.classList.contains('operator-mode') && !document.body.classList.contains('admin-mode'),
    visibleDailyTabs: [...document.querySelectorAll('#mainNavigation .tab:not(.admin-tab)')].filter(b => getComputedStyle(b).display !== 'none').map(b => b.dataset.tab),
    hiddenAdminTabs: [...document.querySelectorAll('#mainNavigation .admin-tab')].every(b => getComputedStyle(b).display === 'none'),
    togglePresent: !!document.getElementById('adminModeToggle')
  }));
  check('operator mode default', operatorView.defaultMode && operatorView.visibleDailyTabs.join(',') === 'home,sell,buy,make,returns' && operatorView.hiddenAdminTabs && operatorView.togglePresent, JSON.stringify(operatorView));
  await page.locator('#adminModeToggle').click();
  const adminView = await page.evaluate(() => ({
    enabled: document.body.classList.contains('admin-mode') && !document.body.classList.contains('operator-mode'),
    visibleAdminTabs: [...document.querySelectorAll('#mainNavigation .admin-tab')].filter(b => getComputedStyle(b).display !== 'none').length,
    hintVisible: getComputedStyle(document.getElementById('modeHint')).display !== 'none'
  }));
  check('admin tools expand on demand', adminView.enabled && adminView.visibleAdminTabs === 7 && adminView.hintVisible, JSON.stringify(adminView));
  await page.locator('#mainNavigation .admin-tab[data-tab="reports"]').click();
  await page.locator('#adminModeToggle').click();
  const returnedView = await page.evaluate(() => ({
    operatorMode: document.body.classList.contains('operator-mode') && !document.body.classList.contains('admin-mode'),
    adminHidden: [...document.querySelectorAll('#mainNavigation .admin-tab')].every(b => getComputedStyle(b).display === 'none'),
    homeActive: document.getElementById('home').classList.contains('active'),
    hintHidden: getComputedStyle(document.getElementById('modeHint')).display === 'none'
  }));
  check('return to daily view safely', returnedView.operatorMode && returnedView.adminHidden && returnedView.homeActive && returnedView.hintHidden, JSON.stringify(returnedView));
  await page.evaluate(() => { window.ensureStarterCatalog(); window.renderAll(); });
  const initialCatalog = await page.evaluate(() => JSON.parse(JSON.stringify(db)));
  check('starter catalog follows the Eastern and bakery manufacturing rule',
    initialCatalog.items.length === 336 &&
    initialCatalog.items.filter(x => x.type === 'made').length === 215 &&
    initialCatalog.items.filter(x => x.type === 'bought').length === 121 &&
    initialCatalog.items.filter(x => ['شرقي','مخبوزات'].includes(x.category)).every(x => x.type === 'made') &&
    initialCatalog.items.filter(x => ['غربي','مكسرات وشوكولاتة','مشروبات'].includes(x.category)).every(x => x.type === 'bought'),
    initialCatalog.items.length + ' catalog items; 215 made in-house; 121 bought ready-made');
  const initialFlow = await page.locator('#stockFlowSummary').innerText();
  const flowRows = await page.locator('#stockFlowSummary tbody tr').count();
  check('lifecycle ledger lists products and raw materials before first purchase',
    flowRows >= 200 && initialFlow.includes('بسبوسة سادة') && initialFlow.includes('دقيق'),
    flowRows + ' visible catalog and ingredient rows with zero starting balances');
  const fill = async (id, value) => page.locator('#' + id).fill(String(value));
  const tab = async (id) => page.evaluate(id => window.showTab(id), id);
  const state = () => page.evaluate(() => JSON.parse(JSON.stringify(db)));

  // Cash opening balance and a real multi-line-capable purchase invoice form.
  await tab('cash');
  await fill('cashOpeningInput', 1240);
  await page.evaluate(() => window.setCashOpening());
  await tab('buy');
  const choiceLists = await page.evaluate(() => ({
    raw: [...document.querySelectorAll('#roflaRawChoices option')].map(x=>x.value),
    ready: [...document.querySelectorAll('#roflaReadyChoices option')].map(x=>x.value),
    supplies: [...document.querySelectorAll('#roflaSupplyChoices option')].map(x=>x.value)
  }));
  check('choice-first ingredient catalog', ['دقيق','سمن','سمن بلدي','سميد ناعم','زبدة','سكر','سكر أبيض'].every(x=>choiceLists.raw.includes(x)), 'common bakery ingredients are selectable');
  check('ready sweets catalog follows purchased-only categories',
    ['جاتوه شوكولاتة','تورتة شوكولاتة','شوكولاتة سادة'].every(x=>choiceLists.ready.includes(x)) &&
    !choiceLists.ready.includes('بسبوسة سادة') && !choiceLists.ready.includes('باتيه جبنة'),
    'Western and chocolate are ready-bought; Eastern and bakery stay in-house');
  check('operating supplies are separated from food ingredients',
    ['غاز تشغيل','قفازات','منظفات','مطهرات'].every(x=>choiceLists.supplies.includes(x)) && choiceLists.raw.includes('أكياس'),
    'packaging stays available for recipe costing; cleaning and safety supplies are separate');
  await page.locator('#buyKind').selectOption('ready');
  check('quick purchase choices follow purchase type', await page.locator('#buyName').getAttribute('list') === 'roflaReadyChoices', 'ready products list');
  await page.locator('#buyKind').selectOption('supplies');
  check('quick purchase has a separate operating supplies list', await page.locator('#buyName').getAttribute('list') === 'roflaSupplyChoices', 'operating supplies list');
  await page.locator('#buyKind').selectOption('raw');
  check('custom typed item remains supported', await page.locator('#buyName').getAttribute('list') === 'roflaRawChoices', 'free text with raw material suggestions');
  check('supplier field offers suggestions and accepts typed names',
    await page.locator('#buySupplier').getAttribute('list') === 'roflaSupplierChoices',
    'supplier choices plus free text');
  await page.locator('#buyKind').selectOption('raw');
  await fill('buyName', 'دقيق اختبار');
  await fill('buyQty', 2);
  await page.locator('#buyUnit').fill('كيلو');
  await fill('buyCost', 40);
  await fill('buySupplier', 'مورد اختبار');
  await page.locator('#buyPayMethod').selectOption('cash');
  await fill('buyPaid', 40);
  await page.evaluate(() => window.addPurchase());
  let d = await state();
  check('purchase', d.stock['خامة:دقيق اختبار']?.qty === 2 && d.purchases.length === 1, '2 kg flour stock; invoice saved');
  check('purchased materials appear in stock flow summary', (await page.locator('#stockFlowSummary').innerText()).includes('دقيق اختبار'), 'purchased raw material listed');
  check('purchase cash movement', d.cashMovements.filter(x => x.kind === 'out').reduce((n,x)=>n+x.amount,0) === 40, '40 EGP paid from drawer');

  // Verify that a ready-bought item can be switched to in-house production and back.
  await tab('items');
  await fill('itemName', 'صنف جاهز للتصنيف');
  await page.locator('#itemCategory').selectOption('غربي');
  await fill('itemUnit', 'قطعة');
  await page.evaluate(() => window.addItem());
  d = await state();
  const starterItem = d.items.find(x => x.name === 'صنف جاهز للتصنيف');
  assert.ok(starterItem, 'ready-bought test item missing');
  await page.locator('#editItemSelect').fill(starterItem.name.slice(0,1));
  check('item search suggestions by first letter', await page.locator('#roflaExistingItemChoices option').evaluateAll((opts, prefix) => opts.some(o => o.value.startsWith(prefix)), starterItem.name.slice(0,1)), starterItem.name.slice(0,1));
  await page.locator('#editItemSelect').fill(starterItem.name);
  await page.locator('#editItemCategory').selectOption('شرقي');
  check('recipe editor opens for made item', await page.locator('#editRecipeEditor').isVisible(), starterItem.name);
  await page.evaluate(() => window.addEditRecipeRow());
  await page.locator('.edit-recipe-row .ern').last().fill('دقيق اختبار');
  await page.locator('.edit-recipe-row .erq').last().fill('0.1');
  await page.locator('.edit-recipe-row .eru').last().fill('كيلو');
  await page.evaluate(() => window.saveItemEdits());
  d = await state();
  check('starter item switched to made', d.items.find(x => x.id === starterItem.id)?.type === 'made' && d.items.find(x => x.id === starterItem.id)?.recipe.length === 1, starterItem.name);
  await page.locator('#editItemCategory').selectOption('غربي');
  await page.evaluate(() => window.saveItemEdits());
  d = await state();
  check('starter item can return to bought', d.items.find(x => x.id === starterItem.id)?.type === 'bought' && d.items.find(x => x.id === starterItem.id)?.recipe.length === 0, starterItem.name);

  // Create product and recipe through the actual item form.
  await fill('itemName', 'بسبوسة اختبار');
  await page.locator('#itemCategory').selectOption('شرقي');
  await fill('itemUnit', 'قطعة');
  await page.evaluate(() => window.addRecipeRow());
  await page.locator('.recipe-row .rn').last().fill('دقيق اختبار');
  await page.locator('.recipe-row .rq').last().fill('0.5');
  await page.locator('.recipe-row .ru').last().fill('كيلو');
  await page.evaluate(() => window.addItem());
  d = await state();
  const product = d.items.find(x => x.name === 'بسبوسة اختبار');
  check('item and recipe', !!product && product.recipe.length === 1, 'product and recipe stored');

  // Edit the saved recipe through the product editor without changing its values.
  await page.locator('#editItemSelect').fill(product.name.slice(0,1));
  check('recipe editor search suggestions by first letter', await page.locator('#roflaExistingItemChoices option').evaluateAll((opts, prefix) => opts.some(o => o.value.startsWith(prefix)), product.name.slice(0,1)), product.name.slice(0,1));
  await page.locator('#editItemSelect').fill(product.name);
  check('product editor loads recipe', await page.locator('.edit-recipe-row').count() === 1, 'existing recipe is editable');
  await page.locator('.edit-recipe-row .erq').fill('0.5');
  await page.evaluate(() => window.saveItemEdits());
  d = await state();
  check('product recipe edit saved', d.items.find(x => x.id === product.id)?.recipe[0]?.qty === 0.5, 'recipe remains 0.5 kg');

  // Produce 10: 7 saleable, 2 reusable leftovers, 1 waste.
  await tab('make');
  await page.locator('#makeItem').selectOption(product.id);
  await page.evaluate(() => window.renderRecipeInputs());
  await fill('makeOutput', 10);
  await page.locator('#makeOutputUnit').fill('قطعة');
  await fill('makeWasteQty', 1);
  await fill('makeLeftQty', 2);
  await page.locator('.actual').fill('0.5');
  await page.evaluate(() => window.saveProduction());
  d = await state();
  check('production raw deduction', d.stock['خامة:دقيق اختبار']?.qty === 1.5, 'flour balance 1.5 kg');
  const flourFlowRow = await page.locator('#stockFlowSummary tbody tr').filter({ hasText: 'دقيق اختبار' }).innerText();
  check('ingredient lifecycle names the products made from purchased flour',
    flourFlowRow.includes('بسبوسة اختبار') && /[١1]/.test(flourFlowRow),
    flourFlowRow.replace(/\\s+/g,' ').slice(0,220));
  check('ingredient lifecycle counts production batches that consumed it',
    /عدد التشغيلات التي استخدمت الخامة/.test(await page.locator('#stockFlowSummary').innerText()) && flourFlowRow.includes('بسبوسة اختبار'),
    'ingredient-to-production trace is visible in the purchase lifecycle ledger');
  check('production finished stock', d.stock['منتج:بسبوسة اختبار']?.qty === 7, '7 saleable pieces');
  check('produced goods appear in stock flow summary', (await page.locator('#stockFlowSummary').innerText()).includes('بسبوسة اختبار'), 'produced item listed');
  check('production leftovers and waste', d.stock['خامة:بواقي: بسبوسة اختبار']?.qty === 2 && d.productions[0].wasteCost === 1, '2 leftovers; waste cost 1 EGP');

  // Optional price recommendation uses recorded unit cost and entered margin.
  await tab('items');
  await page.locator('#priceItem').selectOption(product.id);
  await fill('targetMargin', 25);
  const suggestedPrice = await page.locator('#priceSuggestion').innerText();
  const expectedSuggestedPrice = await page.evaluate(() => money(1 / (1 - 0.25)));
  check('suggested selling price', suggestedPrice.includes(expectedSuggestedPrice), suggestedPrice.replace(/\\s+/g,' ').slice(0,120));

  // Reuse the leftovers as a recipe ingredient in a second product.
  await tab('items');
  await fill('itemName', 'كنافة اختبار');
  await page.locator('#itemCategory').selectOption('شرقي');
  await fill('itemUnit', 'قطعة');
  await page.evaluate(() => addRecipeRow());
  await page.locator('.recipe-row .rn').last().fill('بواقي: بسبوسة اختبار');
  await page.locator('.recipe-row .rq').last().fill('2');
  await page.locator('.recipe-row .ru').last().fill('قطعة');
  await page.evaluate(() => addItem());
  d = await state();
  const secondProduct = d.items.find(x => x.name === 'كنافة اختبار');
  await tab('make');
  await page.locator('#makeItem').selectOption(secondProduct.id);
  await page.evaluate(() => renderRecipeInputs());
  await fill('makeOutput', 5);
  await page.locator('#makeOutputUnit').fill('قطعة');
  await page.locator('.actual').fill('2');
  await page.evaluate(() => saveProduction());
  d = await state();
  check('leftovers reuse', d.stock['خامة:بواقي: بسبوسة اختبار']?.qty === 0 && d.stock['منتج:كنافة اختبار']?.qty === 5, 'leftovers consumed by next recipe');

  // Sale, return and expense through the actual entry functions.
  await tab('sell');
  await fill('sellItem', product.name);
  await fill('sellUnit', 'قطعة');
  await fill('sellQty', 3);
  await fill('sellPrice', 15);
  await page.locator('#sellPayMethod').selectOption('cash');
  await page.evaluate(() => window.addSale());
  d = await state();
  check('sale', d.sales.length === 1 && d.stock['منتج:بسبوسة اختبار'].qty === 4, '3 pieces sold; 15 EGP collected');

  await tab('returns');
  await page.locator('#returnItem').selectOption(product.id);
  await fill('returnQty', 1);
  await fill('returnAmount', 5);
  await page.locator('#returnPayMethod').selectOption('cash');
  await page.evaluate(() => window.addReturn());
  d = await state();
  check('return', d.returns.length === 1 && d.stock['منتج:بسبوسة اختبار'].qty === 5 && d.returns[0].cost === 1, '1 piece returned; 5 EGP refunded');

  await tab('expense');
  await fill('expAmount', 2);
  await page.locator('#expPayMethod').selectOption('cash');
  await page.evaluate(() => window.addExpense());
  d = await state();
  check('expense', d.expenses.length === 1 && d.expenses[0].amount === 2, '2 EGP expense saved');

  // Physical stock count adjustment.
  await tab('stock');
  await page.locator('#countStock').selectOption('خامة:دقيق اختبار');
  await fill('countQty', 1.4);
  await page.evaluate(() => window.saveStockCount());
  d = await state();
  check('stock count', d.stock['خامة:دقيق اختبار'].qty === 1.4 && d.movements.some(x => x.kind === 'تسوية جرد'), 'inventory adjustment recorded');

  // Cash drawer and monthly report must reconcile to the known scenario.
  const cash = await page.evaluate(() => window.cashExpected());
  check('cash drawer', Math.abs(cash - 1208) < 0.0001, 'expected cash 1,208 EGP');
  await tab('reports');
  await page.evaluate(() => {
    document.getElementById('reportMode').value = 'month';
    document.getElementById('reportDate').value = new Date().toISOString().slice(0,10);
    window.renderReports();
    window.runDataAudit();
  });
  const report = await page.evaluate(() => ({
    sales: document.getElementById('rSales').textContent,
    cogs: document.getElementById('rCogs').textContent,
    expenses: document.getElementById('rExpenses').textContent,
    waste: document.getElementById('rWaste').textContent,
    net: document.getElementById('rNet').textContent,
    audit: document.getElementById('dataAudit').innerText
  }));
  const expectedMoney = await page.evaluate(() => ({ sales: money(10), cogs: money(2), expenses: money(2), waste: money(1), net: money(5) }));
  check('report revenue', report.sales === expectedMoney.sales, report.sales);
  check('report COGS', report.cogs === expectedMoney.cogs, report.cogs);
  check('report expenses and waste', report.expenses === expectedMoney.expenses && report.waste === expectedMoney.waste, report.expenses + ' / ' + report.waste);
  check('report net profit', report.net === expectedMoney.net, report.net);
  check('data audit', report.audit.includes('لم يظهر خطأ واضح'), report.audit.slice(0,120));

  // New home dashboard summary must reconcile with the same known transaction scenario.
  await tab('home');
  await page.evaluate(() => {
    document.getElementById('dashboardPeriod').value = 'all';
    window.renderDashboardSummary();
  });
  const dashboard = await page.evaluate(() => ({
    sales: document.getElementById('mSales').textContent,
    buys: document.getElementById('mBuys').textContent,
    cogs: document.getElementById('mCogs').textContent,
    gross: document.getElementById('mGross').textContent,
    expenses: document.getElementById('mExpenses').textContent,
    profit: document.getElementById('mProfit').textContent
  }));
  const dashboardExpected = await page.evaluate(() => ({
    sales: money(10), buys: money(40), cogs: money(2),
    gross: money(8), expenses: money(2), profit: money(5)
  }));
  for (const key of Object.keys(dashboardExpected)) {
    check('home dashboard ' + key, dashboard[key] === dashboardExpected[key], dashboard[key]);
  }

  // Recurring expenses: one accrual per month, payment must not double-count profit.
  await tab('expense');
  await fill('recAmount', 1200);
  await fill('recDueDay', 5);
  await fill('recStartMonth', new Date().toISOString().slice(0,7));
  await page.evaluate(() => window.addRecurringExpense());
  await page.evaluate(() => window.generateExpenseAccruals());
  await page.evaluate(() => window.generateExpenseAccruals());
  d = await state();
  check('recurring expense monthly accrual is idempotent', d.recurringExpenses.length === 1 && d.expenseAccruals.length === 1 && d.expenseAccruals[0].amount === 1200, 'one 1,200 EGP accrual despite generating twice');
  await page.evaluate(() => { window.prompt = () => 'bank'; window.payExpenseAccrual(db.expenseAccruals[0].id); });
  d = await state();
  check('recurring expense payment linked once', d.expenseAccruals[0].status === 'مدفوع' && d.expenses.filter(x => x.accrualId).length === 1, 'payment linked to its accrual');
  await tab('reports');
  await page.evaluate(() => { document.getElementById('reportMode').value='month'; document.getElementById('reportDate').value=new Date().toISOString().slice(0,10); window.renderReports(); });
  check('recurring expense counted once in profit', (await page.locator('#rExpenses').innerText()).includes('١٬٢٠٢') || (await page.locator('#rExpenses').innerText()).includes('1,202'), await page.locator('#rExpenses').innerText());
  const fixedAllocation = await page.evaluate(() => ({
    table: document.getElementById('productProfit').innerText,
    note: document.getElementById('overheadAllocationNote').innerText,
    fixedTotal: money(1200)
  }));
  check('fixed costs are allocated to products and displayed per sold unit',
    fixedAllocation.table.includes('نصيبه من المصاريف الثابتة') &&
    fixedAllocation.table.includes('المصاريف الثابتة للوحدة') &&
    fixedAllocation.note.includes(fixedAllocation.fixedTotal),
    fixedAllocation.note);
  await page.evaluate(() => {
    document.getElementById('reportMode').value='day';
    document.getElementById('reportDate').value=new Date().toISOString().slice(0,10);
    window.renderReports();
  });
  const dailyFixed = await page.evaluate(() => ({
    expenses: document.getElementById('rExpenses').textContent,
    expected: money(1200 / new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate() + 2)
  }));
  check('daily product profit includes one day of rent salary and utilities',
    dailyFixed.expenses === dailyFixed.expected,
    dailyFixed.expenses + ' expected ' + dailyFixed.expected);
  await page.evaluate(() => {
    document.getElementById('reportMode').value='month';
    window.renderReports();
  });
  await tab('expense');
  await page.locator('#recType').selectOption({ label: 'أخرى' });
  await fill('recCustomType', 'صيانة مخصصة');
  await fill('recAmount', 50);
  await fill('recStartMonth', new Date().toISOString().slice(0,7));
  await page.evaluate(() => window.addRecurringExpense());
  d = await state();
  check('custom recurring expense name can be saved',
    d.recurringExpenses.some(x => x.type === 'صيانة مخصصة' && x.amount === 50),
    'custom fixed expense name stored');

  // Customer credit, collection, daily close and audit trail.
  await tab('sell');
  await fill('sellItem', product.name);
  await fill('sellUnit', 'قطعة');
  await fill('sellQty', 1);
  await fill('sellPrice', 5);
  await fill('sellCustomer', 'عميل اختبار');
  await fill('sellPaidNow', 2);
  await page.locator('#sellPayMethod').selectOption('cash');
  await page.evaluate(() => window.addSale());
  d = await state();
  check('customer credit sale', d.sales.some(x => x.customerName === 'عميل اختبار' && x.dueAmount === 3), '3 EGP customer balance');
  const creditSale = d.sales.find(x => x.customerName === 'عميل اختبار');
  await tab('returns');
  await page.locator('#returnItem').selectOption(product.id);
  await page.locator('#returnSale').selectOption(creditSale.id);
  await fill('returnQty', 1);
  await fill('returnAmount', 5);
  await page.locator('#returnPayMethod').selectOption('cash');
  await page.evaluate(() => window.addReturn());
  d = await state();
  check('credit sale return settlement', d.sales.find(x => x.id === creditSale.id).dueAmount === 0 && d.returns[0].creditAdjusted === 3, '3 EGP receivable cancelled; only 2 EGP refunded in cash');
  await tab('sell');
  await fill('sellItem', product.name);
  await fill('sellUnit', 'قطعة');
  await fill('sellQty', 1);
  await fill('sellPrice', 5);
  await fill('sellCustomer', 'عميل سداد');
  await fill('sellPaidNow', 2);
  await page.locator('#sellPayMethod').selectOption('cash');
  await page.evaluate(() => window.addSale());
  d = await state();
  check('second customer credit', d.sales.some(x => x.customerName === 'عميل سداد' && x.dueAmount === 3), '3 EGP remains before collection');
  await fill('customerPaymentName', 'عميل سداد');
  await fill('customerPaymentAmount', 3);
  await page.evaluate(() => window.recordCustomerPayment());
  d = await state();
  check('customer payment', d.sales.filter(x => x.customerName === 'عميل سداد').reduce((n,x)=>n+x.dueAmount,0) === 0 && d.customerPayments.length === 1, 'customer balance cleared');
  await page.locator('#sellItem').selectOption(product.id);
  await fill('sellUnit', 'قطعة');
  await fill('sellQty', 1);
  await fill('sellPrice', 7);
  await fill('sellCustomer', '');
  await fill('sellPaidNow', 7);
  await page.locator('#sellPayMethod').selectOption('bank');
  await page.locator('#sellChannel').selectOption({ label: 'أخرى' });
  await fill('sellChannelOther', 'طلبات واتساب');
  await page.evaluate(() => window.addSale());
  d = await state();
  check('custom sales channel can be entered and saved',
    d.sales.some(x => x.channel === 'طلبات واتساب'),
    'custom sales channel stored');
  const cashAfterCustomer = await page.evaluate(() => window.cashExpected());
  await tab('cash');
  await fill('closeCashActual', cashAfterCustomer);
  await page.evaluate(() => window.closeBusinessDay());
  d = await state();
  check('daily close', d.dailyClosings.length === 1 && d.dailyClosings[0].difference === 0, JSON.stringify({dailyClosings:d.dailyClosings,cashAfterCustomer}));
  check('audit log', d.auditLog.length >= 5, d.auditLog.length + ' change records');
  await tab('buy');
  await page.locator('#buyKind').selectOption('supplies');
  await fill('buyName', 'أكياس اختبار');
  await fill('buyQty', 10);
  await fill('buyUnit', 'قطعة');
  await fill('buyCost', 20);
  await fill('buySupplier', 'مورد تغليف');
  await page.locator('#buyPayMethod').selectOption('bank');
  await fill('buyPaid', 20);
  await fill('buyLow', 12);
  await page.evaluate(() => window.addPurchase());
  d = await state();
  check('operating supplies purchase updates separate stock balance',
    d.stock['مستلزم:أكياس اختبار']?.qty === 10 && d.stock['مستلزم:أكياس اختبار']?.kind === 'supplies',
    '10 packaging units recorded as operating supplies');
  const supplyFlow = await page.locator('#stockFlowSummary').innerText();
  check('operating supplies ledger shows supplier and purchase value',
    supplyFlow.includes('أكياس اختبار') && supplyFlow.includes('مورد تغليف') && supplyFlow.includes('مستلزم تشغيل'),
    'supply purchase traceable by supplier');
  check('operating supplies low-stock alert',
    (await page.locator('#shoppingSuggestions').innerText()).includes('أكياس اختبار'),
    'reorder alert for operating supplies');

  // Verify that changes are written locally while the test session is active,
  // then verify that an unauthenticated reload clears the local copy.
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('rofla_mvp_v1') || 'null'));
  check('local write snapshot', !!stored && stored.sales.length >= 2 && stored.returns.length === 2 && stored.expenses.length === 2 && stored.expenses.filter(x => x.accrualId).length === 1, 'transaction snapshot written before sign-out');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => localStorage.getItem('rofla_mvp_v1') === null);
  d = await state();
  const clearedAfterReload = await page.evaluate(() => localStorage.getItem('rofla_mvp_v1') === null);
  check('signed-out reload cleanup', d.sales.length === 0 && clearedAfterReload, 'private local data cleared without owner session');
  check('browser JavaScript errors', jsErrors.length === 0, jsErrors.join(' | ') || '0 errors');
  await context.close();
}

try {
  await runScenario('Desktop', { viewport: { width: 1440, height: 900 } });
  await runScenario('iPhone', { ...devices['iPhone 13'] });
  console.log(results.join('\n'));
  console.log('FUNCTIONAL RESULT: PASS (' + results.length + ' checks, 0 failed scenarios)');
} catch (error) {
  console.error(results.join('\n'));
  console.error('FUNCTIONAL RESULT: FAIL');
  console.error(error.stack || error);
  process.exitCode = 1;
} finally {
  await browser.close();
}
