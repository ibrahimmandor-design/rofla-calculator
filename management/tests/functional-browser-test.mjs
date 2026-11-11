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
  const fill = async (id, value) => page.locator('#' + id).fill(String(value));
  const tab = async (id) => page.evaluate(id => window.showTab(id), id);
  const state = () => page.evaluate(() => JSON.parse(JSON.stringify(db)));

  // Cash opening balance and a real multi-line-capable purchase invoice form.
  await tab('cash');
  await fill('cashOpeningInput', 40);
  await page.evaluate(() => window.setCashOpening());
  await tab('buy');
  await page.locator('.purchase-invoice-row').last().locator('.pi-kind').selectOption('raw');
  await page.locator('.purchase-invoice-row').last().locator('.pi-name').fill('دقيق اختبار');
  await page.locator('.purchase-invoice-row').last().locator('.pi-qty').fill('2');
  await page.locator('.purchase-invoice-row').last().locator('.pi-unit').selectOption({ label: 'كيلو' });
  await page.locator('.purchase-invoice-row').last().locator('.pi-cost').fill('40');
  await fill('purchaseInvoiceSupplier', 'مورد اختبار');
  await fill('purchaseInvoicePaid', '40');
  await page.evaluate(() => window.savePurchaseInvoice());
  let d = await state();
  check('purchase', d.stock['خامة:دقيق اختبار']?.qty === 2 && d.purchases.length === 1, '2 kg flour stock; invoice saved');
  check('purchase cash movement', d.cashMovements.filter(x => x.kind === 'out').reduce((n,x)=>n+x.amount,0) === 40, '40 EGP paid from drawer');

  // Create product and recipe through the actual item form.
  await tab('items');
  await fill('itemName', 'بسبوسة اختبار');
  await page.locator('#itemType').selectOption('made');
  await page.locator('#itemUnit').selectOption({ label: 'قطعة' });
  await page.evaluate(() => window.addRecipeRow());
  await page.locator('.recipe-row .rn').last().fill('دقيق اختبار');
  await page.locator('.recipe-row .rq').last().fill('0.5');
  await page.locator('.recipe-row .ru').last().selectOption({ label: 'كيلو' });
  await page.evaluate(() => window.addItem());
  d = await state();
  const product = d.items.find(x => x.name === 'بسبوسة اختبار');
  check('item and recipe', !!product && product.recipe.length === 1, 'product and recipe stored');

  // Produce 10: 7 saleable, 2 reusable leftovers, 1 waste.
  await tab('make');
  await page.locator('#makeItem').selectOption(product.id);
  await page.evaluate(() => window.renderRecipeInputs());
  await fill('makeOutput', 10);
  await page.locator('#makeOutputUnit').selectOption({ label: 'قطعة' });
  await fill('makeWasteQty', 1);
  await fill('makeLeftQty', 2);
  await page.locator('.actual').fill('0.5');
  await page.evaluate(() => window.saveProduction());
  d = await state();
  check('production raw deduction', d.stock['خامة:دقيق اختبار']?.qty === 1.5, 'flour balance 1.5 kg');
  check('production finished stock', d.stock['منتج:بسبوسة اختبار']?.qty === 7, '7 saleable pieces');
  check('production leftovers and waste', d.stock['خامة:بواقي: بسبوسة اختبار']?.qty === 2 && d.productions[0].wasteCost === 1, '2 leftovers; waste cost 1 EGP');

  // Reuse the leftovers as a recipe ingredient in a second product.
  await tab('items');
  await fill('itemName', 'كنافة اختبار');
  await page.locator('#itemType').selectOption('made');
  await page.locator('#itemUnit').selectOption({ label: 'قطعة' });
  await page.evaluate(() => addRecipeRow());
  await page.locator('.recipe-row .rn').last().fill('بواقي: بسبوسة اختبار');
  await page.locator('.recipe-row .rq').last().fill('2');
  await page.locator('.recipe-row .ru').last().selectOption({ label: 'قطعة' });
  await page.evaluate(() => addItem());
  d = await state();
  const secondProduct = d.items.find(x => x.name === 'كنافة اختبار');
  await tab('make');
  await page.locator('#makeItem').selectOption(secondProduct.id);
  await page.evaluate(() => renderRecipeInputs());
  await fill('makeOutput', 5);
  await page.locator('#makeOutputUnit').selectOption({ label: 'قطعة' });
  await page.locator('.actual').fill('2');
  await page.evaluate(() => saveProduction());
  d = await state();
  check('leftovers reuse', d.stock['خامة:بواقي: بسبوسة اختبار']?.qty === 0 && d.stock['منتج:كنافة اختبار']?.qty === 5, 'leftovers consumed by next recipe');

  // Sale, return and expense through the actual entry functions.
  await tab('sell');
  await page.locator('#sellItem').selectOption(product.id);
  await page.locator('#sellUnit').selectOption({ label: 'قطعة' });
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
  check('cash drawer', Math.abs(cash - 8) < 0.0001, 'expected cash 8 EGP');
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

  // Customer credit, collection, daily close and audit trail.
  await tab('sell');
  await page.locator('#sellItem').selectOption(product.id);
  await page.locator('#sellUnit').selectOption({ label: 'قطعة' });
  await fill('sellQty', 1);
  await fill('sellPrice', 5);
  await fill('sellCustomer', 'عميل اختبار');
  await fill('sellPaidNow', 2);
  await page.locator('#sellPayMethod').selectOption('cash');
  await page.evaluate(() => window.addSale());
  d = await state();
  check('customer credit sale', d.sales.some(x => x.customerName === 'عميل اختبار' && x.dueAmount === 3), '3 EGP customer balance');
  await fill('customerPaymentName', 'عميل اختبار');
  await fill('customerPaymentAmount', 3);
  await page.evaluate(() => window.recordCustomerPayment());
  d = await state();
  check('customer payment', d.sales.filter(x => x.customerName === 'عميل اختبار').reduce((n,x)=>n+x.dueAmount,0) === 0 && d.customerPayments.length === 1, 'customer balance cleared');
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
  const cashAfterCustomer = await page.evaluate(() => window.cashExpected());
  await tab('cash');
  await fill('closeCashActual', cashAfterCustomer);
  await page.evaluate(() => window.closeBusinessDay());
  d = await state();
  check('daily close', d.dailyClosings.length === 1 && d.dailyClosings[0].difference === 0, 'daily cash reconciled');
  check('audit log', d.auditLog.length >= 5, d.auditLog.length + ' change records');

  // Verify that changes are written locally while the test session is active,
  // then verify that an unauthenticated reload clears the local copy.
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('rofla_mvp_v1') || 'null'));
  check('local write snapshot', !!stored && stored.sales.length >= 2 && stored.returns.length === 2 && stored.expenses.length === 1, 'transaction snapshot written before sign-out');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => localStorage.getItem('rofla_mvp_v1') === null);
  d = await state();
  check('signed-out reload cleanup', d.sales.length === 0 && localStorage.getItem('rofla_mvp_v1') === null, 'private local data cleared without owner session');
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
