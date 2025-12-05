import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.user_type !== 'employer') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shiftId, pharmacistId, includeDeductions = false } = await req.json();

    if (!shiftId || !pharmacistId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify employer owns shift
    const shifts = await base44.entities.Shift.filter({ id: shiftId, created_by: user.email });
    if (shifts.length === 0) {
      return Response.json({ error: 'Shift not found or unauthorized' }, { status: 404 });
    }

    const shift = shifts[0];

    // Verify pharmacist is accepted for this shift
    const applications = await base44.asServiceRole.entities.ShiftApplication.filter({
      shift_id: shiftId,
      status: 'accepted'
    });

    if (applications.length === 0) {
      return Response.json({ error: 'No accepted application found for this shift' }, { status: 404 });
    }

    // Get pharmacist details
    const pharmacists = await base44.asServiceRole.entities.User.filter({ id: pharmacistId });
    if (pharmacists.length === 0) {
      return Response.json({ error: 'Pharmacist not found' }, { status: 404 });
    }
    const pharmacist = pharmacists[0];

    // Calculate gross amount from shift
    const grossAmount = shift.total_pay;

    let deductions = null;
    let netAmount = grossAmount;

    if (includeDeductions) {
      // Get tax config first
      const taxConfigs = await base44.asServiceRole.entities.TaxConfig.filter({ 
        province: 'ON', 
        tax_year: new Date().getFullYear() 
      });

      if (taxConfigs.length === 0) {
        return Response.json({ error: 'Tax configuration not found' }, { status: 404 });
      }

      const config = taxConfigs[0];

      // Calculate deductions
      const cpp = Math.min(grossAmount * config.cpp_rate, config.cpp_max);
      const ei = Math.min(grossAmount * config.ei_rate, config.ei_max);

      // Federal tax calculation
      let federalTax = 0;
      for (const bracket of config.federal_brackets) {
        if (grossAmount > bracket.min) {
          const taxableInBracket = Math.min(grossAmount, bracket.max) - bracket.min;
          federalTax += taxableInBracket * bracket.rate;
        }
      }

      // Ontario tax calculation
      let ontarioTax = 0;
      for (const bracket of config.ontario_brackets) {
        if (grossAmount > bracket.min) {
          const taxableInBracket = Math.min(grossAmount, bracket.max) - bracket.min;
          ontarioTax += taxableInBracket * bracket.rate;
        }
      }

      deductions = {
        cpp: Math.round(cpp * 100) / 100,
        ei: Math.round(ei * 100) / 100,
        federal_tax: Math.round(federalTax * 100) / 100,
        ontario_tax: Math.round(ontarioTax * 100) / 100
      };

      const totalDeductions = deductions.cpp + deductions.ei + deductions.federal_tax + deductions.ontario_tax;
      netAmount = Math.round((grossAmount - totalDeductions) * 100) / 100;
    }

    // Generate PDF
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

    // Line
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

    // Shift Details Section
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

    // Payment Summary Section
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 148, 190, 148);

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('PAYMENT SUMMARY', 20, 158);

    let yPos = 168;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');

    // Gross Amount
    doc.text('Gross Amount:', 20, yPos);
    doc.text(`$${grossAmount.toFixed(2)}`, 190, yPos, { align: 'right' });
    yPos += 8;

    if (includeDeductions && deductions) {
      // Draw deductions box
      doc.setDrawColor(255, 200, 100);
      doc.setFillColor(255, 250, 240);
      doc.rect(15, yPos - 3, 180, 38, 'FD');

      doc.setFont(undefined, 'bold');
      doc.text('Tax Deductions:', 20, yPos + 2);
      doc.setFont(undefined, 'normal');
      yPos += 8;

      doc.text('  CPP Contribution:', 25, yPos);
      doc.text(`-$${deductions.cpp.toFixed(2)}`, 190, yPos, { align: 'right' });
      yPos += 6;

      doc.text('  EI Premium:', 25, yPos);
      doc.text(`-$${deductions.ei.toFixed(2)}`, 190, yPos, { align: 'right' });
      yPos += 6;

      doc.text('  Federal Income Tax:', 25, yPos);
      doc.text(`-$${deductions.federal_tax.toFixed(2)}`, 190, yPos, { align: 'right' });
      yPos += 6;

      doc.text('  Ontario Provincial Tax:', 25, yPos);
      doc.text(`-$${deductions.ontario_tax.toFixed(2)}`, 190, yPos, { align: 'right' });
      yPos += 10;
    }

    // Net Amount - Highlighted
    doc.setDrawColor(100, 150, 255);
    doc.setFillColor(240, 245, 255);
    doc.rect(15, yPos - 3, 180, 12, 'FD');

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('NET AMOUNT PAYABLE:', 20, yPos + 4);
    doc.text(`$${netAmount.toFixed(2)}`, 190, yPos + 4, { align: 'right' });

    // Footer
    yPos += 20;
    doc.setFontSize(8);
    doc.setFont(undefined, 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('This invoice is generated electronically and serves as proof of payment.', 105, yPos, { align: 'center' });
    doc.text('Please retain for your records.', 105, yPos + 4, { align: 'center' });

    // Generate PDF buffer
    const pdfBytes = doc.output('arraybuffer');
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const file = new File([blob], `invoice-${shiftId}-${Date.now()}.pdf`, { type: 'application/pdf' });

    // Upload to storage
    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    // Create invoice record
    const invoice = await base44.asServiceRole.entities.PayrollInvoice.create({
      shift_id: shiftId,
      employer_id: user.id,
      pharmacist_id: pharmacistId,
      gross_amount: grossAmount,
      include_deductions: includeDeductions,
      deductions: deductions,
      net_amount: netAmount,
      pdf_url: file_url,
      sent_to_pharmacist: false
    });

    return Response.json({ 
      success: true, 
      invoice: invoice,
      pdf_url: file_url,
      message: includeDeductions 
        ? `Invoice generated with deductions. Net: $${netAmount.toFixed(2)}`
        : `Invoice generated without deductions. Total: $${netAmount.toFixed(2)}`
    });

  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    console.error('Error stack:', error.stack);
    return Response.json({ 
      error: error.message || 'Failed to generate invoice',
      details: error.stack
    }, { status: 500 });
  }
});