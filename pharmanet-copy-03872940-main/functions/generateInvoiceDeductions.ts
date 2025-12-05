import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  console.log("🚀 generateInvoiceDeductions called");
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.user_type !== 'employer') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shiftId, pharmacistId } = await req.json();
    console.log("Shift ID:", shiftId);
    console.log("Pharmacist ID:", pharmacistId);

    if (!shiftId || !pharmacistId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify employer owns shift
    const shifts = await base44.entities.Shift.filter({ id: shiftId, created_by: user.email });
    if (shifts.length === 0) {
      return Response.json({ error: 'Shift not found' }, { status: 404 });
    }

    const shift = shifts[0];
    const pharmacists = await base44.asServiceRole.entities.User.filter({ id: pharmacistId });
    if (pharmacists.length === 0) {
      return Response.json({ error: 'Pharmacist not found' }, { status: 404 });
    }
    const pharmacist = pharmacists[0];

    const grossAmount = shift.total_pay;

    // Get tax config
    const taxConfigs = await base44.asServiceRole.entities.TaxConfig.filter({ 
      province: 'ON', 
      tax_year: new Date().getFullYear() 
    });

    if (taxConfigs.length === 0) {
      return Response.json({ error: 'Tax config not found' }, { status: 404 });
    }

    const config = taxConfigs[0];
    const cpp = Math.min(grossAmount * (config.cpp_rate || 0.0595), config.cpp_max || 3754.45);
    const ei = Math.min(grossAmount * (config.ei_rate || 0.0163), config.ei_max || 1049.12);

    let federalTax = 0;
    if (config.federal_brackets && Array.isArray(config.federal_brackets)) {
      for (const bracket of config.federal_brackets) {
        if (grossAmount > bracket.min) {
          federalTax += (Math.min(grossAmount, bracket.max) - bracket.min) * bracket.rate;
        }
      }
    } else {
      federalTax = grossAmount * 0.15;
    }

    let ontarioTax = 0;
    if (config.ontario_brackets && Array.isArray(config.ontario_brackets)) {
      for (const bracket of config.ontario_brackets) {
        if (grossAmount > bracket.min) {
          ontarioTax += (Math.min(grossAmount, bracket.max) - bracket.min) * bracket.rate;
        }
      }
    } else {
      ontarioTax = grossAmount * 0.0505;
    }

    const deductions = {
      cpp: Math.round(cpp * 100) / 100,
      ei: Math.round(ei * 100) / 100,
      federal_tax: Math.round(federalTax * 100) / 100,
      ontario_tax: Math.round(ontarioTax * 100) / 100
    };

    const totalDeductions = deductions.cpp + deductions.ei + deductions.federal_tax + deductions.ontario_tax;
    const netAmount = Math.round((grossAmount - totalDeductions) * 100) / 100;

    // Generate PDF
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('PAYROLL INVOICE', 105, 20, { align: 'center' });

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

    // Pharmacist Info
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('TO:', 120, 62);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(pharmacist.full_name, 120, 68);
    doc.text(pharmacist.email, 120, 74);

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

    let yPos = 168;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');

    doc.text('Gross Amount:', 20, yPos);
    doc.text(`$${grossAmount.toFixed(2)}`, 190, yPos, { align: 'right' });
    yPos += 8;

    // Deductions box
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

    // Net Amount
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

    // Upload PDF
    const pdfBytes = doc.output('arraybuffer');
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const file = new File([blob], `invoice-${shiftId}-${Date.now()}.pdf`, { type: 'application/pdf' });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    // Create invoice record
    const invoice = await base44.asServiceRole.entities.PayrollInvoice.create({
      shift_id: shiftId,
      employer_id: user.id,
      pharmacist_id: pharmacistId,
      gross_amount: grossAmount,
      include_deductions: true,
      deductions: deductions,
      net_amount: netAmount,
      pdf_url: file_url,
      sent_to_pharmacist: false
    });

    return Response.json({ 
      success: true, 
      invoice: invoice,
      pdfUrl: file_url,
      message: `Invoice with deductions. Net: $${netAmount.toFixed(2)}`
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});