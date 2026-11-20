# lidl-layout-fixture

Lidl receipt layout as a text fixture

**Complexity:** low. One checkpoint, one milestone, one squash-merged pull request, releasable alone.

## What is wrong

Two receipt-reading fixes (v0.7.3 and v0.7.4) came from one Lidl receipt, and they are covered only by short unit tests of three to seven lines each. Nothing keeps the whole layout from regressing. The real receipt must never be committed (R17: no real receipt in any commit), so the fixture has to be invented.

## What to do

Add one text fixture under `app/src/features/receipt/fixtures/text/`, `26-pt-lidl-desconto-sublinhado.txt` with its `.expected.json`, modelled on that layout with **invented** names, amounts and store details (no real address, tax number, card digits or product list):

- a header, a `Fatura Simplificada` block and a column header (`EUR`);
- items whose amounts end in a tax-code letter (`A`, `B`, `C`, `F`);
- a loyalty discount line (`Promoção Lidl Plus -0,80`) followed by a short `------------` underline and **more items below it**;
- a second discount line with no underline;
- a deposit line with a quantity (`Deposito 0.10 0,10 x 2 0,20 F`);
- a weighed item followed by a `0,390 kg x 7,99 EUR/kg` detail line with no amount of its own;
- an item with a quantity where the unit price and total are both present (`... 11,69 x 2 23,38 B`);
- the closing underline, `Total`, a `MULTIBANCO` payment line, a tax table (`Taxa Base Imp. Val.Total Val.IVA`) and a `Total Poupança` footer.

The expected file is the whole parsed receipt in the existing format. Its items must add up to its total.

## Rules

- This item adds a test fixture only. If the fixture exposes a parser bug, stop, record it as a follow-up under `docs/items/` and do not fix it here.
- Keep it to the fixture and its expected file. No app code, no other fixtures.
- The existing fixture test (`parseReceiptText.fixtures.test.ts`) runs every fixture automatically; no test code is needed.
- Run `npm run typecheck`, `npm run lint`, `npm run format:check` and `npm test` in `app/` before each push.

The plan's header must carry exactly one line of this form, with nothing after the closing backtick: ``Pull request title: `test: add a Lidl-style receipt layout fixture` ``.
