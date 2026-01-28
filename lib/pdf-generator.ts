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
      // Configure canvas options with more aggressive CSS handling
      const canvasOptions: any = {
        scale: options.quality || 1.5, // Reduced scale to avoid memory issues
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
        ignoreElements: (element: Element) => {
          // Skip elements that might cause CSS parsing issues
          const tagName = element.tagName.toLowerCase();
          const className = element.className || '';
          
          // Skip certain problematic elements
          if (tagName === 'script' || tagName === 'noscript') return true;
          if (className.includes('no-print')) return true;
          
          return false;
        },
        onclone: (clonedDoc: Document) => {
          try {
            // Remove all external stylesheets to avoid CSS parsing issues
            const links = clonedDoc.querySelectorAll('link[rel="stylesheet"]');
            links.forEach(link => link.remove());

            // Remove all style tags that might have problematic CSS
            const styleTags = clonedDoc.querySelectorAll('style');
            styleTags.forEach(tag => {
              const content = tag.innerHTML;
              // Remove modern CSS features that cause parsing errors
              const cleanContent = content
                .replace(/(lab|lch|oklab|oklch)\([^)]+\)/gi, '#000000')
                .replace(/color-mix\([^)]+\)/gi, '#000000')
                .replace(/var\(--[^)]+\)/gi, '#000000')
                .replace(/@supports[^{]+\{[^}]*\}/gi, '')
                .replace(/backdrop-filter:[^;]+;/gi, '')
                .replace(/filter:[^;]+blur[^;]*;/gi, '');
              
              tag.innerHTML = cleanContent;
            });

            // Clean inline styles on all elements
            const allElements = clonedDoc.querySelectorAll('*');
            allElements.forEach((el: any) => {
              const style = el.getAttribute('style');
              if (style) {
                const cleanStyle = style
                  .replace(/(lab|lch|oklab|oklch)\([^)]+\)/gi, '#000000')
                  .replace(/color-mix\([^)]+\)/gi, '#000000')
                  .replace(/var\(--[^)]+\)/gi, '#000000')
                  .replace(/backdrop-filter:[^;]+;/gi, '')
                  .replace(/filter:[^;]+blur[^;]*;/gi, '');
                
                el.setAttribute('style', cleanStyle);
              }

              // Remove problematic classes
              const classList = el.classList;
              if (classList) {
                // Remove classes that might have problematic CSS
                const problematicClasses = ['glass', 'backdrop-blur', 'holographic', 'gradient-text'];
                problematicClasses.forEach(cls => {
                  if (classList.contains(cls)) {
                    classList.remove(cls);
                  }
                });
              }
            });

            // Add basic styling to ensure readability
            const basicStyle = clonedDoc.createElement('style');
            basicStyle.innerHTML = `
              * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
              body {
                font-family: Arial, sans-serif;
                color: #000000;
                background: #ffffff;
                margin: 0;
                padding: 0;
              }
              .text-white { color: #000000 !important; }
              .bg-transparent { background: #ffffff !important; }
              .shadow-lg, .shadow-md, .shadow-sm { box-shadow: none !important; }
              .border-0 { border: 1px solid #e5e5e5 !important; }
            `;
            clonedDoc.head.appendChild(basicStyle);

          } catch (error) {
            console.warn('Error cleaning CSS for PDF generation:', error);
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
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
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