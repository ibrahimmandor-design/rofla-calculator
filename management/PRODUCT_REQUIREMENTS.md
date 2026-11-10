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