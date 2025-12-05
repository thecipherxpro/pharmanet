import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  console.log("🚀 generateInvoicePDF (NO DEDUCTIONS) called");
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.user_type !== 'employer') {
      console.error("❌ Unauthorized access attempt");
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shiftId, pharmacistId } = await req.json();

    console.log("📋 Request Parameters:");
    console.log("  - Shift ID:", shiftId);
    console.log("  - Pharmacist ID:", pharmacistId);

    if (!shiftId || !pharmacistId) {
      console.error("❌ Missing required fields");
      return Response.json({ error: 'Missing shiftId or pharmacistId' }, { status: 400 });
    }

    // Verify employer owns shift
    const shifts = await base44.entities.Shift.filter({ id: shiftId, created_by: user.email });
    if (shifts.length === 0) {
      console.error("❌ Shift not found or unauthorized");
      return Response.json({ error: 'Shift not found or unauthorized' }, { status: 404 });
    }

    const shift = shifts[0];
    console.log("✅ Shift found:", shift.pharmacy_name, "Total Pay:", shift.total_pay);

    // Verify pharmacist is accepted for this shift
    const applications = await base44.asServiceRole.entities.ShiftApplication.filter({
      shift_id: shiftId,
      status: 'accepted'
    });

    if (applications.length === 0) {
      console.error("❌ No accepted application found");
      return Response.json({ error: 'No accepted application found for this shift' }, { status: 404 });
    }

    // Get pharmacist details
    const pharmacists = await base44.asServiceRole.entities.User.filter({ id: pharmacistId });
    if (pharmacists.length === 0) {
      console.error("❌ Pharmacist not found");
      return Response.json({ error: 'Pharmacist not found' }, { status: 404 });
    }
    const pharmacist = pharmacists[0];
    console.log("✅ Pharmacist found:", pharmacist.full_name);

    const grossAmount = shift.total_pay;
    const netAmount = grossAmount;

    // Generate PDF
    console.log("📄 Generating PDF (no deductions)...");
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('PAYROLL INVOICE', 105, 20, { align: 'center' });

    // Invoice Info
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Invoice Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 20, 35);
    doc.text(`Shift Date: ${new Date(shift.shift_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 20, 41);
    doc.text(`Invoice #: ${Date.now().toString().slice(-8)}`, 20, 47);

    doc.setDrawColor(200, 200, 200);
    doc.line(20, 52, 190, 52);

    // Employer Info
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('FROM:', 20, 62);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(user.company_name || user.full_name || 'Employer', 20, 68);
    doc.text(user.email, 20, 74);
    if (user.business_address) {
      doc.text(user.business_address, 20, 80);
    }

    // Pharmacist Info
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('TO:', 120, 62);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(pharmacist.full_name, 120, 68);
    doc.text(pharmacist.email, 120, 74);
    if (pharmacist.license_number) {
      doc.text(`License: ${pharmacist.license_number}`, 120, 80);
    }

    // Shift Details
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 90, 190, 90);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('SHIFT DETAILS', 20, 100);

    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Location: ${shift.pharmacy_name}`, 20, 108);
    doc.text(`Address: ${shift.pharmacy_address}, ${shift.pharmacy_city}`, 20, 114);
    doc.text(`Date: ${new Date(shift.shift_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 20, 120);
    doc.text(`Time: ${shift.start_time} - ${shift.end_time}`, 20, 126);
    doc.text(`Duration: ${shift.total_hours} hours`, 20, 132);
    doc.text(`Hourly Rate: $${shift.hourly_rate.toFixed(2)}/hr`, 20, 138);

    // Payment Summary
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 148, 190, 148);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('PAYMENT SUMMARY', 20, 158);

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Gross Amount:', 20, 168);
    doc.text(`$${grossAmount.toFixed(2)}`, 190, 168, { align: 'right' });

    // Total - Highlighted
    doc.setDrawColor(100, 150, 255);
    doc.setFillColor(240, 245, 255);
    doc.rect(15, 173, 180, 12, 'FD');
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('TOTAL AMOUNT PAYABLE:', 20, 180);
    doc.text(`$${netAmount.toFixed(2)}`, 190, 180, { align: 'right' });

    // Footer
    doc.setFontSize(8);
    doc.setFont(undefined, 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('This invoice is generated electronically and serves as proof of payment.', 105, 195, { align: 'center' });
    doc.text('Please retain for your records.', 105, 199, { align: 'center' });

    // Upload PDF
    console.log("📦 Converting PDF to buffer...");
    const pdfBytes = doc.output('arraybuffer');
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const file = new File([blob], `invoice-${shiftId}-${Date.now()}.pdf`, { type: 'application/pdf' });

    console.log("☁️ Uploading PDF to storage...");
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    console.log("✅ PDF uploaded:", file_url);

    // Create invoice record
    console.log("💾 Creating invoice record...");
    const invoice = await base44.asServiceRole.entities.PayrollInvoice.create({
      shift_id: shiftId,
      employer_id: user.id,
      pharmacist_id: pharmacistId,
      gross_amount: grossAmount,
      include_deductions: false,
      deductions: null,
      net_amount: netAmount,
      pdf_url: file_url,
      sent_to_pharmacist: false
    });

    console.log("✅ Invoice created successfully:", invoice.id);

    return Response.json({ 
      success: true, 
      invoice: invoice,
      pdfUrl: file_url,
      message: `Invoice generated without deductions. Total: $${netAmount.toFixed(2)}`
    });

  } catch (error) {
    console.error('❌ ERROR in generateInvoicePDF:', error.message);
    console.error('Stack:', error.stack);
    return Response.json({ 
      error: error.message || 'Failed to generate invoice'
    }, { status: 500 });
  }
});