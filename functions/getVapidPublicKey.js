Deno.serve(async (req) => {
  try {
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');

    if (!vapidPublicKey) {
      return Response.json({ 
        error: 'VAPID public key not configured' 
      }, { status: 500 });
    }

    return Response.json({ 
      publicKey: vapidPublicKey
    });

  } catch (error) {
    console.error('Error getting VAPID public key:', error);
    return Response.json({ 
      error: error.message || 'Failed to get VAPID public key'
    }, { status: 500 });
  }
});