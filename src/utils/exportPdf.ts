import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const TREE_BG = "#f5e6c3";
const TITLE_COLOR: [number, number, number] = [60, 36, 24];
const SUBTITLE_COLOR: [number, number, number] = [120, 96, 70];
const GOLD: [number, number, number] = [196, 154, 70];

export const exportFamilyTreeAsPdf = async (titleText = "Keshwania Family Tree") => {
  // Capture the inner tree (rows + connectors) so we don't include any
  // pan-zoom viewport whitespace around it.
  const tree = document.querySelector(".organic-tree") as HTMLElement | null;
  const wrapper = document.querySelector(".pan-zoom-content") as HTMLElement | null;
  const viewport = document.querySelector(".tree-scroll") as HTMLElement | null;
  if (!tree || !wrapper) throw new Error("Family tree is not rendered.");

  // ── Save styles we temporarily override for capture ──
  const origWrapperTransform = wrapper.style.transform;
  const origWrapperTransition = wrapper.style.transition;
  const origViewportOverflow = viewport?.style.overflow ?? "";
  const origTreeWidth = tree.style.width;

  wrapper.style.transition = "none";
  wrapper.style.transform = "none";
  if (viewport) viewport.style.overflow = "visible";

  // The generation rows use a `1fr | auto | 1fr` grid whose side tracks are
  // capped to the viewport width — when many siblings are expanded they spill
  // past the tree's measured width and get cropped. Measure the real content
  // width (trunk + widest left/right branch group) and force the tree that
  // wide so every branch lays out fully and stays symmetric around the trunk.
  const rows = Array.from(tree.querySelectorAll<HTMLElement>(".tree-generation-row"));
  let trunkW = 0;
  let halfW = 0;
  for (const row of rows) {
    const trunk = row.querySelector<HTMLElement>(".trunk-node");
    if (trunk) trunkW = Math.max(trunkW, trunk.scrollWidth);
    const left = row.querySelector<HTMLElement>(".branch-group--left");
    const right = row.querySelector<HTMLElement>(".branch-group--right");
    if (left) halfW = Math.max(halfW, left.scrollWidth);
    if (right) halfW = Math.max(halfW, right.scrollWidth);
  }
  const neededWidth = Math.ceil(trunkW + 2 * halfW + 48);
  if (neededWidth > tree.scrollWidth) {
    tree.style.width = `${neededWidth}px`;
  }

  // Two animation frames so layout settles after the style changes.
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  const cssW = tree.scrollWidth;
  const cssH = tree.scrollHeight;

  // Cap total pixels for memory safety; raise scale on small trees for crisper text.
  const maxPixels = 24_000_000;
  const idealScale = 3;
  const scale = Math.min(idealScale, Math.sqrt(maxPixels / (cssW * cssH)));
  const captureScale = Math.max(1.5, scale);

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(tree, {
      backgroundColor: TREE_BG,
      scale: captureScale,
      logging: false,
      useCORS: true,
      allowTaint: false,
      imageTimeout: 0,
      removeContainer: true,
      width: cssW,
      height: cssH,
      windowWidth: Math.max(window.innerWidth, cssW),
      windowHeight: Math.max(window.innerHeight, cssH),
      // html2canvas renders a fresh clone in an off-screen iframe, which
      // restarts every CSS keyframe animation from its opacity:0 first frame
      // and leaves [data-reveal] elements hidden — that's what made the boxes
      // look faded. Force everything to its final, solid state in the clone.
      onclone: (doc) => {
        const style = doc.createElement("style");
        style.textContent = `
          *, *::before, *::after {
            animation: none !important;
            transition: none !important;
            opacity: 1 !important;
            clip-path: none !important;
            filter: none !important;
            backdrop-filter: none !important;
          }
          .tree-gen-anim, .branch-group, .member-node, .pan-zoom-content {
            transform: none !important;
          }
        `;
        doc.head.appendChild(style);

        // Reveal any scroll-reveal elements and clear inline opacity/transform
        // that framer-motion or the reveal observer may have left mid-flight.
        doc.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
          el.classList.add("is-revealed");
        });
        doc.querySelectorAll<HTMLElement>(".tree-gen-anim, .branch-group").forEach((el) => {
          el.style.opacity = "1";
          el.style.transform = "none";
        });
      },
    });
  } finally {
    wrapper.style.transform = origWrapperTransform;
    wrapper.style.transition = origWrapperTransition;
    tree.style.width = origTreeWidth;
    if (viewport) viewport.style.overflow = origViewportOverflow;
  }

  // PDF sized to the tree at ~150 DPI for a print-quality result.
  const targetDpi = 150;
  const pxToPt = 72 / targetDpi;
  const drawW = (canvas.width / captureScale) * pxToPt;
  const drawH = (canvas.height / captureScale) * pxToPt;

  const margin = 48;
  const headerH = 70;
  const footerH = 28;

  let pageW = drawW + margin * 2;
  let pageH = drawH + margin * 2 + headerH + footerH;

  // Cap page size at ~60 inches per side; shrink image proportionally if exceeded.
  const maxPagePt = 4320;
  let imgScale = 1;
  if (pageW > maxPagePt || pageH > maxPagePt) {
    imgScale = Math.min(maxPagePt / pageW, maxPagePt / pageH);
    pageW *= imgScale;
    pageH *= imgScale;
  }
  const finalDrawW = drawW * imgScale;
  const finalDrawH = drawH * imgScale;

  const pdf = new jsPDF({
    orientation: pageW >= pageH ? "landscape" : "portrait",
    unit: "pt",
    format: [Math.max(pageW, pageH), Math.min(pageW, pageH)],
    compress: true,
  });

  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();

  // Parchment background.
  pdf.setFillColor(TREE_BG);
  pdf.rect(0, 0, W, H, "F");

  // Title
  pdf.setFont("times", "bold");
  pdf.setFontSize(26);
  pdf.setTextColor(TITLE_COLOR[0], TITLE_COLOR[1], TITLE_COLOR[2]);
  pdf.text(titleText, W / 2, margin + 18, { align: "center" });

  // Generated date
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(SUBTITLE_COLOR[0], SUBTITLE_COLOR[1], SUBTITLE_COLOR[2]);
  pdf.text(
    `Generated ${new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}`,
    W / 2,
    margin + 38,
    { align: "center" },
  );

  // Gold divider
  pdf.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
  pdf.setLineWidth(0.8);
  pdf.line(W / 2 - 80, margin + 52, W / 2 + 80, margin + 52);

  // Tree image — centered, at native DPI
  const imgX = (W - finalDrawW) / 2;
  const imgY = margin + headerH;
  pdf.addImage(
    canvas.toDataURL("image/png"),
    "PNG",
    imgX,
    imgY,
    finalDrawW,
    finalDrawH,
    undefined,
    "FAST",
  );

  // Footer line
  pdf.setFontSize(9);
  pdf.setTextColor(SUBTITLE_COLOR[0], SUBTITLE_COLOR[1], SUBTITLE_COLOR[2]);
  pdf.text("श्री केश्वानिया वंश  ·  Preserved for generations to come.", W / 2, H - margin / 2, { align: "center" });

  pdf.save("keshwani-family-tree.pdf");
};
