/* The façade material legend of the elevation sheets, numbered as the
   architect numbers it, and how each material of the exported SketchUp
   model maps onto it. Read by the page (the façade tables) and by the 3D
   viewer (areas and the elevation colours), so the swatch in the table and
   the colour on the model are the same value.

   The mapping was read off orthographic renders of the export, one colour
   per export material:
   - _9   dark brick texture            → 1 brique Melville Slik, noir
   - _56, _55, _50  large chamois block → 2 bloc architectural Tapestry
   - _54  small chamois brick           → 3 brique Strata, smooth chamois
   - _Color_M04_1  grey metal: the narrow full-height strips are panels (4);
     the bands at the canopy and at the parapets are flashing (6)
   - _1   thin bands under each window  → 7 allège (its slab faces are
     horizontal and never counted)
   - _    frames around every pane      → 8 fenêtre et porte-patio
   - Translucent_Glass_Gray, _1 (penthouse) → 9 vitrage
   - _Translucent_Glass_Gray_3 balcony glass → 10 garde-corps
   Nothing in the export carries 5 (panneau d'aluminium chamois): the table
   says so instead of inventing an area.

   Colours are highlight colours, chosen to tell the materials apart on the
   model, not to imitate them.

   Each item carries what the specification says of it: the product, who
   makes it, the colour, the size where it is given, and the maker's page.
   Thumbnails are the swatches of the legend itself (assets/materials).
   Where the legend names no maker (8, 9, 10) there is no link: one would
   be a guess. Checked 2026-10-29: Shouldice's current Strata Smooth range
   has no chamois; the link goes to the range, and the sheet says so. */
(function () {
  /* Each link opens the maker's page for that exact product; `page` is that
     page's own title, shown on the button. Where a maker has one page per
     colour, the link is the colour's page. Vicwest has no public page per
     colour: the link opens its colour guide at the page carrying the swatch.
     The guide now gives Carbon as 9789 in the metallic PVDF trio (Carbon,
     Light Pewter, Bright Silver) that the plans' 9740 belonged to. */
  const VICWEST_CARBON = "https://www.vicwest.com/wp-content/uploads/2026/08/vicwest-colour-guide-en-ca_v18.pdf#page=5";
  const ALUTECH_300 = "https://alutech.ca/portfolio_page/alutech-300/";
  const CATEGORIES = [
    { n: 1, name: "Brique Melville Slik", note: "parement de maçonnerie · noir Rockland", color: "#c8372d",
      thumb: "m1", maker: "Permacon", colour: "Noir Rockland", size: "90 × 79 × 257 mm",
      url: "https://permacon.ca/fr/produits/brique-melville-slik/", page: "Brique Melville Slik" },
    { n: 2, name: "Bloc architectural Tapestry", note: "maçonnerie · chamois 90 × 290 × 590", color: "#e9a51c",
      thumb: "m2", maker: "Shouldice", colour: "Chamois", size: "90 × 290 × 590 mm",
      url: "https://shouldice.ca/ecommerce/90x290x590-tap", page: "90x290x590 Tap" },
    { n: 3, name: "Brique Strata", note: "parement de maçonnerie · smooth chamois", color: "#2f7fd6",
      thumb: "m3", maker: "Shouldice", colour: "Smooth chamois", size: "90 × 79 × 257 mm",
      check: "chamois absent de la gamme Strata Smooth actuelle",
      url: "https://shouldice.ca/ecommerce/brick/strata-brick-smooth/", page: "Strata Brick Smooth" },
    { n: 4, name: "Panneau d'aluminium série 300", note: "prépeint · carbone #9740", color: "#8a4bc4",
      thumb: "m4", maker: "Alutech", colour: "Carbone #9740 (Vicwest)", size: "plaque 3,2 mm",
      url: ALUTECH_300, page: "Alutech 300", colourUrl: VICWEST_CARBON, colourPage: "Carbon, nuancier p. 5" },
    { n: 5, name: "Panneau d'aluminium série 300", note: "prépeint · chamois", color: "#c77a9b",
      thumb: "m5", maker: "Alutech", colour: "Chamois", size: "plaque 3,2 mm",
      url: ALUTECH_300, page: "Alutech 300" },
    { n: 6, name: "Solin, marquise et parapet", note: "aluminium prépeint · carbone 19740", color: "#11a38a",
      thumb: "m6", maker: "Vicwest", colour: "Carbone 19740", url: VICWEST_CARBON, page: "Carbon, nuancier p. 5" },
    { n: 7, name: "Allège fenêtre et porte-patio", note: "aluminium prépeint · chamois", color: "#f07b1f",
      thumb: "m7", maker: "non nommé", colour: "Chamois de Shouldice" },
    { n: 8, name: "Fenêtre et porte-patio", note: "aluminium prépeint · noir", color: "#273746",
      tile: "#1d1d1f", maker: "non nommé", colour: "Noir, finition extérieure" },
    { n: 9, name: "Vitrage", note: "thermos double · clair", color: "#62c6ee",
      tile: "#dfe9ee", maker: "non nommé", colour: "Thermos double, clair" },
    { n: 10, name: "Garde-corps", note: "verre trempé charcoal · poteaux alu noir", color: "#58b335",
      tile: "#4a4d50", maker: "non nommé", colour: "Verre trempé charcoal, poteaux noirs" },
  ];
  const BY_MATERIAL = {
    _9: 1, _56: 2, _55: 2, _50: 2, _54: 3, _1: 7, _: 8,
    Translucent_Glass_Gray: 9, _Translucent_Glass_Gray_1: 9, _Translucent_Glass_Gray_3: 10,
  };
  /* The grey metal is one export material for two items of the legend.
     Canopy (1.30–1.75) and parapets (from 9.90 up) are flashing; the rest
     is panel. Heights are the export's, in model units. */
  const METAL = "_Color_M04_1";
  const metalAt = (y) => (y >= 9.9 || (y >= 1.3 && y <= 1.75) ? 6 : 4);
  /* The export is drawn in units of 100 inches: a 10'-0" storey is 1.2. */
  const FT2_PER_UNIT2 = (100 / 12) ** 2;
  /* What stands in front of a façade without being part of it: trees,
     planting, water, cars, people, terrace furniture. Left out of the
     elevation so it neither hides a wall nor gets counted as one. */
  const PROPS = /Tree|Groundcover|Vegetation|Water|ZZXRAY|BMWX|^_auto_|Metal_Rough|M_0135_DarkGray|Color_E01|_0131_Silver|_0137_Black|_0136_Charcoal|^_88$|^_58$|^M_14350/;

  window.fitteMaterials = {
    CATEGORIES,
    METAL,
    METAL_SPLIT: { low: 1.3, high: 1.75, roof: 9.9 },
    FT2_PER_UNIT2,
    isProp: (materialName) => PROPS.test(materialName || ""),
    categoryOf(materialName, y) {
      if (materialName === METAL) return metalAt(y);
      return BY_MATERIAL[materialName] || 0;
    },
    category(n) { return CATEGORIES[n - 1]; },
  };
})();
