# ROFLA — Simple Real-Shop Requirements

## The main rule
ROFLA is a practical daily notebook and calculator for a real Egyptian sweets shop. It must answer, simply:
- جبت إيه؟ وبكام؟ ومنين؟
- عندي إيه في المخزن دلوقتي؟ وإيه قرب يخلص؟
- عملت إيه النهارده؟ واستخدمت خامات قد إيه؟
- طلع كام قطعة/صينية/صاج؟ والهالك والبواقي كام؟
- بعت إيه؟ وبعت بكم؟ والكميات المتبقية كام؟
- الصنف تكلفته كام؟ وبكسب فيه كام؟
- أنا واقف فين النهارده والشهر ده؟ وإيه اللي محتاج أشتريه؟

## Simplicity is a requirement, not a nice-to-have
- Arabic first, right-to-left, mobile-first, large buttons and very short forms.
- A chef who has never used a smartphone should be able to record a production batch after a very short explanation.
- No accounting jargon, no crowded dashboards, no long forms, no forced setup wizard.
- Use familiar words: الصنف، الخامة، المقادير، التشغيلة، الصاج، الصينية، الناتج، عدد القطع، الهالك، البواقي، التالف، البيع، المصاريف، التكلفة، المكسب.
- The main actions should be obvious: **شراء جديد / استلام خامات / إنتاج النهارده / بيع / مصروف / جرد سريع**.
- Remember common choices and offer defaults; allow voice-friendly short item names and numeric entry.
- Show a clear saved confirmation only after the record is actually saved.
- Keep advanced details under «تفاصيل أكتر» and optional.

## No individual employee accounts or complicated permissions
- Do NOT build separate employee accounts, employee roles, role matrices or per-employee permission screens.
- Do NOT make the chef log in with a personal email/password.
- Keep the day-to-day production screen open and extremely simple on the shop device.
- If access protection is needed, prefer one owner-controlled simple PIN or a single owner login, not separate staff accounts. Do not block basic workflow with complicated authentication.
- Record employee name only as an optional simple field when useful (e.g. اسم الشيف), not as an account requirement.

## Main screens
1. **الرئيسية — أنا فين؟** Today and month-to-date: sales, purchases, expenses, production, waste, estimated stock and cash entered. Show plain-language warnings and what needs attention.
2. **جبت إيه؟ — المشتريات** Supplier, date, item, quantity, unit, unit price, total and optional invoice/photo. Confirm actual received quantity; only received goods increase stock.
3. **عندي إيه؟ — المخزون** Current balance by ingredient/item, unit, minimum needed, what is low/near expiry. Easy add, use, return and quick stock count.
4. **عملت إيه؟ — الإنتاج** Select item, enter number of trays/saj/batches, and actual quantities used. Show recipe quantities automatically if available; allow actual used quantities to be adjusted. Record good output, waste and reusable leftovers. One clear button: «تأكيد الإنتاج».
5. **بعت بكم؟ — البيع** Quick sale by piece, weight, box, plate or tray as appropriate. Enter quantity and selling price; reduce finished stock once.
6. **دفعت كام؟ — المصاريف** Short entry: what, amount, date and category. Optional note/photo.
7. **التكلفة والسعر — اختياري** Show actual/estimated cost and profit per item. Suggest a selling price only when the owner chooses to use it. Never force suggested prices or block a sale because price suggestion is missing.
8. **التقارير — يومي وشهري** Plain summaries and simple trends, not accounting reports full of jargon.

## Realistic stock and production rules
- Stock changes only from a recorded purchase receipt, production use/output, sale, return, waste, transfer or approved correction.
- Never silently overwrite a balance. Keep a simple movement history so the owner can understand why a number changed.
- A production record tracks item, batch/trays/saj, materials used, actual good output, waste and reusable leftovers.
- Avoid deducting ingredients twice or adding finished goods twice if the save button is tapped more than once.
- Keep units practical and configurable: kg, gram, litre, ml, piece, صاج، صينية، علبة، طبق. Do not assume every tray has a fixed number of pieces; let the shop define yield per item/recipe.
- Separate reusable leftovers from waste and damaged goods.
- Cost calculations must clearly say whether they are estimated or based on actual recorded consumption and purchase prices.
- Monthly expenses must be deducted once only. Do not count allocated overhead and then deduct the same expenses again.
- Do not invent opening balances, recipes, costs, sales or supplier prices. Clearly label any sample data as تجربة.

## The old calculator
- Keep root `index.html` exactly as it is. Do not merge, replace or redesign it.
- The new system lives in its own `management/` folder and its own branch until reviewed.
- Reuse the useful familiar calculations from the old calculator only after checking their formulas and making sure they do not mislead.

## Shared data and technology
- A central cloud database is still needed so owner and staff devices see the same records.
- Use Supabase only after the project is configured and tested. Do not claim cloud sync or backups are working before a real end-to-end test.
- Keep infrastructure invisible to staff. No staff member should need to understand databases, accounts, branches or technical settings.
- Protect owner reports and settings simply. Do not expose secret service keys in browser code.
- No paid plan, purchase, publication or spending without the owner's explicit approval.

## First working release
Build a small complete workflow before adding extras:
1. Add a raw material and record a purchase/receipt.
2. Verify the stock balance and low-stock amount.
3. Create a recipe (optional) and record a production batch.
4. Record actual materials used, good output, waste and leftovers.
5. Record a sale and verify finished stock decreases once.
6. Show today's and this month's purchases, usage, production, sales, expenses and estimated result.
7. Test on a phone with large touch targets and minimal typing.
8. Verify root `index.html` remains unchanged.

## Definition of success
A chef can record production without feeling lost. The owner can open the phone and immediately understand: what came in, what was used, what was made, what sold, what remains, what needs buying, and how the shop is doing today and this month.
