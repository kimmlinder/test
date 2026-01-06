import jsPDF from 'jspdf';

interface ProjectBriefData {
  projectName: string;
  mediaType: string;
  deadline: string;
  description: string;
  brief: string;
  mockups: string[];
  messageCount: number;
  createdAt: Date;
}

export async function exportProjectBriefToPDF(data: ProjectBriefData): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  // Helper function to add text with word wrap
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number = 6) => {
    const lines = pdf.splitTextToSize(text, maxWidth);
    lines.forEach((line: string) => {
      if (y > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(line, x, y);
      y += lineHeight;
    });
    return y;
  };

  // Header background
  pdf.setFillColor(20, 20, 25);
  pdf.rect(0, 0, pageWidth, 45, 'F');

  // Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.setTextColor(255, 255, 255);
  pdf.text('PROJECT BRIEF', margin, 28);

  // Project name subtitle
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(180, 180, 180);
  pdf.text(data.projectName, margin, 38);

  yPos = 60;

  // Project Details Section
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 30, 35);
  pdf.text('Project Details', margin, yPos);
  yPos += 10;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(80, 80, 85);

  // Details grid
  const details = [
    { label: 'Media Type', value: data.mediaType || 'Not specified' },
    { label: 'Deadline', value: data.deadline ? new Date(data.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified' },
    { label: 'Created', value: data.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
    { label: 'AI Interactions', value: `${data.messageCount} messages` },
  ];

  details.forEach((detail) => {
    pdf.setFont('helvetica', 'bold');
    pdf.text(detail.label + ':', margin, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(detail.value, margin + 35, yPos);
    yPos += 7;
  });

  yPos += 10;

  // Initial Description (if provided)
  if (data.description) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 30, 35);
    pdf.text('Initial Description', margin, yPos);
    yPos += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 65);
    yPos = addWrappedText(data.description, margin, yPos, contentWidth);
    yPos += 10;
  }

  // AI Generated Brief
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 30, 35);
  pdf.text('AI-Generated Brief', margin, yPos);
  yPos += 8;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60, 60, 65);
  yPos = addWrappedText(data.brief || 'No brief generated.', margin, yPos, contentWidth);

  // Add mockups if available
  if (data.mockups.length > 0) {
    // Start mockups on a new page
    pdf.addPage();
    yPos = margin;

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 30, 35);
    pdf.text('Generated Mockups', margin, yPos);
    yPos += 15;

    // Add mockups in a grid (2 per row)
    const mockupWidth = (contentWidth - 10) / 2;
    const mockupHeight = mockupWidth * 0.75;

    for (let i = 0; i < data.mockups.length; i++) {
      const xPos = margin + (i % 2) * (mockupWidth + 10);
      
      // Check if we need a new page
      if (yPos + mockupHeight > pageHeight - margin) {
        pdf.addPage();
        yPos = margin;
      }

      try {
        // Add image (assuming base64)
        const imgData = data.mockups[i];
        if (imgData.startsWith('data:image')) {
          pdf.addImage(imgData, 'PNG', xPos, yPos, mockupWidth, mockupHeight);
        }
      } catch (error) {
        // If image fails, add a placeholder
        pdf.setFillColor(240, 240, 245);
        pdf.rect(xPos, yPos, mockupWidth, mockupHeight, 'F');
        pdf.setFontSize(8);
        pdf.setTextColor(120, 120, 125);
        pdf.text('Mockup unavailable', xPos + mockupWidth / 2 - 15, yPos + mockupHeight / 2);
      }

      // Move to next row after every 2 images
      if (i % 2 === 1) {
        yPos += mockupHeight + 10;
      }
    }
  }

  // Footer on last page
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 155);
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2 - 10, pageHeight - 10);
    pdf.text('Generated with AI Media Creator', margin, pageHeight - 10);
  }

  // Save the PDF
  pdf.save(`${data.projectName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-brief.pdf`);
}
