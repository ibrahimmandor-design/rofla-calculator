# ROFLA — Simple Real-Shop Requirements

## The main rule
ROFLA is a practical daily notebook and calculator for a real Egyptian sweets shop. It must answer:
- جبت إيه؟ وبكام؟ ومنين؟
- عندي إيه في المخزن دلوقتي؟ وإيه قرب يخلص؟
- عملت إيه النهارده؟ واستخدمت خامات قد إيه؟
- طلع كام قطعة/صينية/صاج؟ والهالك والبواقي كام؟
- بعت إيه؟ وبعت بكم؟ والكميات المتبقية كام؟
- الصنف تكلفته كام؟ وبكسب فيه كام؟
- أنا واقف فين النهارده والشهر ده؟ وإيه اللي محتاج أشتريه؟

## Simplicity first
- Arabic first, RTL, mobile-first, large buttons and very short forms.
- A chef with little or no smartphone experience must be able to record production after a very short explanation.
- No accounting jargon, crowded dashboards, long forms or forced setup wizard.
- Use familiar words: الصنف، الخامة، المقادير، التشغيلة، الصاج، الصينية، الناتج، عدد القطع، الهالك، البواقي، التالف، البيع، المصاريف، التكلفة، المكسب.
- Main actions: شراء جديد / استلام خامات / إنتاج النهارده / بيع / مصروف / جرد سريع.
- Remember common choices and offer defaults. Keep advanced details under «تفاصيل أكتر» and optional.
- Confirm saving only after the record is actually saved.

## Accounts — exactly ONE shared account
- The entire shop uses ONE account only, shared by the owner and all staff on the shop devices.
- No separate employee accounts, no personal logins, no employee roles, no permission matrix and no individual PINs.
- Do not force the chef to log in or enter credentials during daily work.
- If a login is needed to protect the system, it is one shared shop account controlled by the owner. The same account is used on all authorized devices.
- Employee name may be an optional simple field on a transaction if the owner wants to know who did it; it is not a login or permission.
- All devices using the shared account see the same central records.

## Main screens
1. **الرئيسية — أنا فين؟** Today and month-to-date: sales, purchases, expenses, production, waste, estimated stock and what needs attention.
2. **جبت إيه؟ — المشتريات** Supplier, date, item, quantity, unit, unit price, total and optional invoice/photo. Only received goods increase stock.
3. **عندي إيه؟ — المخزون** Current balance by item, unit, minimum needed and low/near-expiry items. Easy add, use, return and quick count.
4. **عملت إيه؟ — الإنتاج** Select item, enter trays/saj/batches and actual quantities used. Show recipe quantities if available; allow actual use to be adjusted. Record good output, waste and reusable leftovers. One clear button: «تأكيد الإنتاج».
5. **بعت بكم؟ — البيع** Quick sale by piece, weight, box, plate or tray as appropriate. Enter quantity and selling price; reduce finished stock once.
6. **دفعت كام؟ — المصاريف** Short entry: what, amount, date and category. Optional note/photo.
7. **التكلفة والسعر — اختياري** Show actual/estimated cost and profit per item. Suggest a selling price only if the owner chooses; never force it or block a sale.
8. **التقارير — يومي وشهري** Plain summaries and simple trends, not accounting jargon.

## Realistic stock and production rules
- Stock changes only from a recorded purchase receipt, production use/output, sale, return, waste, transfer or correction.
- Keep a simple movement history so the owner understands why a balance changed.
- A production record tracks item, batch/trays/saj, materials used, actual good output, waste and reusable leftovers.
- Prevent double deduction/addition if save is tapped more than once.
- Practical configurable units: kg, gram, litre, ml, piece, صاج، صينية، علبة، طبق. Never assume every tray has a fixed yield; let the shop define it per item.
- Separate reusable leftovers from waste and damaged goods.
- Label cost as estimated or actual based on recorded consumption and purchase prices.
- Deduct monthly expenses once only; do not subtract the same expense twice through overhead allocation.
- Never invent opening balances, recipes, costs, sales or supplier prices. Label sample data clearly as تجربة.

## The old calculator
- Keep root `index.html` exactly as it is. Do not merge, replace or redesign it.
- The new system lives in its own `management/` folder and branch until reviewed.
- Reuse useful calculations only after checking their formulas.

## Shared data and technology
- Use one central cloud database so all devices signed into the one shared account see the same records.
- Keep infrastructure invisible to staff. No staff member needs to understand databases or technical settings.
- Do not claim cloud sync or backups work before real end-to-end configuration and testing.
- Never expose secret service keys in browser code.
- No paid plan, purchase, publication or spending without the owner's explicit approval.

## First working release
1. Add a raw material and record a purchase/receipt.
2. Verify stock and low-stock amount.
3. Create a recipe (optional) and record a production batch.
4. Record actual materials used, good output, waste and leftovers.
5. Record a sale and verify finished stock decreases once.
6. Show today's and this month's purchases, usage, production, sales, expenses and estimated result.
7. Test on a phone with large touch targets and minimal typing.
8. Verify root `index.html` remains unchanged.

## Definition of success
The chef can record production without feeling lost. The owner can open the phone and immediately understand what came in, what was used, what was made, what sold, what remains, what needs buying, and how the shop is doing today and this month.

## ROFLA's actual operating model
- ROFLA is both a small production kitchen and a retail sweets/bakery shop in the **same physical location**.
- Treat it as one location and one shared stock ledger; do not create separate factory/shop warehouses or internal transfers.
- Support three product groups: eastern sweets, western sweets, and simple bakery items.
- Support two supply methods per product: made in the shop (recipe, raw-material use and production output) or bought ready from a supplier (purchase directly increases finished-product stock).
- The daily interface stays small. The owner sees management details; the chef sees only the simple actions needed to prepare and record production. This is not employee surveillance: no performance scores, monitoring dashboard or staff-account system.
- Expense categories should cover rent, electricity, gas, water, wages, cleaning, maintenance, packaging, delivery, app commissions, marketing, licenses, internet/phone, bank fees and other costs.
- Cost and profit reporting must separate direct product cost from shop operating expenses. Any allocation of shared monthly overhead to products must be transparent, configurable and counted exactly once. Show the allocation method; do not pretend an estimate is an exact product cost.
- Competitor comparison uses observed or publicly listed prices for equivalent products and comparable weights/sizes. Record competitor, date, size, price and source note. It can show whether ROFLA's price is higher/lower/close, but must never claim to know competitors' actual sales, costs or profits.


## Local-only operating phase (no cloud account)
- The current implementation remains browser-local with manual JSON backup and restore; synchronization is intentionally deferred until the owner reviews options.
- Inventory count records physical-vs-book differences as auditable stock adjustments.
- Production records gross output, saleable output, waste, and reusable leftovers separately; only saleable output enters finished-goods stock.
- Sales returns add returned quantities back to stock and reduce net revenue; the current version validates total returns against total sold quantity by product, but does not yet link returns to a specific invoice.
- Stock movement history records purchases, production consumption/output, sales, returns, and stock-count adjustments.


## Completed local-phase additions
- Daily and monthly reporting can be switched by date; the selected report can be printed from the browser.
- Purchase entries can record the amount paid immediately, including partial or zero payment for credit purchases.
- Supplier outstanding balances are summarized by supplier.
- Supplier settlements allocate against the oldest recorded outstanding purchase first. Settlement is not treated as a new operating expense, preventing double counting of the purchase cost.
- Legacy purchases without a recorded paid amount are excluded from supplier debt totals; their payment status is unknown and must not be guessed.
- These additions remain local to the current browser profile and do not create cross-device synchronization.


## Cash drawer and transaction integrity
- Cash sales increase the drawer; card, bank transfer, and app sales do not.
- Cash purchases, cash expenses, supplier settlements, and cash refunds decrease the drawer. Non-cash payment methods do not.
- The owner sets one opening cash balance, can record manual cash in/out, and can reconcile the physical count. Differences are recorded as auditable adjustment movements.
- The cash drawer begins from its explicitly entered opening balance; historic cash movements are not inferred.
- Production must validate all quantities and yield before any stock mutation. Duplicate recipe lines for the same raw material are aggregated before checking available stock, preventing overdraw.
\n\n### مشتريات بفواتير وبدون فواتير\n- يجب السماح بتسجيل مشتريات الموردين حتى عند عدم وجود فاتورة رسمية.\n- نوع المستند يحدد إلى «معايا فاتورة» أو «شراء بدون فاتورة»؛ رقم الفاتورة اختياري ولا يُختلق رقم عند غيابه.\n- في الحالتين تُسجل الكمية والتكلفة والمورد إن عُرف وطريقة الدفع والمدفوع والمتبقي، وتُحدّث حركة المخزون.\n- يجب تمييز المشتريات بدون فاتورة في سجل المشتريات والتقارير للمراجعة.\n
- في بيئة التشغيل المصرية، يكون الخيار الافتراضي للمشتريات «بدون فاتورة» مع إتاحة «إيصال / إثبات» و«فاتورة» عند توفرهما. لا يُشترط وجود مستند لتسجيل شراء فعلي.
- إضافة ملاحظة اختيارية للمشتريات لتوثيق مصدر الشراء أو تفاصيله.


### حماية البيانات والمرتجعات
- يجب تطبيع بنية البيانات عند تحميلها أو استرجاعها، مع ضمان وجود جميع قوائم الحركات وتحقق نوع المخزون ورصيد النقدية.
- يجب ربط المرتجعات الجديدة بسجلات البيع الأصلية، وتسجيل توزيع الكمية والتكلفة على كل عملية بيع أصلية، حتى لا تتغير تكلفة المرتجع بتغير متوسط تكلفة المخزون لاحقاً.
- يجب استمرار دعم بيانات المرتجعات القديمة غير المرتبطة بعملية بيع محددة.


### فواتير البيع متعددة الأصناف
- دعم فاتورة واحدة تحتوي عدة أصناف، لكل صنف كمية وسعر سطر مستقل.
- يجب التحقق من كل السطور وتوفر إجمالي مخزون كل صنف قبل تنفيذ أي خصم، ومنع الحفظ الجزئي عند فشل أي سطر.
- يجب ربط سطور الفاتورة بمعرّف فاتورة مشترك، وتسجيل طريقة التحصيل والقناة، وتسجيل حركة النقدية مرة واحدة بإجمالي الفاتورة.
- يجب استمرار دعم البيع السريع لصنف واحد والتوافق مع التقارير والمرتجعات.


### فواتير الشراء متعددة الأصناف
- فاتورة شراء واحدة تشمل خامات وأصناف جاهزة متعددة.
- بيانات المورد ونوع المستند ورقم الفاتورة وطريقة الدفع والمدفوع وملاحظات الفاتورة مشتركة.
- لكل سطر اسم وكمية ووحدة وإجمالي سعر وحد تنبيه اختياري للخامة.
- يجب فحص كل السطور ووحدات الأصناف قبل أي تعديل للمخزون.
- توزيع المدفوع والآجل على السطور بنسبة قيمة كل سطر، مع تسجيل النقدية مرة واحدة فقط.
- «بدون فاتورة» هو الاختيار الافتراضي؛ الفاتورة والإيصال اختياريان.


### سجل الفواتير واختيار أصل المرتجع
- عرض سجل مجمع لفواتير الشراء والبيع، مع الاحتفاظ بسطور كل فاتورة في البيانات الأصلية.
- إمكانية اختيار عملية البيع الأصلية عند تسجيل مرتجع، مع استمرار خيار التوزيع التلقائي FIFO عند عدم الاختيار.
- يجب ألا تتجاوز كمية المرتجع الكمية غير المرتجعة من عملية البيع المحددة.
