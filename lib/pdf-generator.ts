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
      // Configure canvas options based on format - aggressive settings to avoid LAB color issues
      const canvasOptions: any = {
        scale: options.quality || 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false, // Disable logging to avoid color parse errors
        foreignObjectRendering: false, // Disable to prevent LAB color issues
        imageTimeout: 0,
        removeContainer: true,
        width: options.format === 'thermal' ? 302 : undefined, // 80mm in pixels
        height: undefined,
        windowWidth: options.format === 'thermal' ? 302 : 1200,
        onclone: (clonedDoc: Document) => {
          // Aggressively replace modern color functions in the entire body HTML
          const body = clonedDoc.body;
          let bodyHtml = body.innerHTML;

          // Regex to catch lab(), lch(), oklab(), oklch() and replace with a safe color
          // We replace with white or black depending on context if possible, but here we just safely fallback to a hex code
          // to prevent the parser from crashing.
          if (bodyHtml.match(/(lab|lch|oklab|oklch)\(/)) {
            bodyHtml = bodyHtml.replace(/(lab|lch|oklab|oklch)\([^)]+\)/gi, '#000000');
            body.innerHTML = bodyHtml;
          }

          // Also specifically target style tags in head/body
          const styleTags = clonedDoc.querySelectorAll('style');
          styleTags.forEach(tag => {
            if (tag.innerHTML.match(/(lab|lch|oklab|oklch)\(/)) {
              tag.innerHTML = tag.innerHTML.replace(/(lab|lch|oklab|oklch)\([^)]+\)/gi, '#000000');
            }
          });

          // And inline styles on all elements
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el: any) => {
            const style = el.getAttribute('style');
            if (style && style.match(/(lab|lch|oklab|oklch)\(/)) {
              el.setAttribute('style', style.replace(/(lab|lch|oklab|oklch)\([^)]+\)/gi, '#000000'));
            }

            // Also check computed style properties that might cause issues if they were set via classes
            // This is harder to patch but removing the style attribute helps
          });
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
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error('Failed to generate PDF');
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
}