import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return Response.json({ 
        error: 'File size exceeds 5MB limit' 
      }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ 
        error: 'Invalid file type. Only PDF, JPG, and PNG are allowed' 
      }, { status: 400 });
    }

    // Upload file using Base44 Core integration
    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    return Response.json({ 
      success: true,
      file_url: file_url
    });

  } catch (error) {
    console.error('Error uploading certificate:', error);
    return Response.json({ 
      error: error.message || 'Failed to upload file' 
    }, { status: 500 });
  }
});