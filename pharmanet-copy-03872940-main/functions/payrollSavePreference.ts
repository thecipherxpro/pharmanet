import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.user_type !== 'pharmacist') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { 
      method, 
      legal_first_name, 
      legal_last_name, 
      bank_name, 
      institution_number, 
      transit_number, 
      account_number, 
      etransfer_email, 
      auto_deposit_enabled, 
      security_question, 
      security_answer 
    } = payload;

    if (!method || !legal_first_name || !legal_last_name) {
      return Response.json({ error: 'Missing required fields: method, legal names' }, { status: 400 });
    }

    if (method === 'Direct Deposit') {
      if (!bank_name || !institution_number || !transit_number || !account_number) {
        return Response.json({ error: 'Direct Deposit requires bank details' }, { status: 400 });
      }
    }

    if (method === 'Bank E-Transfer') {
      if (!etransfer_email) {
        return Response.json({ error: 'E-Transfer requires email' }, { status: 400 });
      }
      if (!auto_deposit_enabled && (!security_question || !security_answer)) {
        return Response.json({ error: 'Security question/answer required when auto-deposit is disabled' }, { status: 400 });
      }
    }

    const existing = await base44.entities.PayrollPreference.filter({ user_id: user.id });

    const preferenceData = {
      user_id: user.id,
      method,
      legal_first_name,
      legal_last_name,
      bank_name: bank_name || null,
      institution_number: institution_number || null,
      transit_number: transit_number || null,
      account_number: account_number || null,
      etransfer_email: etransfer_email || null,
      auto_deposit_enabled: auto_deposit_enabled || false,
      security_question: security_question || null,
      security_answer: security_answer || null
    };

    let savedPreference;
    if (existing.length > 0) {
      savedPreference = await base44.asServiceRole.entities.PayrollPreference.update(existing[0].id, preferenceData);
    } else {
      savedPreference = await base44.asServiceRole.entities.PayrollPreference.create(preferenceData);
    }

    return Response.json({ 
      success: true, 
      preference: savedPreference 
    });

  } catch (error) {
    console.error('Error saving payroll preference:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});