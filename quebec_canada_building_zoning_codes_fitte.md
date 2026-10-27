# Québec & Canada — Building Codes and Zoning Regulations

**Reference date:** October 27, 2026  
**Purpose:** Regulatory source library for **Fitte**, an architecture-software concept for small Québec residential design offices.  
**Scope:** Building code, municipal zoning, useful adjacent regulations, official documentation and implementation notes.

> **Important:** This is a source guide, not a legal opinion or a substitute for the actual regulation applicable to a specific building and parcel. Verify amendments, dates of applicability, local bylaws and administrative interpretations before using any rule in a compliance decision.

## 1. Quick comparison — latest building-code editions

| Jurisdiction | Relevant document | Latest published/adopted edition as of reference date | Status |
| --- | --- | --- | --- |
| Québec | **Code de construction du Québec, Chapitre I – Bâtiment, et Code national du bâtiment – Canada 2020 (modifié)** | **2020 (modified for Québec)** | Québec's current adopted building-code edition; effective April 17, 2025, subject to transition and amendments. |
| Canada | **Code national du bâtiment – Canada 2025 / National Building Code of Canada 2025** | **2025** | Most recent national **model** code, not automatically binding in Québec or other jurisdictions. |
| Canada | **Code national du bâtiment – Canada 2020** | **2020** | National model edition from which the Québec 2020 amended building code was developed. |

The year in a code's title is the **edition year**, not necessarily its legal effective date. Municipal bylaws must be evaluated separately.

## 2. Building codes — Québec

### 2.1 Québec Construction Code — Chapter I, Building (2020 amended)

**Full title:** *Code de construction du Québec, Chapitre I – Bâtiment, et Code national du bâtiment – Canada 2020 (modifié)*  
**Publisher:** National Research Council Canada (NRC/CNRC), for Québec's Régie du bâtiment du Québec (RBQ).  
**Edition:** 2020, with Québec-specific changes.  
**Effective date:** April 17, 2025.  
**Official publication:** https://nrc.canada.ca/fr/certifications-evaluations-normes/codes-canada/publications-codes-canada/code-construction-quebec-chapitre-i-batiment-code-national-batiment-canada-2020-modifie  
**Official regulation:** https://www.legisquebec.gouv.qc.ca/fr/document/rc/B-1.1,%20r.%202  
**RBQ explanation of changes (PDF):** https://www.rbq.gouv.qc.ca/fileadmin/medias/pdf/Publications/francais/cahier-explicatif-changements-cnb-2020.pdf

The NRC publication page provides access to **free electronic PDF copies** via the NRC Publications Archive; the full publication has two volumes (870 and 783 pages). This is the primary reference to use for Fitte's Québec building-related checks.

**Illustrative domains relevant to Fitte:**

- Building use/classification and applicable technical provisions.
- Fire separations, exposing building faces and unprotected openings (subject to the precise article and definitions).
- Means of egress, access and building safety requirements.
- Building structure, accessibility and other applicable design constraints.

**Transition warning:** The 2025 RBQ explanatory PDF describes a prior-code transition linked to work beginning before **October 17, 2026**. A previously discussed claim that the deadline was extended to **October 17, 2027** has **not been independently verified for this file**. Do **not** encode either date as a definitive current cutoff without consulting the latest Québec Gazette/RBQ notices and the legislation in force. For each project, capture construction start, permit details, code edition and legal basis for transitional applicability.

### 2.2 Other related Québec codes

Depending on product scope, consult the current amended Québec publications for:

- **Chapitre I.1 — Efficacité énergétique du bâtiment**, based on National Energy Code for Buildings 2020 (modified Québec).
- **Chapitre III — Plomberie**, based on National Plumbing Code 2020 (modified Québec).
- **Code de sécurité, Chapitre VIII — Bâtiment**, paired with National Fire Code 2020 (modified Québec).

**Official Québec codes index:** https://nrc.canada.ca/fr/certifications-evaluations-normes/codes-canada/publications-codes-canada  
**Energy-efficiency edition:** https://nrc.canada.ca/fr/certifications-evaluations-normes/codes-canada/publications-codes-canada/code-construction-quebec-chapitre-i1-efficacite-energetique-batiment-code-national-lenergie-2020-modifie

## 3. Building codes — Canada

### 3.1 National Building Code of Canada 2025

**French name:** *Code national du bâtiment – Canada 2025 (CNB)*  
**English name:** *National Building Code of Canada 2025 (NBC)*  
**Publisher:** National Research Council Canada (NRC/CNRC).  
**Edition:** 2025, latest national model edition listed by NRC as of October 27, 2026.  
**Official publication:** https://nrc.canada.ca/en/certifications-evaluations-standards/codes-canada/codes-canada-publications/national-building-code-canada-2025

The official NRC page links to **free PDFs** in the NRC Publications Archive (two volumes: 844 and 850 pages). The CNB/NBC is a **model code**: provincial and territorial governments decide which provisions, editions and amendments have legal effect in their respective jurisdictions.

**Fitte implication:** Keep Canada 2025 as a distinct document/version, not as a silent replacement for Québec 2020 amended.

### 3.2 National Building Code of Canada 2020

**Edition:** 2020.  
**Role:** Predecessor national model code and basis of Québec's 2020 amended building-code edition.  
**Official NRC code publications index:** https://nrc.canada.ca/en/certifications-evaluations-standards/codes-canada/codes-canada-publications

## 4. Zoning — Québec and Montréal

**There is no single universal Québec/Canada zoning code** analogous to the national model building code. Land-use and zoning controls are generally adopted locally and depend on the municipality, borough and property/zone.

### 4.1 Provincial enabling legislation

**Document:** *Loi sur l'aménagement et l'urbanisme* (**A-19.1**)  
**Official consolidated statute:** https://www.legisquebec.gouv.qc.ca/fr/document/lc/A-19.1

It establishes the legal framework for municipal land-use planning and regulatory powers, rather than providing the exact setbacks or permitted building height for every Québec lot.

### 4.2 Example: Le Plateau-Mont-Royal — Montréal

**Document:** *Règlement d'urbanisme de l'arrondissement du Plateau-Mont-Royal* (**01-277**).  
**Official Montréal page:** https://montreal.ca/articles/reglement-durbanisme-du-plateau-mont-royal-20131  
**Older illustrated/convenience PDF (not necessarily up to date):** https://portail-m4s.s3.montreal.ca/pdf/pmr_reglement_01-277_convivial_6_oct_2022_web.pdf

Topics include land uses, construction height and density, building placement/appearance, outdoor arrangements and parking. Verify updates and the **site-specific mapped zone** before extracting values.

### 4.3 Example: Rosemont–La Petite-Patrie — Montréal

**Document:** *Règlement d'urbanisme de l'arrondissement de Rosemont–La Petite-Patrie* (**01-279**).  
**Official Montréal page and attachments:** https://montreal.ca/articles/reglement-durbanisme-de-larrondissement-de-rosemont-la-petite-patrie-22090

The municipal page includes regulatory documents and annexes and cautions that posted documents may have been amended; the legally authoritative versions are those held by the borough.

### 4.4 Municipal zoning maps and regulations

- **Montréal interactive planning maps:** https://montreal.ca/services/cartes-interactives-amenagement-du-territoire
- **Montréal zoning introduction:** https://montreal.ca/sujets/zonage
- **Municipal/borough regulation lookup:** start from the relevant municipality or Montréal borough's official regulations page.

For a particular parcel, obtain **all** of the following where applicable:

1. Zoning bylaw and all applicable amendments.
2. Official zoning map identifying the parcel's zone.
3. **Grille de spécifications** or equivalent site-specific table, where the municipality uses one.
4. Relevant supplementary bylaws: subdivision, construction, **PIIA**, minor variances, PPCMOI or other discretionary review.
5. Current municipal confirmation for ambiguous clauses or changed property conditions.

**Common zoning checks:** authorized uses; maximum/minimum height; setback requirements; lot coverage/implantation; density; parking; landscaping and greening. Exact calculations, exceptions and definitions vary by municipality.

## 5. Recommended Fitte source hierarchy

| Priority | Source | What it can support |
| --- | --- | --- |
| P0 | Québec **2020 amended Chapter I — Building**, plus current regulation and amendments | Building/fire-code hypotheses, including exposing building faces and openings. |
| P0 | Project municipality's current zoning bylaw, zoning map and specification grid | Parcel-specific zoning and dimensional checks. |
| P1 | Municipal PIIA/CCU/PPCMOI requirements where triggered | Design review workflow, human approval and evidence tracking. |
| P1 | Québec other code chapters as needed | Energy, plumbing and broader safety scope. |
| P2 | Canada NBC 2025 | Cross-jurisdiction reference and future adaptation; **not** Québec's current governing edition by default. |

### Suggested data fields per regulatory provision

```yaml
jurisdiction: Quebec / municipal borough
source_document: Code de construction du Québec, Chapitre I
edition: '2020 (modifié Québec)'
article: '<exact article identifier>'
source_url: '<official URL>'
effective_date: '<verified date>'
applicability_basis: '<legal / transitional / project-specific basis>'
parcel_zone: '<official zoning map reference, if applicable>'
rule_text: '<verbatim short excerpt or structured paraphrase>'
measured_value: '<value read from drawing>'
required_value: '<value derived from applicable provision>'
assumptions: []
missing_information: []
review_status: 'provisional — professional verification required'
source_checked_at: '2026-10-27'
```

### UI terminology for Fitte

- **Zonage et code** — combined compliance section.
- **Articles non résolus** — provisions needing professional verification, more data or resolution.
- **Mesuré dans les dessins** / **Exigé par l'article** — distinguish design data from legal requirements.
- Avoid declaring **non-conformité** solely from an automated geometric comparison where there may be exceptions, definitions, transitional provisions or unknown evidence.

## 6. Official reference links — compact list

1. Québec Chapter I Building (2020 amended): https://nrc.canada.ca/fr/certifications-evaluations-normes/codes-canada/publications-codes-canada/code-construction-quebec-chapitre-i-batiment-code-national-batiment-canada-2020-modifie
2. Québec Construction Code regulation: https://www.legisquebec.gouv.qc.ca/fr/document/rc/B-1.1,%20r.%202
3. RBQ explanatory changes PDF: https://www.rbq.gouv.qc.ca/fileadmin/medias/pdf/Publications/francais/cahier-explicatif-changements-cnb-2020.pdf
4. Canada NBC 2025: https://nrc.canada.ca/en/certifications-evaluations-standards/codes-canada/codes-canada-publications/national-building-code-canada-2025
5. NRC national and provincial code catalogue: https://nrc.canada.ca/en/certifications-evaluations-standards/codes-canada/codes-canada-publications
6. Québec Act Respecting Land Use Planning and Development: https://www.legisquebec.gouv.qc.ca/fr/document/lc/A-19.1
7. Plateau-Mont-Royal 01-277: https://montreal.ca/articles/reglement-durbanisme-du-plateau-mont-royal-20131
8. Rosemont–La Petite-Patrie 01-279: https://montreal.ca/articles/reglement-durbanisme-de-larrondissement-de-rosemont-la-petite-patrie-22090
9. Montréal interactive maps: https://montreal.ca/services/cartes-interactives-amenagement-du-territoire
10. Montréal zoning hub: https://montreal.ca/sujets/zonage

---

**Last reviewed:** October 27, 2026. Edition status and source landing pages checked against official NRC and Montréal sources; individual rule texts, amendments, and project-specific zoning conditions **have not** been exhaustively verified.
