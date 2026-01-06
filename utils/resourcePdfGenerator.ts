import jsPDF from 'jspdf';

// PixenCy brand colors
const BRAND = {
  primary: '#9b87f5',
  secondary: '#7E69AB',
  dark: '#1A1F2C',
  light: '#F1F0FB',
  accent: '#D6BCFA',
};

const addHeader = (doc: jsPDF, title: string) => {
  doc.setFillColor(26, 31, 44);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('PixenCy', 20, 25);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 20, 35);
};

const addFooter = (doc: jsPDF, pageNum: number) => {
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text(`PixenCy Creative Agency | Page ${pageNum}`, 105, 285, { align: 'center' });
};

export const generateBrandGuidelines = () => {
  const doc = new jsPDF();
  
  // Cover page
  addHeader(doc, 'Brand Guidelines');
  
  doc.setTextColor(26, 31, 44);
  doc.setFontSize(16);
  doc.text('Brand Identity Guidelines', 20, 60);
  
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  const intro = 'This document outlines the visual identity standards for PixenCy. Following these guidelines ensures consistency across all brand touchpoints.';
  doc.text(doc.splitTextToSize(intro, 170), 20, 72);
  
  // Logo section
  doc.setFontSize(14);
  doc.setTextColor(26, 31, 44);
  doc.text('1. Logo Usage', 20, 100);
  
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  const logoRules = [
    '• Maintain clear space around the logo equal to the height of the "P"',
    '• Minimum size: 24px height for digital, 10mm for print',
    '• Do not stretch, rotate, or alter the logo proportions',
    '• Use the primary logo on light backgrounds',
    '• Use the reversed logo on dark backgrounds',
  ];
  doc.text(logoRules, 20, 112);
  
  // Typography section
  doc.setFontSize(14);
  doc.setTextColor(26, 31, 44);
  doc.text('2. Typography', 20, 150);
  
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  const typography = [
    'Primary Display Font: Space Grotesk (Headlines, Titles)',
    'Secondary Body Font: Inter (Body copy, UI elements)',
    '',
    'Hierarchy:',
    '• H1: 48-72px / Bold',
    '• H2: 32-40px / Medium',
    '• H3: 24-28px / Medium',
    '• Body: 16px / Regular',
    '• Caption: 12-14px / Regular',
  ];
  doc.text(typography, 20, 162);
  
  // Color section
  doc.setFontSize(14);
  doc.setTextColor(26, 31, 44);
  doc.text('3. Color Palette', 20, 215);
  
  // Draw color swatches
  doc.setFillColor(155, 135, 245);
  doc.rect(20, 225, 30, 20, 'F');
  doc.setFontSize(9);
  doc.text('Primary\n#9B87F5', 55, 232);
  
  doc.setFillColor(126, 105, 171);
  doc.rect(85, 225, 30, 20, 'F');
  doc.text('Secondary\n#7E69AB', 120, 232);
  
  doc.setFillColor(26, 31, 44);
  doc.rect(150, 225, 30, 20, 'F');
  doc.text('Dark\n#1A1F2C', 185, 232);
  
  addFooter(doc, 1);
  
  // Page 2
  doc.addPage();
  addHeader(doc, 'Brand Guidelines');
  
  doc.setFontSize(14);
  doc.setTextColor(26, 31, 44);
  doc.text('4. Imagery & Photography', 20, 60);
  
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  const imagery = [
    '• Use high-quality, authentic photography',
    '• Prefer natural lighting with subtle color grading',
    '• Focus on creativity, innovation, and human connection',
    '• Avoid stock photos that feel generic or staged',
    '• Apply consistent editing style across all images',
  ];
  doc.text(imagery, 20, 72);
  
  doc.setFontSize(14);
  doc.setTextColor(26, 31, 44);
  doc.text('5. Voice & Tone', 20, 110);
  
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  const voice = [
    'Our brand voice is:',
    '• Professional yet approachable',
    '• Creative and inspiring',
    '• Clear and concise',
    '• Confident without being arrogant',
    '',
    'We speak to clients as partners, not customers.',
  ];
  doc.text(voice, 20, 122);
  
  addFooter(doc, 2);
  
  doc.save('pixency-brand-guidelines.pdf');
};

export const generateColorPalette = () => {
  const doc = new jsPDF();
  
  addHeader(doc, 'Color Palette');
  
  doc.setTextColor(26, 31, 44);
  doc.setFontSize(16);
  doc.text('Official Color Palette', 20, 60);
  
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text('Use these colors consistently across all brand materials.', 20, 70);
  
  // Primary Colors
  doc.setFontSize(13);
  doc.setTextColor(26, 31, 44);
  doc.text('Primary Colors', 20, 90);
  
  const colors = [
    { name: 'Primary Purple', hex: '#9B87F5', rgb: 'RGB(155, 135, 245)', r: 155, g: 135, b: 245 },
    { name: 'Secondary Purple', hex: '#7E69AB', rgb: 'RGB(126, 105, 171)', r: 126, g: 105, b: 171 },
    { name: 'Accent Lavender', hex: '#D6BCFA', rgb: 'RGB(214, 188, 250)', r: 214, g: 188, b: 250 },
  ];
  
  colors.forEach((color, i) => {
    const y = 100 + i * 35;
    doc.setFillColor(color.r, color.g, color.b);
    doc.rect(20, y, 50, 25, 'F');
    
    doc.setFontSize(11);
    doc.setTextColor(26, 31, 44);
    doc.text(color.name, 80, y + 10);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`${color.hex}  |  ${color.rgb}`, 80, y + 20);
  });
  
  // Neutral Colors
  doc.setFontSize(13);
  doc.setTextColor(26, 31, 44);
  doc.text('Neutral Colors', 20, 210);
  
  const neutrals = [
    { name: 'Dark Background', hex: '#1A1F2C', rgb: 'RGB(26, 31, 44)', r: 26, g: 31, b: 44 },
    { name: 'Light Background', hex: '#F1F0FB', rgb: 'RGB(241, 240, 251)', r: 241, g: 240, b: 251 },
    { name: 'White', hex: '#FFFFFF', rgb: 'RGB(255, 255, 255)', r: 255, g: 255, b: 255 },
  ];
  
  neutrals.forEach((color, i) => {
    const y = 220 + i * 20;
    doc.setFillColor(color.r, color.g, color.b);
    doc.setDrawColor(200, 200, 200);
    doc.rect(20, y, 30, 12, 'FD');
    
    doc.setFontSize(10);
    doc.setTextColor(26, 31, 44);
    doc.text(`${color.name}: ${color.hex}`, 55, y + 8);
  });
  
  addFooter(doc, 1);
  
  doc.save('pixency-color-palette.pdf');
};

export const generateProjectBriefTemplate = () => {
  const doc = new jsPDF();
  
  addHeader(doc, 'Project Brief Template');
  
  doc.setTextColor(26, 31, 44);
  doc.setFontSize(16);
  doc.text('Project Brief', 20, 60);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Complete this brief to help us understand your project needs.', 20, 70);
  
  const sections = [
    { title: '1. Contact Information', fields: ['Company Name:', 'Contact Person:', 'Email:', 'Phone:'] },
    { title: '2. Project Overview', fields: ['Project Name:', 'Project Type:', 'Target Launch Date:', 'Budget Range:'] },
    { title: '3. Objectives', fields: ['Primary Goal:', 'Secondary Goals:', 'Success Metrics:'] },
  ];
  
  let y = 85;
  sections.forEach(section => {
    doc.setFontSize(12);
    doc.setTextColor(155, 135, 245);
    doc.text(section.title, 20, y);
    y += 8;
    
    section.fields.forEach(field => {
      doc.setFontSize(10);
      doc.setTextColor(26, 31, 44);
      doc.text(field, 20, y);
      doc.setDrawColor(200, 200, 200);
      doc.line(60, y, 190, y);
      y += 10;
    });
    y += 5;
  });
  
  addFooter(doc, 1);
  
  // Page 2
  doc.addPage();
  addHeader(doc, 'Project Brief Template');
  
  const moreSections = [
    { title: '4. Target Audience', fields: ['Demographics:', 'Behaviors:', 'Pain Points:'] },
    { title: '5. Competitors', fields: ['Main Competitors:', 'What They Do Well:', 'Opportunities:'] },
    { title: '6. Deliverables', fields: ['Required Assets:', 'File Formats:', 'Special Requirements:'] },
    { title: '7. Additional Notes', fields: ['References/Inspiration:', 'Constraints:', 'Other Information:'] },
  ];
  
  y = 55;
  moreSections.forEach(section => {
    doc.setFontSize(12);
    doc.setTextColor(155, 135, 245);
    doc.text(section.title, 20, y);
    y += 8;
    
    section.fields.forEach(field => {
      doc.setFontSize(10);
      doc.setTextColor(26, 31, 44);
      doc.text(field, 20, y);
      doc.setDrawColor(200, 200, 200);
      doc.line(70, y, 190, y);
      y += 10;
    });
    y += 5;
  });
  
  addFooter(doc, 2);
  
  doc.save('pixency-project-brief-template.pdf');
};

export const generateCreativeProcessGuide = () => {
  const doc = new jsPDF();
  
  addHeader(doc, 'Creative Process Guide');
  
  doc.setTextColor(26, 31, 44);
  doc.setFontSize(16);
  doc.text('Our Creative Process', 20, 60);
  
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text('How we bring your vision to life, step by step.', 20, 70);
  
  const phases = [
    {
      num: '01',
      title: 'Discovery',
      desc: 'We start by understanding your brand, goals, audience, and competitors. This phase includes stakeholder interviews, market research, and defining project scope.',
      duration: '1-2 weeks'
    },
    {
      num: '02',
      title: 'Strategy',
      desc: 'Based on our findings, we develop a creative strategy that aligns with your business objectives. This includes mood boards, concept development, and initial direction.',
      duration: '1 week'
    },
    {
      num: '03',
      title: 'Design',
      desc: 'Our team creates initial concepts and iterates based on your feedback. We present multiple directions and refine the chosen approach.',
      duration: '2-4 weeks'
    },
    {
      num: '04',
      title: 'Production',
      desc: 'Final assets are produced with meticulous attention to detail. This includes all deliverables across required formats and platforms.',
      duration: '2-3 weeks'
    },
    {
      num: '05',
      title: 'Delivery & Support',
      desc: 'We deliver final files, provide usage guidelines, and offer ongoing support for implementation and future needs.',
      duration: 'Ongoing'
    },
  ];
  
  let y = 85;
  phases.forEach((phase, i) => {
    doc.setFillColor(155, 135, 245);
    doc.circle(25, y + 5, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(phase.num, 22, y + 7);
    
    doc.setTextColor(26, 31, 44);
    doc.setFontSize(12);
    doc.text(phase.title, 40, y + 3);
    
    doc.setTextColor(155, 135, 245);
    doc.setFontSize(9);
    doc.text(phase.duration, 40, y + 10);
    
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(phase.desc, 140);
    doc.text(lines, 40, y + 17);
    
    y += 40;
  });
  
  addFooter(doc, 1);
  
  doc.save('pixency-creative-process-guide.pdf');
};

export const generateCompanyOverview = () => {
  const doc = new jsPDF();
  
  addHeader(doc, 'Company Overview');
  
  doc.setTextColor(26, 31, 44);
  doc.setFontSize(20);
  doc.text('About PixenCy', 20, 60);
  
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  const about = 'PixenCy is a creative agency based in Larnaca, Cyprus, dedicated to bringing brands to life through innovative design, compelling storytelling, and strategic thinking. Founded in 2025, we\'ve helped over 30 clients achieve their creative vision.';
  doc.text(doc.splitTextToSize(about, 170), 20, 72);
  
  // Services
  doc.setFontSize(14);
  doc.setTextColor(26, 31, 44);
  doc.text('Our Services', 20, 105);
  
  const services = [
    'Brand Strategy & Identity',
    'Video Production & Photography',
    'Web Design & Development',
    'Social Media Management',
    'Motion Graphics & Animation',
  ];
  
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  services.forEach((service, i) => {
    doc.setFillColor(155, 135, 245);
    doc.circle(25, 117 + i * 10, 2, 'F');
    doc.text(service, 32, 118 + i * 10);
  });
  
  // Stats
  doc.setFontSize(14);
  doc.setTextColor(26, 31, 44);
  doc.text('By The Numbers', 20, 180);
  
  const stats = [
    { num: '50+', label: 'Projects Completed' },
    { num: '30+', label: 'Happy Clients' },
    { num: '5', label: 'Years Experience' },
    { num: '10+', label: 'Team Members' },
  ];
  
  stats.forEach((stat, i) => {
    const x = 20 + i * 45;
    doc.setFillColor(241, 240, 251);
    doc.roundedRect(x, 190, 40, 35, 3, 3, 'F');
    
    doc.setFontSize(18);
    doc.setTextColor(155, 135, 245);
    doc.text(stat.num, x + 20, 205, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(stat.label, x + 20, 218, { align: 'center' });
  });
  
  // Contact
  doc.setFontSize(14);
  doc.setTextColor(26, 31, 44);
  doc.text('Get In Touch', 20, 245);
  
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text('Email: hello@pixency.com', 20, 255);
  doc.text('Website: www.pixency.com', 20, 263);
  doc.text('Location: Larnaca, Cyprus', 20, 271);
  
  addFooter(doc, 1);
  
  doc.save('pixency-company-overview.pdf');
};
