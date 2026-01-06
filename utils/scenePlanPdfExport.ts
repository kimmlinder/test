import { jsPDF } from 'jspdf';

interface Scene {
  sceneNumber: number;
  title: string;
  duration: string;
  description: string;
  shotType: string;
  location: string;
  actors: string[];
  props: string[];
  audio: string;
  notes: string;
}

interface ScenePlan {
  projectTitle: string;
  totalDuration: string;
  scenes: Scene[];
  overview: string;
}

interface SavedScenePlan {
  id: string;
  project_name: string;
  video_description: string | null;
  video_duration: number | null;
  video_style: string | null;
  scene_plan: ScenePlan;
  created_at: string;
}

export const generateScenePlanPDF = (savedPlan: SavedScenePlan) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const scenePlan = savedPlan.scene_plan;
  
  // Header with gradient background simulation
  doc.setFillColor(109, 40, 217); // Violet-600
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(scenePlan.projectTitle || savedPlan.project_name, 20, 22);
  
  // Subtitle info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Duration: ${scenePlan.totalDuration} | ${scenePlan.scenes.length} Scenes`, 20, 32);
  
  doc.setTextColor(0, 0, 0);
  
  let yPosition = 55;
  
  // Project Details Box
  doc.setFillColor(249, 250, 251); // Gray-50
  doc.roundedRect(15, yPosition - 5, pageWidth - 30, 45, 3, 3, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Project Details', 20, yPosition + 5);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  
  yPosition += 15;
  doc.text(`Created: ${new Date(savedPlan.created_at).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, 20, yPosition);
  
  yPosition += 8;
  if (savedPlan.video_style) {
    doc.text(`Style: ${savedPlan.video_style}`, 20, yPosition);
    yPosition += 8;
  }
  
  if (savedPlan.video_duration) {
    doc.text(`Target Duration: ${savedPlan.video_duration} seconds`, 20, yPosition);
  }
  
  yPosition += 20;
  doc.setTextColor(0, 0, 0);
  
  // Overview Section
  if (scenePlan.overview) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Overview', 20, yPosition);
    yPosition += 8;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60);
    
    const overviewLines = doc.splitTextToSize(scenePlan.overview, pageWidth - 40);
    doc.text(overviewLines, 20, yPosition);
    yPosition += overviewLines.length * 5 + 15;
    
    doc.setTextColor(0);
  }
  
  // Scenes Header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Scene Breakdown', 20, yPosition);
  yPosition += 10;
  
  // Scenes
  scenePlan.scenes.forEach((scene, index) => {
    // Check if we need a new page
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Scene box
    doc.setFillColor(245, 243, 255); // Violet-50
    const sceneBoxHeight = calculateSceneBoxHeight(scene);
    doc.roundedRect(15, yPosition - 3, pageWidth - 30, sceneBoxHeight, 2, 2, 'F');
    
    // Scene number badge
    doc.setFillColor(109, 40, 217); // Violet-600
    doc.circle(25, yPosition + 8, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(String(scene.sceneNumber), 23, yPosition + 10);
    
    // Scene title
    doc.setTextColor(0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(scene.title, 35, yPosition + 10);
    
    // Duration & Shot type on right
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`${scene.duration} | ${scene.shotType}`, pageWidth - 55, yPosition + 10);
    
    yPosition += 18;
    
    // Description
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60);
    const descLines = doc.splitTextToSize(scene.description, pageWidth - 60);
    doc.text(descLines, 35, yPosition);
    yPosition += descLines.length * 4 + 5;
    
    // Location
    if (scene.location) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0);
      doc.text('Location: ', 35, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60);
      doc.text(scene.location, 58, yPosition);
      yPosition += 6;
    }
    
    // Actors
    if (scene.actors && scene.actors.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0);
      doc.text('Actors: ', 35, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60);
      doc.text(scene.actors.join(', '), 55, yPosition);
      yPosition += 6;
    }
    
    // Props
    if (scene.props && scene.props.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0);
      doc.text('Props: ', 35, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60);
      doc.text(scene.props.join(', '), 52, yPosition);
      yPosition += 6;
    }
    
    // Audio
    if (scene.audio) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0);
      doc.text('Audio: ', 35, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60);
      doc.text(scene.audio, 53, yPosition);
      yPosition += 6;
    }
    
    // Notes
    if (scene.notes) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0);
      doc.text('Notes: ', 35, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60);
      const noteLines = doc.splitTextToSize(scene.notes, pageWidth - 80);
      doc.text(noteLines, 53, yPosition);
      yPosition += noteLines.length * 4;
    }
    
    yPosition += 12;
  });
  
  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount} | Generated by Scene Plan Generator`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  // Save
  const filename = `scene-plan-${savedPlan.project_name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};

function calculateSceneBoxHeight(scene: Scene): number {
  let height = 25; // Base height for title
  
  // Description (approximate)
  const descLength = scene.description?.length || 0;
  height += Math.ceil(descLength / 80) * 4 + 5;
  
  if (scene.location) height += 6;
  if (scene.actors && scene.actors.length > 0) height += 6;
  if (scene.props && scene.props.length > 0) height += 6;
  if (scene.audio) height += 6;
  if (scene.notes) {
    const noteLength = scene.notes.length || 0;
    height += Math.ceil(noteLength / 60) * 4;
  }
  
  return Math.max(height, 35);
}
