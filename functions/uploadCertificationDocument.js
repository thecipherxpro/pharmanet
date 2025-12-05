import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Upload file using Base44 integration
    const { file_url } = await base44.integrations.Core.UploadFile({
      file: file
    });

    return Response.json({ 
      success: true, 
      file_url: file_url 
    });

  } catch (error) {
    console.error('Error uploading certification document:', error);
    return Response.json({ 
      error: error.message || 'Failed to upload document' 
    }, { status: 500 });
  }
});