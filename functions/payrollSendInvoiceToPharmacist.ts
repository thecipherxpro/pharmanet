import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.user_type !== 'employer') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoiceId } = await req.json();

    if (!invoiceId) {
      return Response.json({ error: 'Invoice ID required' }, { status: 400 });
    }

    // Get invoice and verify ownership
    const invoices = await base44.entities.PayrollInvoice.filter({ id: invoiceId, employer_id: user.id });
    if (invoices.length === 0) {
      return Response.json({ error: 'Invoice not found or unauthorized' }, { status: 404 });
    }

    const invoice = invoices[0];

    // Get pharmacist email
    const pharmacists = await base44.asServiceRole.entities.User.filter({ id: invoice.pharmacist_id });
    if (pharmacists.length === 0) {
      return Response.json({ error: 'Pharmacist not found' }, { status: 404 });
    }

    const pharmacist = pharmacists[0];

    // Send email
    await base44.integrations.Core.SendEmail({
      from_name: user.company_name || user.full_name,
      to: pharmacist.email,
      subject: 'Payroll Invoice from ' + (user.company_name || user.full_name),
      body: `
Hello ${pharmacist.full_name},

Your payroll invoice is ready to view.

Invoice Details:
- Gross Amount: $${invoice.gross_amount.toFixed(2)}
- Net Amount: $${invoice.net_amount.toFixed(2)}

View/Download Invoice: ${invoice.pdf_url}

Thank you,
${user.company_name || user.full_name}
      `.trim()
    });

    // Update invoice
    await base44.entities.PayrollInvoice.update(invoiceId, { sent_to_pharmacist: true });

    return Response.json({ success: true });

  } catch (error) {
    console.error('Error sending invoice:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});