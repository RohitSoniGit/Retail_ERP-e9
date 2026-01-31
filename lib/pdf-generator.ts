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
      // Configure canvas options
      const canvasOptions: any = {
        scale: options.quality || 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        foreignObjectRendering: false,
        imageTimeout: 0,
        removeContainer: true,
        width: options.format === 'thermal' ? 302 : 794, // 210mm at 96 DPI
        height: options.format === 'thermal' ? undefined : 1123, // 297mm at 96 DPI
        windowWidth: options.format === 'thermal' ? 302 : 794,
        ignoreElements: (el: Element) => {
          try {
            const tagName = el.tagName?.toLowerCase() || '';
            if (tagName === 'script' || tagName === 'noscript') return true;
            if (el.classList?.contains('no-print')) return true;
            return false;
          } catch (e) {
            return false;
          }
        },
        onclone: (clonedDoc: Document) => {
          try {
            // 1. Remove scripts
            const scripts = clonedDoc.querySelectorAll('script, noscript');
            scripts.forEach(s => s.remove());

            // 2. Remove all external stylesheets
            const assets = clonedDoc.querySelectorAll('link[rel="stylesheet"], style');
            assets.forEach(asset => asset.remove());

            // 3. Inject optimized stylesheet with increased font size and 1px borders
            const printStyle = clonedDoc.createElement('style');
            printStyle.innerHTML = `
              /* Reset and Base */
              * { 
                box-sizing: border-box !important; 
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                border-color: #000000 !important;
              }
              body { 
                background: #ffffff !important; 
                font-family: Arial, Helvetica, sans-serif !important;
                color: #000000 !important;
                line-height: 1.3 !important;
                width: 210mm !important;
                height: 297mm !important;
                overflow: hidden !important;
              }
              
              /* Layout Utilities */
              .flex { display: flex !important; }
              .flex-col { flex-direction: column !important; }
              .flex-row { flex-direction: row !important; }
              .flex-1 { flex: 1 1 0% !important; }
              .flex-grow { flex-grow: 1 !important; }
              .flex-wrap { flex-wrap: wrap !important; }
              .justify-between { justify-content: space-between !important; }
              .justify-center { justify-content: center !important; }
              .justify-start { justify-content: flex-start !important; }
              .items-center { align-items: center !important; }
              .items-start { align-items: flex-start !important; }
              
              .grid { display: flex !important; flex-wrap: wrap !important; width: 100% !important; }
              .grid-cols-2 > * { width: 50% !important; }
              
              /* Common Spans */
              .col-span-12 { width: 100% !important; }
              .col-span-7 { width: 58.33% !important; }
              .col-span-5 { width: 41.66% !important; }
              
              /* Borders - Forced to 1px as requested */
              .border { border: 1px solid #000000 !important; }
              .border-2 { border: 1px solid #000000 !important; } /* Changed from 2px to 1px */
              .border-black { border-color: #000000 !important; }
              .border-b { border-bottom: 1px solid #000000 !important; }
              .border-b-2 { border-bottom: 1px solid #000000 !important; } /* Changed to 1px */
              .border-t { border-top: 1px solid #000000 !important; }
              .border-t-2 { border-top: 1px solid #000000 !important; } /* Changed to 1px */
              .border-r { border-right: 1px solid #000000 !important; }
              .border-r-2 { border-right: 1px solid #000000 !important; } /* Changed to 1px */
              .border-gray-300, .border-gray-400 { border-color: #000000 !important; }
              
              /* Spacing */
              .p-1 { padding: 3pt !important; }
              .p-2 { padding: 5pt !important; }
              .p-4 { padding: 10pt !important; }
              .px-2 { padding-left: 5pt !important; padding-right: 5pt !important; }
              .pb-2 { padding-bottom: 5pt !important; }
              .mb-1 { margin-bottom: 3pt !important; }
              .mt-1 { margin-top: 3pt !important; }
              .mt-8 { margin-top: 18pt !important; }
              
              /* Sizing */
              .w-full { width: 100% !important; }
              .h-full { height: 100% !important; }
              
              /* Column sizing for items table */
              .w-12 { width: 12mm !important; }
              .w-14 { width: 14mm !important; }
              .w-16 { width: 18mm !important; }
              .w-20 { width: 22mm !important; }
              .w-24 { width: 28mm !important; }
              
              /* Typography - Increased Font Sizes */
              .text-xs { font-size: 9.5pt !important; }
              .text-sm { font-size: 11pt !important; }
              .text-base { font-size: 13pt !important; }
              .text-lg { font-size: 15pt !important; }
              .text-xl { font-size: 18pt !important; }
              .text-2xl { font-size: 20pt !important; }
              .text-\\[10px\\] { font-size: 9pt !important; }
              
              .font-bold { font-weight: bold !important; }
              .font-semibold { font-weight: 600 !important; }
              .uppercase { text-transform: uppercase !important; }
              .italic { font-style: italic !important; }
              .underline { text-decoration: underline !important; }
              .text-center { text-align: center !important; }
              .text-right { text-align: right !important; }
              .text-left { text-align: left !important; }
              
              /* Colors */
              .bg-white { background-color: #ffffff !important; }
              .bg-gray-50 { background-color: #f9fafb !important; }
              .bg-gray-100 { background-color: #f3f4f6 !important; }
              
              /* Tables */
              table { width: 100% !important; border-collapse: collapse !important; table-layout: fixed !important; }
              th, td { border: 1px solid #000000 !important; word-wrap: break-word !important; padding: 4pt !important; }
              
              /* Header Strip Fix */
              .border-t-2.border-black.flex > div {
                flex: 1 1 0% !important;
                border-right: 1px solid #000000 !important;
              }
              .border-t-2.border-black.flex > div:last-child {
                border-right: none !important;
              }

              /* Main Container sizing */
              div[ref] {
                width: 210mm !important;
                height: 297mm !important;
                padding: 10mm !important;
                margin: 0 !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                border: 1px solid #000000 !important; /* Root border also 1px */
              }
            `;
            clonedDoc.head.appendChild(printStyle);
          } catch (error) {
            console.warn('Error in onclone:', error);
          }
        }
      };

      // Generate canvas from HTML
      const canvas = await html2canvas(element, canvasOptions);

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      // Add image
      const imgData = canvas.toDataURL('image/png', 0.95);
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');

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