// Real file extraction (client-side) for the AI Analysis Workspace.
// Supports PDF (pdfjs-dist), DOCX (mammoth), XLSX/CSV (sheetjs), TXT/JSON/MD.
import { jsPDF } from "jspdf";

export async function extractFileText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  try {
    if (/\.(txt|md|json|csv)$/i.test(name)) {
      return await file.text();
    }
    if (name.endsWith(".pdf")) {
      // Lazy-load pdfjs to keep bundle light
      const pdfjs = await import("pdfjs-dist");
      // @ts-ignore - vite worker URL
      const workerUrl = (await import("pdfjs-dist/build/pdf.worker.mjs?url")).default;
      // @ts-ignore
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      const data = await file.arrayBuffer();
      const doc = await pdfjs.getDocument({ data }).promise;
      const pages: string[] = [];
      const maxPages = Math.min(doc.numPages, 25);
      for (let i = 1; i <= maxPages; i++) {
        const p = await doc.getPage(i);
        const tc = await p.getTextContent();
        pages.push(tc.items.map((it: any) => it.str).join(" "));
      }
      return pages.join("\n\n").slice(0, 30000);
    }
    if (name.endsWith(".docx")) {
      const mammoth = await import("mammoth");
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return (result.value || "").slice(0, 30000);
    }
    if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      const XLSX = await import("xlsx");
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });
      const out: string[] = [];
      wb.SheetNames.forEach((n) => {
        const sheet = wb.Sheets[n];
        out.push(`# Sheet: ${n}\n${XLSX.utils.sheet_to_csv(sheet)}`);
      });
      return out.join("\n\n").slice(0, 30000);
    }
    return `[Binary file: ${file.name} — ${Math.round(file.size / 1024)}KB. Not extractable.]`;
  } catch (e) {
    console.error("extractFileText error", e);
    return `[Failed to extract ${file.name}: ${e instanceof Error ? e.message : "unknown error"}]`;
  }
}

export function downloadTextAsPDF(title: string, body: string, filename: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usable = pageWidth - margin * 2;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 20);
  doc.text(title, margin, margin + 6);

  doc.setDrawColor(207, 0, 238);
  doc.setLineWidth(1.5);
  doc.line(margin, margin + 16, margin + 80, margin + 16);

  // Meta
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Helixa Intelligence · Generated ${new Date().toLocaleString()}`, margin, margin + 34);

  // Body
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);

  const lines = doc.splitTextToSize(body, usable);
  let y = margin + 60;
  const lineHeight = 15;
  for (const line of lines) {
    if (y + lineHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  }

  doc.save(filename);
}

export async function shareText(title: string, body: string) {
  if (typeof navigator !== "undefined" && (navigator as any).share) {
    try {
      await (navigator as any).share({ title, text: body });
      return true;
    } catch { /* user cancelled */ }
  }
  try {
    await navigator.clipboard.writeText(`${title}\n\n${body}`);
    return true;
  } catch {
    return false;
  }
}
