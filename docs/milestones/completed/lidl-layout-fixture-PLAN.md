# Lidl receipt layout as a text fixture: execution plan (Revision 1)

Pull request title: `test: add a Lidl-style receipt layout fixture`

- **Work item:** `lidl-layout-fixture` (product, one checkpoint).
- **Plan revision:** 1.
- **Base commit:** `2f87c4f71cb214a17023d5002415935c543aab8a` (`main`).
- **Backlog page:** `docs/items/lidl-layout-fixture.md`.
- **Registry:** `docs/ai-workflow/registry/lidl-layout-fixture-registry.json`
- **Requirement mapping:** `docs/ai-workflow/requirements/lidl-layout-fixture-mapping.json`
- **Artifact declarations:** `docs/ai-workflow/registry/lidl-layout-fixture-artifacts.json`

## Checkpoints

| id | name | depends_on | complexity | session_target |
| --- | --- | --- | --- | --- |
| CP1 | The Lidl layout fixture: one invented text fixture and its expected file | - | 1 | 1 |

## Goal

Two receipt-reading fixes (v0.7.3 and v0.7.4) came from one Lidl receipt and
are covered only by short unit tests. Nothing keeps the whole layout from
regressing. Add one whole-receipt text fixture of that layout, invented, so
the existing fixture test guards it.

**What the user sees:** nothing changes in the app. The test suite gains one
fixture case that fails if the Lidl layout stops parsing as it does today.

**What does not change:** all application code, every other fixture, the
fixture test itself. If the fixture exposes a parser bug, the work stops: the
bug is recorded as a follow-up page under `docs/items/` and is not fixed here.

## Decisions

- **One fixture, invented.** No real receipt enters Git (R17). The merchant
  (`Mercado Exemplo Lda`), address, tax number (a check-digit-valid invented
  NIF, so the parser reads it as a tax id), products, amounts and card
  line are made up. The real receipt stays in the git-ignored
  `app/src/features/receipt/fixtures/local/`.
- **The expected file is the parser's output, checked by hand.** The
  implementer writes the `.txt`, runs the parser on it, then verifies each
  expected value against the receipt text before saving it as
  `.expected.json`. A parser output that disagrees with the receipt is a
  bug: stop and record a follow-up (see Goal), never edit the fixture to hide
  it.
- **Items add up to the total.** Discounts net onto the item above them in
  the parser's output, so the expected items sum to the printed total.
- **No test code.** `parseReceiptText.fixtures.test.ts` runs every fixture
  through `loadTextFixtures()` automatically.

<!-- CP1 -->
## CP1: the Lidl layout fixture

**Files:**
`app/src/features/receipt/fixtures/text/26-pt-lidl-desconto-sublinhado.txt`,
`app/src/features/receipt/fixtures/text/26-pt-lidl-desconto-sublinhado.expected.json`

The `.txt` has one receipt line per line, and carries every element the
backlog page lists:

- a header, a `Fatura Simplificada` block and a column header ending in `EUR`;
- items whose amounts end in a tax-code letter (`A`, `B`, `C`, `F`);
- a loyalty discount (`Promoção Lidl Plus -0,80`), then a short
  `------------` underline, then more items;
- a second discount line with no underline;
- a deposit line with a quantity (`Deposito 0.10 0,10 x 2 0,20 F`);
- a weighed item whose next line is `0,390 kg x 7,99 EUR/kg`, with no amount
  of its own;
- an item with quantity, unit price and total (`... 11,69 x 2 23,38 B`);
- the closing underline, `Total`, a `MULTIBANCO` payment line, a tax table
  (`Taxa Base Imp. Val.Total Val.IVA`) and a `Total Poupança` footer.

A draft that was parsed on 2026-11-20 with the current parser (items read
correctly, no warnings, items summing to the total 34,66):

```
Mercado Exemplo Lda
Rua das Amostras 12
1000-001 Lisboa
NIF 500123454
Fatura Simplificada FS 2026/12345
2026-10-14 18:42
Descrição EUR
Leite Meio Gordo 1L 0,89 A
Iogurte Natural 1,29 A
Promoção Lidl Plus -0,80
------------
Pão de Forma 1,59 B
Azeite Virgem Extra 5,49 C
Desconto Cartão -0,50
Deposito 0.10 0,10 x 2 0,20 F
Bananas 3,12 A
0,390 kg x 7,99 EUR/kg
Detergente Roupa 11,69 x 2 23,38 B
------------
Total 34,66
MULTIBANCO 34,66
Taxa Base Imp. Val.Total Val.IVA
A 6% 2,06 0,12 2,18
Total Poupança 1,30
```

The draft is a starting point: the implementer may adjust invented values
(keeping every listed element) but must keep the items summing to the total.
Expected items for it: Leite Meio Gordo 1L 0.89; Iogurte Natural 0.49 (1.29
less the 0.80 discount); Pão de Forma 1.59; Azeite Virgem Extra 4.99 (5.49
less 0.50); Deposito 2 x 0.10 = 0.20; Bananas 0.39 x 7.99 = 3.12; Detergente
Roupa 2 x 11.69 = 23.38; merchant, date `2026-10-14` and total `34.66`.

**Tests:** the existing `parseReceiptText on the text fixtures` case for the
new fixture, plus the app's four checks in `app/` (`npm run typecheck`,
`lint`, `format:check`, `npm test`) before each push. The fixture-count
assertion (`>= 25`) still holds.

**Migration:** none. No stored data changes.
<!-- /CP1 -->

## Out of scope

Parser changes, other fixtures, test code, docs beyond this plan, and any
real receipt content.
