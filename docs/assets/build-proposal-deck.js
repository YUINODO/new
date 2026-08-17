const pptxgen = require("pptxgenjs");

/* ---------- palette: 高齢者ケア(深緑) × 原価判断(琥珀) ---------- */
const INK      = "12211C";
const PINE     = "1F3D34";
const PINE_2   = "2E5A4C";
const SAGE     = "6E9A85";
const SAGE_LT  = "E4EDE8";
const SAGE_XLT = "F2F7F4";
const AMBER    = "C4682A";
const AMBER_LT = "FAEDE1";
const RISK     = "9E3B2D";
const WHITE    = "FFFFFF";
const MUTED    = "6C7C75";
const MUTED_D  = "9DB2A8";
const LINE     = "D6E0DA";

const FH = "Yu Gothic";
const FB = "Yu Gothic";
const FN = "Arial";

const W = 13.333, H = 7.5;
const M = 0.62;
const CW = W - M * 2;

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.author = "開発チーム";
pres.title = "高齢者向け音声会話AIアプリ 開発投資検討資料";

/* ---------- helpers ---------- */
function shadow() {
  return { type: "outer", color: "1F3D34", blur: 10, offset: 2, angle: 90, opacity: 0.1 };
}

function slideBase(dark) {
  const s = pres.addSlide();
  s.background = { color: dark ? PINE : WHITE };
  return s;
}

// repeating motif: filled circle token
function token(s, x, y, label, opts = {}) {
  const d = opts.d || 0.44;
  s.addShape(pres.ShapeType.ellipse, {
    x, y, w: d, h: d,
    fill: { color: opts.bg || SAGE },
  });
  s.addText(label, {
    x, y, w: d, h: d, margin: 0,
    align: "center", valign: "middle",
    fontFace: opts.face || FN, fontSize: opts.size || 13, bold: true,
    color: opts.fg || WHITE,
  });
}

function header(s, num, title, sub, dark) {
  token(s, M, 0.5, num, { bg: dark ? SAGE : PINE, d: 0.4, size: 12 });
  s.addText(title, {
    x: M + 0.62, y: 0.42, w: CW - 0.62, h: 0.58, margin: 0,
    fontFace: FH, fontSize: 27, bold: true,
    color: dark ? WHITE : INK, valign: "middle",
  });
  if (sub) {
    s.addText(sub, {
      x: M, y: 1.06, w: CW, h: 0.36, margin: 0,
      fontFace: FB, fontSize: 13.5,
      color: dark ? MUTED_D : MUTED, valign: "top",
    });
  }
}

function card(s, x, y, w, h, opts = {}) {
  s.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.06,
    fill: { color: opts.fill || SAGE_XLT },
    line: opts.line === false ? { type: "none" } : { color: opts.lineColor || LINE, width: 1 },
    shadow: opts.shadow ? shadow() : undefined,
  });
}

function footNote(s, text, dark) {
  s.addText(text, {
    x: M, y: H - 0.68, w: CW, h: 0.34, margin: 0,
    fontFace: FB, fontSize: 10.5, italic: true,
    color: dark ? MUTED_D : MUTED, valign: "middle",
  });
}

const tblBase = {
  fontFace: FB, fontSize: 12, color: INK,
  border: { type: "solid", color: LINE, pt: 1 },
  autoPage: false, valign: "middle",
};
function th(t, o = {}) {
  return { text: t, options: Object.assign({ bold: true, fontSize: 11.5, color: WHITE, fill: { color: PINE_2 }, align: "left" }, o) };
}

/* ============================================================
   S1  表紙
   ============================================================ */
{
  const s = slideBase(true);
  // motif: oversized token as quiet decoration
  s.addShape(pres.ShapeType.ellipse, { x: 10.4, y: 1.1, w: 4.4, h: 4.4, fill: { color: PINE_2 } });
  s.addShape(pres.ShapeType.ellipse, { x: 11.6, y: 4.0, w: 1.5, h: 1.5, fill: { color: SAGE } });

  s.addText("社内検討資料 ｜ 2026年8月17日", {
    x: M, y: 1.5, w: 9, h: 0.34, margin: 0,
    fontFace: FB, fontSize: 12, bold: true, charSpacing: 2, color: SAGE,
  });
  s.addText("高齢者向け\n音声会話AIアプリ", {
    x: M, y: 2.0, w: 9.4, h: 2.0, margin: 0,
    fontFace: FH, fontSize: 42, bold: true, color: WHITE, lineSpacing: 52,
  });
  s.addText("開発投資の検討資料", {
    x: M, y: 4.15, w: 9, h: 0.44, margin: 0,
    fontFace: FB, fontSize: 19, color: SAGE_LT,
  });
  s.addShape(pres.ShapeType.rect, { x: M, y: 4.86, w: 3.2, h: 0.02, fill: { color: SAGE } });
  s.addText("「開くと話しかけてくれて、昨日の話を覚えている」音声AIを\n自社プロダクトとして開発する場合の、費用・原価・リスクの整理", {
    x: M, y: 5.08, w: 8.6, h: 0.9, margin: 0,
    fontFace: FB, fontSize: 13.5, color: MUTED_D, lineSpacing: 24,
  });
  s.addNotes("要件メモをもとにした概算です。金額は税別、単価前提は7万円／人日。確定していない前提は最終ページに10点まとめています。");
}

/* ============================================================
   S2  エグゼクティブサマリー
   ============================================================ */
{
  const s = slideBase(false);
  header(s, "1", "結論", "技術的な実現性ではなく、1人あたり月3,000円の原価をどう回収するかが判断の中心です。", false);

  const stats = [
    { n: "658", u: "万円", l: "開発費（推奨案：MVP）", d: "94人日・約4ヶ月・3名体制", c: PINE },
    { n: "3,000", u: "円", l: "1人あたりの月額原価", d: "音声API＋インフラ（月300分利用）", c: AMBER },
    { n: "10", u: "点", l: "未確定の前提条件", d: "うち3点は金額に直結（最終ページ）", c: PINE },
  ];
  const cw = 3.86, gap = 0.475;
  stats.forEach((st, i) => {
    const x = M + i * (cw + gap);
    card(s, x, 1.72, cw, 2.06, { fill: i === 1 ? AMBER_LT : SAGE_XLT, lineColor: i === 1 ? "EDD3BC" : LINE });
    s.addText(
      [
        { text: st.n, options: { fontFace: FN, fontSize: 46, bold: true, color: st.c } },
        { text: " " + st.u, options: { fontFace: FB, fontSize: 17, bold: true, color: st.c } },
      ],
      { x: x + 0.32, y: 1.94, w: cw - 0.64, h: 0.82, margin: 0, valign: "middle" }
    );
    s.addText(st.l, {
      x: x + 0.32, y: 2.8, w: cw - 0.64, h: 0.34, margin: 0,
      fontFace: FH, fontSize: 14, bold: true, color: INK,
    });
    s.addText(st.d, {
      x: x + 0.32, y: 3.14, w: cw - 0.64, h: 0.5, margin: 0,
      fontFace: FB, fontSize: 11.5, color: MUTED, lineSpacing: 17,
    });
  });

  card(s, M, 4.06, CW, 2.6, { fill: WHITE, lineColor: LINE, shadow: true });
  s.addText("意思決定の要点", {
    x: M + 0.42, y: 4.28, w: 4, h: 0.34, margin: 0,
    fontFace: FH, fontSize: 13, bold: true, charSpacing: 1.5, color: SAGE,
  });
  const pts = [
    ["作れるかどうかは論点ではない", "音声も記憶も既存技術の組み合わせで実現できる。難所は品質ではなく単価。"],
    ["リアルタイム音声を無制限に使わせると赤字になる", "1人月6,000〜10,500円。会話時間の上限設計が事実上の原価管理になる。"],
    ["回収モデルが決まらないと仕様が決まらない", "個人課金か施設契約かで、音声方式・機能範囲・開発費が連動して変わる。"],
  ];
  pts.forEach((p, i) => {
    const y = 4.74 + i * 0.63;
    token(s, M + 0.42, y - 0.02, String(i + 1), { d: 0.34, size: 11, bg: i === 1 ? AMBER : PINE });
    s.addText(p[0], {
      x: M + 0.95, y: y - 0.06, w: 5.0, h: 0.3, margin: 0,
      fontFace: FH, fontSize: 13, bold: true, color: i === 1 ? AMBER : INK,
    });
    s.addText(p[1], {
      x: M + 6.05, y: y - 0.08, w: CW - 6.5, h: 0.42, margin: 0,
      fontFace: FB, fontSize: 11.5, color: MUTED, lineSpacing: 16,
    });
  });
}

/* ============================================================
   S3  何を作るのか
   ============================================================ */
{
  const s = slideBase(false);
  header(s, "2", "何を作るのか", "既存の高齢者向けサービスとの違いは、機能の多さではなく「覚えていること」です。", false);

  const items = [
    { k: "起動", t: "開いたら、AIから話しかける", d: "ボタンを押させない。高齢者向けUIの本体は文字の大きさではなく、操作を発生させないこと。" },
    { k: "会話", t: "声で自然に話す", d: "ChatGPTの音声モードと同等の体験。途中で割り込め、間が不自然でない。" },
    { k: "記憶", t: "昨日の話を覚えている", d: "会話は全件永久保存。4層の記憶設計で、必要なときに正確に思い出す（第7項）。" },
    { k: "復帰", t: "通知で会話に呼び戻す", d: "「今日はまだお話ししていませんよ」。継続率を左右する最重要機能。" },
  ];
  const cw = (CW - 0.42) / 2, ch = 2.16;
  items.forEach((it, i) => {
    const x = M + (i % 2) * (cw + 0.42);
    const y = 1.76 + Math.floor(i / 2) * (ch + 0.36);
    card(s, x, y, cw, ch, { fill: WHITE, shadow: true });
    token(s, x + 0.38, y + 0.36, it.k, { d: 0.62, size: 12, face: FB, bg: i === 2 ? AMBER : SAGE });
    s.addText(it.t, {
      x: x + 1.16, y: y + 0.34, w: cw - 1.54, h: 0.44, margin: 0,
      fontFace: FH, fontSize: 16.5, bold: true, color: INK, valign: "middle",
    });
    s.addText(it.d, {
      x: x + 1.16, y: y + 0.92, w: cw - 1.54, h: 1.0, margin: 0,
      fontFace: FB, fontSize: 12.5, color: MUTED, lineSpacing: 20,
    });
  });
  footNote(s, "対応言語は日本語のみ。医療助言・診断・緊急通報は対象外とし、規約と画面表示の両方で責任範囲を明示する。", false);
}

/* ============================================================
   S4  3プラン比較
   ============================================================ */
{
  const s = slideBase(false);
  header(s, "3", "3つの進め方", "音声AIは単価で事業性が決まるため、いきなり本番版を作らずA案で実測することを推奨します。", false);

  const plans = [
    { tag: "PLAN A", name: "検証版（PoC）", price: "203", range: "180〜240万円", md: "29人日", term: "約1.5ヶ月", team: "2名",
      scope: ["音声会話と記憶の中核のみ", "Web・招待した数名で試用", "API単価と体験を実測する"], pick: false },
    { tag: "PLAN B", name: "MVP（Web＋LINE通知）", price: "658", range: "560〜760万円", md: "94人日", term: "約4ヶ月", team: "3名",
      scope: ["ログイン・記憶基盤・通知", "管理画面と個人情報対応", "実利用者に配り継続率を見る"], pick: true },
    { tag: "PLAN C", name: "本番版（アプリ）", price: "1,190", range: "1,000〜1,400万円", md: "170人日", term: "約7ヶ月", team: "3〜4名",
      scope: ["iOS / Android ネイティブ", "家族向け見守り画面", "一般提供・見守り事業化"], pick: false },
  ];
  const cw = 3.86, gap = 0.475;
  plans.forEach((p, i) => {
    const x = M + i * (cw + gap);
    card(s, x, 1.72, cw, 4.48, { fill: p.pick ? PINE : WHITE, lineColor: p.pick ? PINE : LINE, shadow: true });
    if (p.pick) {
      s.addShape(pres.ShapeType.roundRect, { x: x + cw - 1.28, y: 1.58, w: 1.0, h: 0.34, rectRadius: 0.05, fill: { color: AMBER } });
      s.addText("推 奨", { x: x + cw - 1.28, y: 1.58, w: 1.0, h: 0.34, margin: 0, align: "center", valign: "middle", fontFace: FH, fontSize: 10.5, bold: true, color: WHITE });
    }
    const fg = p.pick ? WHITE : INK;
    const sub = p.pick ? MUTED_D : MUTED;
    s.addText(p.tag, { x: x + 0.34, y: 2.0, w: cw - 0.68, h: 0.26, margin: 0, fontFace: FN, fontSize: 11, bold: true, charSpacing: 2, color: p.pick ? SAGE : SAGE });
    s.addText(p.name, { x: x + 0.34, y: 2.28, w: cw - 0.68, h: 0.38, margin: 0, fontFace: FH, fontSize: 16, bold: true, color: fg });
    s.addText(
      [
        { text: p.price, options: { fontFace: FN, fontSize: 38, bold: true, color: p.pick ? WHITE : PINE } },
        { text: " 万円", options: { fontFace: FB, fontSize: 14, bold: true, color: p.pick ? WHITE : PINE } },
      ],
      { x: x + 0.34, y: 2.74, w: cw - 0.68, h: 0.66, margin: 0, valign: "middle" }
    );
    s.addText("幅 " + p.range, { x: x + 0.34, y: 3.42, w: cw - 0.68, h: 0.26, margin: 0, fontFace: FN, fontSize: 11, color: sub });
    s.addShape(pres.ShapeType.rect, { x: x + 0.34, y: 3.82, w: cw - 0.68, h: 0.01, fill: { color: p.pick ? PINE_2 : LINE } });
    s.addText(
      [
        { text: p.md + "　", options: { fontFace: FB, fontSize: 12, bold: true, color: fg } },
        { text: p.term + "　", options: { fontFace: FB, fontSize: 12, bold: true, color: fg } },
        { text: p.team, options: { fontFace: FB, fontSize: 12, bold: true, color: fg } },
      ],
      { x: x + 0.34, y: 3.92, w: cw - 0.68, h: 0.3, margin: 0 }
    );
    s.addText(p.scope.map((t, j) => ({ text: t, options: { bullet: true, breakLine: j !== p.scope.length - 1 } })), {
      x: x + 0.34, y: 4.34, w: cw - 0.6, h: 1.7, margin: 0,
      fontFace: FB, fontSize: 12, color: p.pick ? SAGE_LT : MUTED,
      lineSpacing: 19, paraSpaceAfter: 6,
    });
  });
  footNote(s, "税別・単価7万円／人日。C案はB案を包含した単独総額。A→B→Cと段階実施する場合は手戻り分として合計に10〜15%を見込む。", false);
}

/* ============================================================
   S5  開発費の内訳
   ============================================================ */
{
  const s = slideBase(false);
  header(s, "4", "開発費はどこに集中するか", "推奨案（658万円・94人日）の内訳。削るなら機能ではなく、初期の対象人数です。", false);

  s.addChart(
    pres.ChartType.bar,
    [{
      name: "金額（万円）",
      labels: ["音声・記憶のコア機能", "UI設計・実装", "要件定義・PM", "基盤・セキュリティ・管理", "ログイン・通知", "テスト"],
      values: [196, 126, 112, 91, 77, 56],
    }],
    {
      x: M, y: 1.74, w: 7.7, h: 4.5,
      barDir: "bar", barGapWidthPct: 45,
      chartColors: [PINE, SAGE, SAGE, SAGE, SAGE, SAGE],
      showValue: true, dataLabelPosition: "outEnd",
      dataLabelFontFace: FN, dataLabelFontSize: 11, dataLabelColor: INK,
      dataLabelFormatCode: '#,##0"万円"',
      showLegend: false,
      showTitle: true, title: "領域別の開発費（推奨案・合計658万円）",
      titleFontFace: FH, titleFontSize: 13, titleColor: MUTED,
      catAxisLabelFontFace: FB, catAxisLabelFontSize: 11.5, catAxisLabelColor: INK,
      valAxisLabelFontFace: FN, valAxisLabelFontSize: 10, valAxisLabelColor: MUTED,
      valAxisMaxVal: 240, valAxisMinVal: 0,
      valGridLine: { color: "EAF0EC", size: 1 },
      catGridLine: { style: "none" },
      catAxisLineShow: false, valAxisLineShow: false,
    }
  );

  card(s, 8.62, 1.74, CW - 8.0, 4.5, { fill: SAGE_XLT });
  s.addText("読みどころ", {
    x: 8.98, y: 2.02, w: 3.6, h: 0.3, margin: 0,
    fontFace: FH, fontSize: 13, bold: true, charSpacing: 1.5, color: SAGE,
  });
  const reads = [
    ["30%", "音声会話コアと記憶基盤の2項目だけで28人日。ここがプロダクトの中身そのもので、削れない。"],
    ["17%", "要件定義とPM。前提が10点未確定のまま着手すると、ここが最初に膨らむ。"],
    ["8.5%", "テスト。高齢者ユーザーテストを含む。ここを削ると使われないものが出来上がる。"],
  ];
  reads.forEach((r, i) => {
    const y = 2.5 + i * 1.24;
    s.addText(r[0], {
      x: 8.98, y: y, w: 1.1, h: 0.42, margin: 0,
      fontFace: FN, fontSize: 24, bold: true, color: i === 0 ? AMBER : PINE, valign: "middle",
    });
    s.addText(r[1], {
      x: 8.98, y: y + 0.44, w: CW - 8.72, h: 0.78, margin: 0,
      fontFace: FB, fontSize: 11.5, color: MUTED, lineSpacing: 17,
    });
  });
}

/* ============================================================
   S6  運用コスト（DARK・最重要）
   ============================================================ */
{
  const s = slideBase(true);
  header(s, "5", "事業性を決めるのは開発費ではなく原価", "1人が1日15分・月20日会話する前提（＝月300分）での試算です。", true);

  card(s, M, 1.78, 7.0, 4.42, { fill: WHITE, line: false, shadow: true });
  s.addChart(
    pres.ChartType.bar,
    [{
      name: "1人あたり月額原価（円）",
      labels: ["リアルタイム音声", "ハイブリッド", "分割パイプライン"],
      values: [8250, 3250, 1500],
    }],
    {
      x: M + 0.16, y: 1.94, w: 6.68, h: 4.1,
      barDir: "col", barGapWidthPct: 60,
      chartColors: [RISK, AMBER, SAGE],
      varyColors: true,
      showValue: true, dataLabelPosition: "outEnd",
      dataLabelFontFace: FN, dataLabelFontSize: 12, dataLabelColor: INK,
      dataLabelFormatCode: '#,##0"円"',
      showLegend: false,
      showTitle: true, title: "1人あたり月額API原価（中央値・月300分利用）",
      titleFontFace: FH, titleFontSize: 12.5, titleColor: MUTED,
      catAxisLabelFontFace: FB, catAxisLabelFontSize: 12, catAxisLabelColor: INK,
      valAxisLabelFontFace: FN, valAxisLabelFontSize: 10, valAxisLabelColor: MUTED,
      valAxisMaxVal: 11000, valAxisMinVal: 0,
      valGridLine: { color: "EAF0EC", size: 1 },
      catGridLine: { style: "none" },
      catAxisLineShow: false, valAxisLineShow: false,
    }
  );

  const rows = [
    { t: "リアルタイム音声", d: "ChatGPT音声モード相当。割り込める、間が自然", r: "6,000〜10,500円", h: "100人で月60〜105万円", c: RISK },
    { t: "ハイブリッド（推奨）", d: "1日20分までリアルタイム、超過分は自動切替", r: "2,500〜4,000円", h: "100人で月25〜40万円", c: AMBER },
    { t: "分割パイプライン", d: "応答に0.5〜1.5秒の間。会話としては成立する", r: "900〜2,100円", h: "100人で月9〜21万円", c: SAGE },
  ];
  rows.forEach((r, i) => {
    const y = 1.78 + i * 1.13;
    card(s, 7.86, y, CW - 7.24, 1.0, { fill: PINE_2, line: false });
    s.addText(r.t, { x: 8.14, y: y + 0.1, w: 2.7, h: 0.28, margin: 0, fontFace: FH, fontSize: 13, bold: true, color: WHITE });
    s.addText(r.r, { x: 10.7, y: y + 0.08, w: 2.14, h: 0.32, margin: 0, align: "right", fontFace: FN, fontSize: 14, bold: true, color: r.c === SAGE ? "9FD3B8" : (r.c === AMBER ? "E9A96C" : "E39184") });
    s.addText(r.d, { x: 8.14, y: y + 0.42, w: 4.7, h: 0.26, margin: 0, fontFace: FB, fontSize: 10.5, color: MUTED_D });
    s.addText(r.h, { x: 8.14, y: y + 0.68, w: 4.7, h: 0.26, margin: 0, fontFace: FB, fontSize: 11, bold: true, color: SAGE_LT });
  });

  card(s, 7.86, 5.17, CW - 7.24, 1.03, { fill: AMBER, line: false });
  s.addText("会話時間の上限設計が、そのまま原価管理になる。", {
    x: 8.14, y: 5.3, w: CW - 7.8, h: 0.76, margin: 0,
    fontFace: FH, fontSize: 13.5, bold: true, color: WHITE, valign: "middle", lineSpacing: 20,
  });
  footNote(s, "別途インフラ月1.5〜4万円、SMS認証1通10〜15円、LINE公式アカウント月5,000〜15,000円。API単価は2026年8月時点の想定値（契約時に再確認）。", true);
}

/* ============================================================
   S7  収支の目安
   ============================================================ */
{
  const s = slideBase(false);
  header(s, "6", "誰が払うかで、作るものが変わる", "ハイブリッド構成（原価3,000円/人月）を前提とした、3つの回収シナリオです。", false);

  const rows = [
    [th("回収モデル"), th("想定単価", { align: "right" }), th("原価", { align: "right" }), th("粗利", { align: "right" }), th("成立条件と、仕様への影響")],
    [
      { text: "個人向けサブスク", options: { bold: true } },
      { text: "月 5,000円", options: { align: "right", fontFace: FN } },
      { text: "3,000円", options: { align: "right", fontFace: FN } },
      { text: "2,000円", options: { align: "right", fontFace: FN, bold: true, color: RISK } },
      { text: "高齢者本人がカード決済しない。家族が契約者になる導線が必須で、家族画面（+12人日）の優先度が上がる" },
    ],
    [
      { text: "家族が支払う見守りプラン", options: { bold: true } },
      { text: "月 8,000円", options: { align: "right", fontFace: FN } },
      { text: "3,000円", options: { align: "right", fontFace: FN } },
      { text: "5,000円", options: { align: "right", fontFace: FN, bold: true, color: PINE } },
      { text: "「様子が分かる」ことに払う。家族向け見守り画面が価値の中心になり、C案の範囲が必要になる" },
    ],
    [
      { text: "介護施設・自治体との契約", options: { bold: true } },
      { text: "1人 月6,000円\n（20人単位）", options: { align: "right", fontFace: FB, fontSize: 11 } },
      { text: "3,000円", options: { align: "right", fontFace: FN } },
      { text: "3,000円", options: { align: "right", fontFace: FN, bold: true, color: PINE } },
      { text: "解約が起きにくく単価も安定。ただし個人情報の国内完結が要件化されやすく、構成変更（+3人日）が要る" },
    ],
  ];
  s.addTable(rows, Object.assign({}, tblBase, {
    x: M, y: 1.78, w: CW, colW: [2.5, 1.5, 1.05, 1.05, 5.99],
    rowH: [0.42, 0.98, 0.98, 0.98],
    fill: { color: WHITE },
  }));

  card(s, M, 5.42, CW, 1.22, { fill: AMBER_LT, lineColor: "EDD3BC" });
  token(s, M + 0.36, 5.74, "!", { d: 0.42, bg: AMBER, size: 15 });
  s.addText("どのシナリオでも、原価3,000円を下回る売価は成立しません。", {
    x: M + 0.98, y: 5.62, w: CW - 1.4, h: 0.32, margin: 0,
    fontFace: FH, fontSize: 14.5, bold: true, color: AMBER,
  });
  s.addText("「誰が払うか」が決まると、音声方式・会話時間の上限・家族画面の要否が連動して決まります。逆にここが未定のままだと、仕様も見積も確定できません。", {
    x: M + 0.98, y: 5.98, w: CW - 1.4, h: 0.46, margin: 0,
    fontFace: FB, fontSize: 12, color: INK, lineSpacing: 18,
  });
}

/* ============================================================
   S8  記憶の4層設計
   ============================================================ */
{
  const s = slideBase(false);
  header(s, "7", "「全部覚えている」の作り方", "保存は全件・無期限。AIに渡す情報を4層に分けることで、コストを抑えたまま思い出せます。", false);

  const layers = [
    { n: "層1", t: "直近の会話ログ", p: "初期値 7日", d: "発言をそのまま保持し、毎回AIに渡す。「昨日の話」はこの層で確実に再現される。要約しない。" },
    { n: "層2", t: "日次サマリー", p: "注入90日・保存無期限", d: "毎晩バッチで1日を300字に要約。「先月、膝が痛いと言っていた」を低コストで維持する。" },
    { n: "層3", t: "人物プロフィール", p: "常時・無期限", d: "名前、家族構成、通院日、触れてほしくない話題。会話の「その人らしさ」はほぼこの層が作る。" },
    { n: "層4", t: "RAG検索", p: "全期間", d: "全会話をベクトル化し、関連するときだけ検索して差し込む。「3年前の孫の名前」を思い出せる。" },
  ];
  const cw = (CW - 3 * 0.3) / 4;
  layers.forEach((l, i) => {
    const x = M + i * (cw + 0.3);
    card(s, x, 1.78, cw, 3.1, { fill: WHITE, shadow: true });
    token(s, x + 0.3, 2.04, l.n, { d: 0.56, size: 11, face: FB, bg: i === 3 ? AMBER : PINE });
    s.addText(l.t, { x: x + 0.3, y: 2.72, w: cw - 0.6, h: 0.34, margin: 0, fontFace: FH, fontSize: 15, bold: true, color: INK });
    s.addText(l.p, { x: x + 0.3, y: 3.06, w: cw - 0.6, h: 0.26, margin: 0, fontFace: FB, fontSize: 11, bold: true, color: SAGE });
    s.addText(l.d, { x: x + 0.3, y: 3.42, w: cw - 0.6, h: 1.3, margin: 0, fontFace: FB, fontSize: 11.5, color: MUTED, lineSpacing: 18 });
  });

  card(s, M, 5.08, CW, 1.56, { fill: SAGE_XLT });
  s.addText("要件メモの「RAGに詰め込むだけでいい」について", {
    x: M + 0.42, y: 5.24, w: CW - 0.84, h: 0.32, margin: 0,
    fontFace: FH, fontSize: 13.5, bold: true, color: PINE,
  });
  s.addText("RAGが担当するのは層4だけです。RAG単体では検索に引っかからない話題が「存在しないこと」になり、"
    + "「昨日の話を忘れている」という、高齢者の方が最も敏感に気づく失敗が起きます。層1〜3を併用する前提で工数を組んでいます。\n"
    + "保存期間の設定は運用開始後に数値だけで変更できる設計とするため、現時点で確定させる必要はありません。", {
    x: M + 0.42, y: 5.6, w: CW - 0.84, h: 0.92, margin: 0,
    fontFace: FB, fontSize: 12, color: INK, lineSpacing: 19,
  });
}

/* ============================================================
   S9  通知方式の比較
   ============================================================ */
{
  const s = slideBase(false);
  header(s, "8", "通知は、Webでも届きます", "「Webアプリでは通知できない」は現在の仕様では正確ではありません。ただし推奨はLINEです。", false);

  const rows = [
    [th("方式"), th("到達"), th("気づきやすさ"), th("追加工数", { align: "right" }), th("通信費", { align: "right" }), th("評価")],
    [
      { text: "Webプッシュ（PWA）" }, { text: "Android◎ / iOS△" }, { text: "△" },
      { text: "3人日", options: { align: "right", fontFace: FN } }, { text: "無料", options: { align: "right" } },
      { text: "iOSは「ホーム画面に追加」が前提。高齢者ご本人だけでは設定できない" },
    ],
    [
      { text: "LINE通知", options: { bold: true, color: PINE } }, { text: "◎", options: { bold: true } }, { text: "◎", options: { bold: true } },
      { text: "4人日", options: { align: "right", fontFace: FN, bold: true } }, { text: "〜3円/通", options: { align: "right", fontFace: FN } },
      { text: "推奨。対象層が既に日常的に使っており、端末設定に左右されない", options: { bold: true, color: PINE } },
    ],
    [
      { text: "アプリのプッシュ通知" }, { text: "◎" }, { text: "○" },
      { text: "12人日〜", options: { align: "right", fontFace: FN } }, { text: "無料", options: { align: "right" } },
      { text: "最も自由度が高いが、ネイティブアプリ化とストア審査が前提（C案）" },
    ],
    [
      { text: "SMS" }, { text: "◎" }, { text: "○" },
      { text: "2人日", options: { align: "right", fontFace: FN } }, { text: "10円前後/通", options: { align: "right", fontFace: FN } },
      { text: "確実だが無機質。重要連絡の予備手段として持つ" },
    ],
    [
      { text: "自動音声架電" }, { text: "◎" }, { text: "◎" },
      { text: "6人日", options: { align: "right", fontFace: FN } }, { text: "20〜40円/分", options: { align: "right", fontFace: FN } },
      { text: "電話が鳴るのが最も強い。服薬・安否確認に有効だが費用は高い" },
    ],
  ];
  s.addTable(rows, Object.assign({}, tblBase, {
    x: M, y: 1.8, w: CW, colW: [2.10, 1.70, 1.25, 0.95, 1.25, 4.84],
    rowH: [0.4, 0.66, 0.66, 0.66, 0.66, 0.66],
    fill: { color: WHITE }, fontSize: 11,
  }));

  card(s, M, 5.66, CW, 0.98, { fill: SAGE_XLT });
  s.addText("推奨：MVPはLINE通知で開始し、利用が定着した段階でC案のアプリ化に合わせてプッシュ通知へ移行。安否確認まで踏み込む場合のみ自動架電を追加する。", {
    x: M + 0.42, y: 5.66, w: CW - 0.84, h: 0.98, margin: 0,
    fontFace: FB, fontSize: 13, color: INK, valign: "middle",
  });
}

/* ============================================================
   S10  個人情報・法令
   ============================================================ */
{
  const s = slideBase(false);
  header(s, "9", "個人情報の扱いは、後付けできません", "会話には持病・服薬・家族関係が自然に混ざります。これは要配慮個人情報にあたります。", false);

  const items = [
    { t: "保存場所", d: "AWS東京またはGoogle Cloud東京リージョン。保存時・通信時ともに暗号化し、アクセスは監査ログに記録する。", w: "標準対応" },
    { t: "取得の同意", d: "要配慮個人情報にあたるため、用途を明示したオプトイン同意が必須。同意画面も音声で読み上げる。", w: "標準対応" },
    { t: "AI事業者への送信", d: "第三者提供ではなく委託として整理。米国事業者のAPIを使う場合は越境移転にあたり、移転先国と保護措置の記載が要る。", w: "標準対応" },
    { t: "国内完結が要件の場合", d: "Azure OpenAI（東日本）またはBedrock（東京）構成に切替。自治体・施設向けでは要件化されやすい。", w: "＋3人日" },
    { t: "削除・開示請求", d: "退会時にRAGのベクトルデータまで含めて完全削除できる設計。後付けが難しいため初期から組み込む。", w: "標準対応" },
    { t: "同意能力", d: "認知症等でご本人の同意能力が十分でない場合の家族同意の扱いは、法務確認が必要。", w: "法務確認" },
  ];
  const cw = (CW - 0.42) / 2, ch = 0.82;
  items.forEach((it, i) => {
    const x = M + (i % 2) * (cw + 0.42);
    const y = 1.8 + Math.floor(i / 2) * (ch + 0.28);
    card(s, x, y, cw, ch, { fill: WHITE, shadow: true });
    s.addText(it.t, { x: x + 0.3, y: y + 0.09, w: cw - 1.7, h: 0.3, margin: 0, fontFace: FH, fontSize: 13.5, bold: true, color: INK });
    s.addText(it.d, { x: x + 0.3, y: y + 0.38, w: cw - 0.6, h: 0.38, margin: 0, fontFace: FB, fontSize: 11, color: MUTED, lineSpacing: 15 });
    const wc = it.w === "標準対応" ? SAGE : (it.w === "法務確認" ? RISK : AMBER);
    s.addText(it.w, { x: x + cw - 1.42, y: y + 0.09, w: 1.12, h: 0.28, margin: 0, align: "right", fontFace: FB, fontSize: 11, bold: true, color: wc });
  });

  card(s, M, 5.14, CW, 1.5, { fill: SAGE_XLT });
  s.addText("結論：国内リージョンに暗号化して保存し、AIへの送信経路をプライバシーポリシーに明示する構成であれば、問題なく運用できます。", {
    x: M + 0.42, y: 5.32, w: CW - 0.84, h: 0.32, margin: 0,
    fontFace: FH, fontSize: 13.5, bold: true, color: PINE,
  });
  s.addText("ただし、削除請求への対応と同意フローは設計の初期に組み込む必要があり、リリース後の追加は実質的な作り直しになります。"
    + "推奨案では「個人情報・セキュリティ対応」として5人日を計上済みです。", {
    x: M + 0.42, y: 5.7, w: CW - 0.84, h: 0.68, margin: 0,
    fontFace: FB, fontSize: 12, color: INK, lineSpacing: 19,
  });
}

/* ============================================================
   S11  スケジュール
   ============================================================ */
{
  const s = slideBase(false);
  header(s, "10", "スケジュール（推奨案・約4ヶ月）", "高齢者ユーザーテストを3ヶ月目後半に置き、指摘を4ヶ月目で反映します。", false);

  const gx = 3.5, gw = CW - (gx - M), gy = 2.26, rowH = 0.42, gap = 0.14;
  // month grid
  for (let i = 0; i <= 4; i++) {
    const x = gx + (gw / 4) * i;
    s.addShape(pres.ShapeType.rect, { x, y: gy - 0.34, w: 0.008, h: 7 * (rowH + gap) - gap + 0.34, fill: { color: LINE } });
    if (i < 4) {
      s.addText((i + 1) + "ヶ月目", {
        x: x + 0.12, y: gy - 0.64, w: 1.4, h: 0.26, margin: 0,
        fontFace: FB, fontSize: 11, bold: true, color: MUTED,
      });
    }
  }

  const tasks = [
    { t: "要件定義・UI設計", s: 0.00, e: 0.32, c: PINE },
    { t: "基盤構築", s: 0.12, e: 0.32, c: SAGE },
    { t: "音声会話コア", s: 0.22, e: 0.60, c: PINE },
    { t: "記憶基盤", s: 0.28, e: 0.68, c: PINE },
    { t: "UI・ログイン実装", s: 0.45, e: 0.78, c: SAGE },
    { t: "通知・管理画面", s: 0.60, e: 0.80, c: SAGE },
    { t: "テスト・ユーザーテスト・修正", s: 0.74, e: 1.00, c: AMBER },
  ];
  tasks.forEach((t, i) => {
    const y = gy + i * (rowH + gap);
    s.addText(t.t, { x: M, y: y, w: gx - M - 0.2, h: rowH, margin: 0, fontFace: FB, fontSize: 12, color: INK, valign: "middle", align: "right" });
    s.addShape(pres.ShapeType.roundRect, {
      x: gx + gw * t.s + 0.02, y: y + 0.06, w: gw * (t.e - t.s) - 0.04, h: rowH - 0.12,
      rectRadius: 0.04, fill: { color: t.c },
    });
  });

  card(s, M, 6.32, CW, 0.7, { fill: AMBER_LT, lineColor: "EDD3BC" });
  s.addText("前提：ユーザーテストの被験者手配は社内で行う。要件確定後の大幅な仕様変更は別途見積となる。", {
    x: M + 0.42, y: 6.32, w: CW - 0.84, h: 0.7, margin: 0,
    fontFace: FB, fontSize: 12, color: INK, valign: "middle",
  });
}

/* ============================================================
   S12  リスクと見積除外
   ============================================================ */
{
  const s = slideBase(false);
  header(s, "11", "リスクと、見積に含まないもの", "", false);

  const colW = (CW - 0.42) / 2;
  // left: risks
  s.addText("主要リスク", { x: M, y: 1.6, w: colW, h: 0.34, margin: 0, fontFace: FH, fontSize: 15, bold: true, color: RISK });
  const risks = [
    { t: "API単価の改定", d: "音声AIの価格は改定が頻繁。原価が上振れすると回収モデルが崩れる。会話時間の上限を管理画面から変更できる設計で吸収する。" },
    { t: "継続率が読めない", d: "毎日話しかけてもらえるかは、作ってみないと分からない。A案で数名に使ってもらい実測してからB案に進む理由がここにある。" },
    { t: "責任範囲の線引き", d: "「安否確認できると思っていた」という期待のずれが最大のリスク。本アプリは会話の相手であり見守りシステムではないことを、規約と画面の両方で明示する。" },
  ];
  risks.forEach((r, i) => {
    const y = 2.06 + i * 1.44;
    card(s, M, y, colW, 1.28, { fill: WHITE, shadow: true });
    token(s, M + 0.3, y + 0.24, String(i + 1), { d: 0.36, size: 11, bg: RISK });
    s.addText(r.t, { x: M + 0.82, y: y + 0.2, w: colW - 1.12, h: 0.3, margin: 0, fontFace: FH, fontSize: 13.5, bold: true, color: INK });
    s.addText(r.d, { x: M + 0.82, y: y + 0.54, w: colW - 1.12, h: 0.66, margin: 0, fontFace: FB, fontSize: 11, color: MUTED, lineSpacing: 16 });
  });

  // right: exclusions
  const rx = M + colW + 0.42;
  s.addText("見積に含まないもの", { x: rx, y: 1.6, w: colW, h: 0.34, margin: 0, fontFace: FH, fontSize: 15, bold: true, color: PINE });
  card(s, rx, 2.06, colW, 4.16, { fill: SAGE_XLT });
  const ex = [
    "AI APIの従量課金、クラウド利用料などの実費（第5項の通り、別途発生）",
    "リリース後の保守・運用（月15〜30万円目安で別途）",
    "Apple / Google の開発者アカウント年会費、LINE公式アカウント利用料",
    "利用規約・プライバシーポリシーの法務レビュー費用（雛形作成は含む）",
    "ロゴ・ブランディング制作",
    "日本語以外の言語対応、方言への特別対応",
    "医療・介護に関する助言、診断、緊急通報の代替となる機能",
  ];
  s.addText(ex.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i !== ex.length - 1 } })), {
    x: rx + 0.42, y: 2.34, w: colW - 0.84, h: 3.6, margin: 0,
    fontFace: FB, fontSize: 12, color: INK, lineSpacing: 19, paraSpaceAfter: 7,
  });
}

/* ============================================================
   S13  意思決定していただきたいこと（DARK）
   ============================================================ */
{
  const s = slideBase(true);
  header(s, "12", "決めていただきたいこと", "以下の3点が決まれば、概算から正式見積に切り替えられます。", true);

  const qs = [
    { q: "誰が費用を払うか", d: "本人 / 家族 / 介護施設 / 自治体", i: "音声方式・会話時間の上限・家族画面の要否が決まる" },
    { q: "初年度の想定利用者数", d: "10人 / 100人 / 1,000人", i: "インフラ構成と原価、回収に必要な単価が決まる" },
    { q: "Webか、アプリか", d: "Web＋LINE通知 / 最初からネイティブ", i: "開発費が658万円か1,190万円かが決まる" },
  ];
  const cw = 3.86, gap = 0.475;
  qs.forEach((q, i) => {
    const x = M + i * (cw + gap);
    card(s, x, 1.86, cw, 2.72, { fill: PINE_2, line: false });
    token(s, x + 0.34, 2.14, String(i + 1), { d: 0.44, size: 13, bg: AMBER });
    s.addText(q.q, { x: x + 0.34, y: 2.72, w: cw - 0.68, h: 0.7, margin: 0, fontFace: FH, fontSize: 17, bold: true, color: WHITE, lineSpacing: 25 });
    s.addText(q.d, { x: x + 0.34, y: 3.46, w: cw - 0.68, h: 0.34, margin: 0, fontFace: FB, fontSize: 11.5, color: SAGE_LT });
    s.addShape(pres.ShapeType.rect, { x: x + 0.34, y: 3.88, w: cw - 0.68, h: 0.01, fill: { color: SAGE } });
    s.addText(q.i, { x: x + 0.34, y: 3.98, w: cw - 0.68, h: 0.5, margin: 0, fontFace: FB, fontSize: 11.5, color: MUTED_D, lineSpacing: 17 });
  });

  s.addText("次のアクション", {
    x: M, y: 4.86, w: 4, h: 0.3, margin: 0,
    fontFace: FH, fontSize: 12.5, bold: true, charSpacing: 1.5, color: SAGE,
  });
  const acts = [
    "上記3点を確定し、正式見積を再作成する（残り7点の確認事項は別紙の見積書 第11項）",
    "A案（203万円・1.5ヶ月）で音声品質・記憶精度・API単価を実測してからB案に進むことを推奨",
    "並行して、利用規約とプライバシーポリシーの法務相談を開始する",
  ];
  acts.forEach((a, i) => {
    const y = 5.28 + i * 0.42;
    token(s, M, y - 0.01, "▸", { d: 0.28, size: 10, bg: SAGE, face: FB });
    s.addText(a, { x: M + 0.44, y: y - 0.05, w: CW - 0.44, h: 0.36, margin: 0, fontFace: FB, fontSize: 13, color: SAGE_LT, valign: "middle" });
  });
  footNote(s, "本資料の金額はすべて税別、単価前提7万円／人日、工数精度±15%。有効期限は作成日より60日。", true);
}

pres.writeFile({ fileName: "/tmp/claude-0/-home-user-new/719ac7d7-e22b-5fde-baff-0aabb5d5848a/scratchpad/elderly-voice-ai-proposal.pptx" })
  .then(f => console.log("written:", f));
