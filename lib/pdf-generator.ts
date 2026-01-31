import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface PDFGenerationOptions {
  format: 'thermal' | 'a4';
  filename?: string;
  quality?: number;
}

export class PDFGenerator {
  /**
   * Generate PDF from HTML element
   */
  static async generatePDFFromElement(
    element: HTMLElement,
    options: PDFGenerationOptions = { format: 'a4' }
  ): Promise<Blob> {
    try {
      // Configure canvas options with simplified, safer approach
      const canvasOptions: any = {
        scale: options.quality || 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        foreignObjectRendering: false,
        imageTimeout: 0,
        removeContainer: true,
        width: options.format === 'thermal' ? 302 : undefined,
        height: undefined,
        windowWidth: options.format === 'thermal' ? 302 : 1200,
        ignoreElements: (el: Element) => {
          try {
            const tagName = el.tagName?.toLowerCase() || '';
            if (tagName === 'script' || tagName === 'noscript') return true;

            // Use classList instead of className to avoid SVG issues
            if (el.classList?.contains('no-print')) return true;

            return false;
          } catch (e) {
            return false;
          }
        },
        onclone: (clonedDoc: Document) => {
          try {
            // Remove all scripts and external stylesheets that might contain oklch/lab
            const scripts = clonedDoc.querySelectorAll('script, noscript');
            scripts.forEach(s => s.remove());

            // Remove ALL existing styles and link stylesheets to prevent html2canvas parsing errors
            const stylesAndLinks = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
            stylesAndLinks.forEach(s => s.remove());

            // Inject a single, clean, safe standard-only stylesheet
            const printStyle = clonedDoc.createElement('style');
            printStyle.innerHTML = `
              * {
                box-sizing: border-box !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color: #000000 !important;
                border-color: #000000 !important;
              }
              body {
                font-family: Arial, Helvetica, sans-serif !important;
                color: #000000 !important;
                background: #ffffff !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              .no-print { display: none !important; }
              /* Basic layout helpers (since we removed Tailwind) */
              .flex { display: flex !important; }
              .flex-col { flex-direction: column !important; }
              .flex-row { flex-direction: row !important; }
              .justify-between { justify-content: space-between !important; }
              .grid { display: grid !important; }
              .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
              .grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)) !important; }
              .col-span-7 { grid-column: span 7 / span 7 !important; }
              .col-span-5 { grid-column: span 5 / span 5 !important; }
              .p-4 { padding: 1rem !important; }
              .border-b-2 { border-bottom: 2px solid #000000 !important; }
              .font-bold { font-weight: bold !important; }
              .text-right { text-align: right !important; }
              .text-center { text-align: center !important; }
              .text-xs { font-size: 8pt !important; }
              .text-sm { font-size: 10pt !important; }
              table { width: 100% !important; border-collapse: collapse !important; }
              th, td { border: 1px solid #000000 !important; padding: 4px !important; }
            `;
            clonedDoc.head.appendChild(printStyle);

            // Clean inline styles on all elements
            const allElements = clonedDoc.querySelectorAll('*');
            allElements.forEach((el: Element) => {
              try {
                const htmlEl = el as HTMLElement;
                if (htmlEl.style) {
                  const properties = ['color', 'backgroundColor', 'borderColor', 'outlineColor', 'fill', 'stroke'];
                  properties.forEach(prop => {
                    const style = htmlEl.style as any;
                    const val = style[prop];
                    if (val && typeof val === 'string' && (val.includes('lab(') || val.includes('oklch('))) {
                      style[prop] = '#000000';
                    }
                  });
                }

                // Remove modern functions and variables from raw style attribute
                const styleAttr = el.getAttribute?.('style');
                if (styleAttr) {
                  const cleaned = styleAttr
                    .replace(/(?:lab|oklch|color-mix)\s*\((?:[^()]+|\([^()]*\))*\)/gi, '#000000')
                    .replace(/var\(--[^)]+\)/gi, '#000000');
                  el.setAttribute('style', cleaned);
                }
              } catch (e) { }
            });
          } catch (error) {
            console.warn('Error in onclone:', error);
          }
        }
      };

      // Generate canvas from HTML
      const canvas = await html2canvas(element, canvasOptions);

      // Configure PDF dimensions
      let pdfWidth: number;
      let pdfHeight: number;
      let orientation: 'portrait' | 'landscape' = 'portrait';

      if (options.format === 'thermal') {
        // 80mm thermal paper
        pdfWidth = 80;
        pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      } else {
        // A4 format
        pdfWidth = 210; // A4 width in mm
        pdfHeight = 297; // A4 height in mm
      }

      // Create PDF
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: options.format === 'thermal' ? [pdfWidth, pdfHeight] : 'a4',
      });

      // Add image to PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      // Return as blob
      return pdf.output('blob');
    } catch (error: any) {
      console.error('PDF generation error:', error);
      throw new Error(`Failed to generate PDF: ${error?.message || String(error) || 'Unknown error'}`);
    }
  }

  /**
   * Download PDF directly
   */
  static async downloadPDF(
    element: HTMLElement,
    filename: string,
    options: PDFGenerationOptions = { format: 'a4' }
  ): Promise<void> {
    try {
      const pdfBlob = await this.generatePDFFromElement(element, options);

      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF download error:', error);
      throw error;
    }
  }

  /**
   * Fallback method using window.print() if PDF generation fails
   */
  static async printFallback(): Promise<void> {
    try {
      window.print();
    } catch (error) {
      console.error('Print fallback error:', error);
      throw error;
    }
  }
}