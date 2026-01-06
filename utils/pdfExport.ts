import { jsPDF } from 'jspdf';

interface OrderForPDF {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  tracking_number: string | null;
  shipping_address?: string | null;
  customer_name?: string | null;
}

interface OrderItemForPDF {
  quantity: number;
  price_at_purchase: number;
  product: {
    name: string;
  };
}

export const generateOrderHistoryPDF = (orders: OrderForPDF[]) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Order History', 20, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, 20, 35);
  
  doc.setTextColor(0);
  
  let yPosition = 50;
  
  orders.forEach((order, index) => {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Order header
    doc.setFillColor(245, 245, 245);
    doc.rect(15, yPosition - 5, pageWidth - 30, 25, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Order #${order.id.slice(0, 8)}`, 20, yPosition + 5);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`, 20, yPosition + 13);
    
    // Date and amount on the right
    doc.setFont('helvetica', 'bold');
    doc.text(`€${order.total_amount.toFixed(2)}`, pageWidth - 40, yPosition + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(order.created_at).toLocaleDateString(), pageWidth - 40, yPosition + 13);
    
    yPosition += 30;
    
    // Tracking number if exists
    if (order.tracking_number) {
      doc.setFontSize(9);
      doc.text(`Tracking: ${order.tracking_number}`, 20, yPosition);
      yPosition += 8;
    }
    
    yPosition += 10;
  });
  
  // Summary
  const totalAmount = orders.reduce((sum, o) => sum + o.total_amount, 0);
  
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }
  
  doc.setDrawColor(200);
  doc.line(15, yPosition, pageWidth - 15, yPosition);
  yPosition += 10;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 20, yPosition);
  yPosition += 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Orders: ${orders.length}`, 20, yPosition);
  yPosition += 7;
  doc.text(`Total Amount: €${totalAmount.toFixed(2)}`, 20, yPosition);
  
  // Save
  doc.save(`order-history-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateSingleOrderPDF = (
  order: OrderForPDF, 
  items: OrderItemForPDF[]
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(`Order #${order.id.slice(0, 8)}`, 20, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 35);
  doc.setTextColor(0);
  
  let yPosition = 50;
  
  // Order details
  doc.setFillColor(245, 245, 245);
  doc.rect(15, yPosition - 5, pageWidth - 30, 40, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Order Details', 20, yPosition + 5);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 20, yPosition + 15);
  doc.text(`Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`, 20, yPosition + 23);
  if (order.tracking_number) {
    doc.text(`Tracking: ${order.tracking_number}`, 20, yPosition + 31);
  }
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`€${order.total_amount.toFixed(2)}`, pageWidth - 40, yPosition + 20);
  
  yPosition += 50;
  
  // Items
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Items', 20, yPosition);
  yPosition += 10;
  
  items.forEach((item) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`${item.product.name} x${item.quantity}`, 20, yPosition);
    doc.text(`€${(item.price_at_purchase * item.quantity).toFixed(2)}`, pageWidth - 40, yPosition);
    yPosition += 8;
  });
  
  // Total
  yPosition += 5;
  doc.setDrawColor(200);
  doc.line(15, yPosition, pageWidth - 15, yPosition);
  yPosition += 10;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Total', 20, yPosition);
  doc.text(`€${order.total_amount.toFixed(2)}`, pageWidth - 40, yPosition);
  
  // Shipping address
  if (order.shipping_address) {
    yPosition += 20;
    doc.setFontSize(11);
    doc.text('Shipping Address', 20, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lines = order.shipping_address.split('\n');
    lines.forEach(line => {
      doc.text(line, 20, yPosition);
      yPosition += 6;
    });
  }
  
  // Save
  doc.save(`order-${order.id.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.pdf`);
};