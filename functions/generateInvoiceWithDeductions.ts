import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  console.log("🚀 generateInvoiceWithDeductions called");
  
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
    if (config.federal_brackets) {
      for (const bracket of config.federal_brackets) {
        if (grossAmount > bracket.min) {
          federalTax += (Math.min(grossAmount, bracket.max) - bracket.min) * bracket.rate;
        }
      }
    } else {
      federalTax = grossAmount * 0.15;
    }

    let ontarioTax = 0;
    if (config.ontario_brackets) {
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
    doc.text(`Invoice Date: ${new Date().toLocaleDateString('en-US')}`, 20, 35);
    doc.text(`Shift Date: ${new Date(shift.shift_date).toLocaleDateString('en-US')}`, 20, 41);

    // Employer info
    doc.setFont(undefined, 'bold');
    doc.text('FROM:', 20, 62);
    doc.setFont(undefined, 'normal');
    doc.text(user.company_name || user.full_name || 'Employer', 20, 68);
    doc.text(user.email, 20, 74);

    // Pharmacist info
    doc.setFont(undefined, 'bold');
    doc.text('TO:', 120, 62);
    doc.setFont(undefined, 'normal');
    doc.text(pharmacist.full_name, 120, 68);
    doc.text(pharmacist.email, 120, 74);

    // Shift details
    doc.setFont(undefined, 'bold');
    doc.text('SHIFT DETAILS', 20, 100);
    doc.setFont(undefined, 'normal');
    doc.text(`Location: ${shift.pharmacy_name}`, 20, 108);
    doc.text(`Duration: ${shift.total_hours} hours @ $${shift.hourly_rate}/hr`, 20, 114);

    // Payment summary
    doc.setFont(undefined, 'bold');
    doc.text('PAYMENT SUMMARY', 20, 140);
    doc.setFont(undefined, 'normal');
    
    doc.text('Gross Amount:', 20, 150);
    doc.text(`$${grossAmount.toFixed(2)}`, 190, 150, { align: 'right' });

    // Deductions
    doc.text('Deductions:', 20, 160);
    doc.text(`  CPP: -$${deductions.cpp.toFixed(2)}`, 25, 166);
    doc.text(`  EI: -$${deductions.ei.toFixed(2)}`, 25, 172);
    doc.text(`  Federal Tax: -$${deductions.federal_tax.toFixed(2)}`, 25, 178);
    doc.text(`  Ontario Tax: -$${deductions.ontario_tax.toFixed(2)}`, 25, 184);

    doc.setFont(undefined, 'bold');
    doc.text('NET AMOUNT:', 20, 200);
    doc.text(`$${netAmount.toFixed(2)}`, 190, 200, { align: 'right' });

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