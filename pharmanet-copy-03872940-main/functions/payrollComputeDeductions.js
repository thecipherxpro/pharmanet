import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { grossAmount, province = 'ON', taxYear = 2024 } = await req.json();

    if (!grossAmount || grossAmount <= 0) {
      return Response.json({ error: 'Invalid gross amount' }, { status: 400 });
    }

    // Get tax config
    const configs = await base44.asServiceRole.entities.TaxConfig.filter({ province, tax_year: taxYear });
    if (configs.length === 0) {
      return Response.json({ error: 'Tax config not found' }, { status: 404 });
    }

    const config = configs[0];

    // CPP calculation
    const cpp = Math.min(grossAmount * config.cpp_rate, config.cpp_max);

    // EI calculation
    const ei = Math.min(grossAmount * config.ei_rate, config.ei_max);

    // Federal tax calculation (simplified progressive)
    let federalTax = 0;
    for (const bracket of config.federal_brackets) {
      if (grossAmount > bracket.min) {
        const taxableInBracket = Math.min(grossAmount, bracket.max) - bracket.min;
        federalTax += taxableInBracket * bracket.rate;
      }
    }

    // Ontario tax calculation (simplified progressive)
    let ontarioTax = 0;
    for (const bracket of config.ontario_brackets) {
      if (grossAmount > bracket.min) {
        const taxableInBracket = Math.min(grossAmount, bracket.max) - bracket.min;
        ontarioTax += taxableInBracket * bracket.rate;
      }
    }

    const totalDeductions = cpp + ei + federalTax + ontarioTax;
    const netAmount = grossAmount - totalDeductions;

    return Response.json({
      success: true,
      deductions: {
        cpp: Math.round(cpp * 100) / 100,
        ei: Math.round(ei * 100) / 100,
        federal_tax: Math.round(federalTax * 100) / 100,
        ontario_tax: Math.round(ontarioTax * 100) / 100
      },
      total_deductions: Math.round(totalDeductions * 100) / 100,
      net_amount: Math.round(netAmount * 100) / 100
    });

  } catch (error) {
    console.error('Error computing deductions:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});