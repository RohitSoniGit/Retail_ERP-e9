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
      // Configure canvas options based on format
      const canvasOptions = {
        scale: options.quality || 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: options.format === 'thermal' ? 302 : undefined, // 80mm in pixels
        height: undefined,
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