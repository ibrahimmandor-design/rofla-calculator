# رفلا — نظام إدارة المحل

نسخة أولية لنظام بسيط لمحل رفلا الذي يجمع بين تصنيع الحلويات الشرقية والغربية والمخبوزات البسيطة وبيع أصناف مشتراة جاهزة.

## تجربة الواجهة
افتح `index.html` داخل هذا المجلد:
- `management/index.html`

الواجهة الحالية نموذج تجريبي يعمل محلياً على نفس المتصفح والجهاز باستخدام تخزين المتصفح. **ليست جاهزة لتسجيل بيانات التشغيل الحقيقية أو للمزامنة بين الأجهزة.**

## تدفق العمل
1. إضافة الأصناف وتحديد هل تُصنع في المحل أم تُشترى جاهزة.
2. حفظ وصفة اختيارية للصنف المصنّع.
3. تسجيل المشتريات لتحديث رصيد الخامات أو الأصناف الجاهزة.
4. تسجيل الإنتاج؛ تُعرض المقادير المقترحة ويمكن تعديل الاستهلاك الفعلي قبل الاعتماد.
5. تسجيل البيع لخصم المنتج من المخزون.
6. تسجيل مصروفات التشغيل.
7. إدخال أسعار منافسين موثقة للمقارنة على أساس نفس الوزن أو الحجم.

## قواعد أساسية
- مخزون واحد للمحل، مع تمييز الخامات عن المنتجات الجاهزة.
- لا تُخصم خامات الإنتاج إلا بعد اعتماد التشغيلة.
- لا يُسمح بتسجيل بيع يتجاوز الرصيد المتاح.
- الأصناف المشتراة جاهزة لا تحتاج وصفة.
- لا تُستخدم بيانات تجريبية على أنها بيانات حقيقية.
- الحساب المقصود حساب مشترك واحد للمحل؛ لا توجد حسابات منفصلة أو صلاحيات موظفين.
- لا نغيّر الحاسبة القديمة في جذر المستودع.

## قبل التشغيل الحقيقي
- ربط Supabase Cloud وتفعيل دخول واحد مشترك للمحل.
- تفعيل سياسات RLS والنسخ الاحتياطي.
- اختبار المشتريات والإنتاج والبيع والمصاريف على أكثر من جهاز.
- مراجعة تكلفة الوحدة وتوزيع المصاريف الثابتة والمتغيرة قبل الاعتماد على تقرير صافي المكسب.
- إضافة سجل حركات غير قابل للتعديل الصامت، ومنع تكرار تسجيل العملية عند الضغط مرتين.

## Added in the current MVP pass
- Added a monthly cost/profit report by product.
- Shared monthly expenses are allocated proportionally to each product's share of monthly sales revenue. This is explicitly an estimate, not a claim that every product consumes equal electricity, labor or equipment time.
- The report shows sales, recorded cost of goods sold, estimated expense share and remaining contribution per product.
- Added unit consistency checks for recipe materials, production output and sale units to reduce accidental kg/piece/tray mismatches.
- Added a market-price entry list for comparable item size/weight.

## Known limitations to fix before real operations
- Browser-local data is not cloud synchronized and can be lost if browser data is cleared.
- No authenticated Supabase connection has been configured. The SQL file is a schema foundation only.
- Multi-line purchase/sale invoices, supplier balances, customer balances, returns, refunds, cash drawer reconciliation and printable receipts are not yet implemented.
- The demo uses average purchase cost for stock and a simplified production-cost calculation. Before live financial reporting, implement a tested weighted-average or FIFO costing policy and server-side atomic transactions.
- Unit conversion (for example grams to kilograms) is not automatic yet. Recipe and stock units must match exactly; the app blocks mismatches rather than guessing.
- The monthly overhead allocation by revenue is a management estimate. Better allocation can later use direct labor time, batch count, equipment usage or production cost when reliable data exists.
- Competitor prices are manually observed entries. Live competitor price collection is not assumed or automated.
