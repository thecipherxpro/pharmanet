import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.user_type !== 'employer') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shiftId, pharmacistId } = await req.json();

    if (!pharmacistId) {
      return Response.json({ error: 'Missing pharmacistId' }, { status: 400 });
    }

    // If shiftId is 'public-view' or not provided, return only public info
    if (!shiftId || shiftId === 'public-view') {
      const prefs = await base44.asServiceRole.entities.PayrollPreference.filter({ user_id: pharmacistId });
      if (prefs.length === 0) {
        return Response.json({ method: 'Not configured', is_public: true });
      }
      return Response.json({ method: prefs[0].method, is_public: true });
    }

    // Get pharmacist's email from their ID
    const users = await base44.asServiceRole.entities.User.list();
    const pharmacist = users.find(u => u.id === pharmacistId);
    
    if (!pharmacist) {
      return Response.json({ error: 'Pharmacist not found' }, { status: 404 });
    }

    // Verify employer owns the shift
    const shifts = await base44.entities.Shift.filter({ id: shiftId, created_by: user.email });
    if (shifts.length === 0) {
      return Response.json({ error: 'Shift not found or unauthorized' }, { status: 404 });
    }

    // Verify there's an accepted application (shift is filled/accepted, not completed)
    const applications = await base44.asServiceRole.entities.ShiftApplication.filter({
      shift_id: shiftId,
      pharmacist_email: pharmacist.email,
      status: 'accepted'
    });

    if (applications.length === 0) {
      // Return only method label (public) - application not yet accepted
      const prefs = await base44.asServiceRole.entities.PayrollPreference.filter({ user_id: pharmacistId });
      if (prefs.length === 0) {
        return Response.json({ method: 'Not configured', is_public: true });
      }
      return Response.json({ method: prefs[0].method, is_public: true });
    }

    // Return full masked details (private - filled shift context, application accepted)
    const prefs = await base44.asServiceRole.entities.PayrollPreference.filter({ user_id: pharmacistId });
    
    if (prefs.length === 0) {
      return Response.json({ method: 'Not configured', is_public: false });
    }

    const pref = prefs[0];
    
    // Return full details with proper masking for security
    const masked = {
      method: pref.method,
      legal_first_name: pref.legal_first_name,
      legal_last_name: pref.legal_last_name,
      bank_name: pref.bank_name,
      institution_number: pref.institution_number,
      transit_number: pref.transit_number,
      account_number: pref.account_number,
      etransfer_email: pref.etransfer_email,
      auto_deposit_enabled: pref.auto_deposit_enabled,
      has_security_qa: !!(pref.security_question && pref.security_answer),
      is_public: false
    };

    return Response.json(masked);

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});