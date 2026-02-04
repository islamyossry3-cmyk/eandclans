import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if bucket exists
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      throw listError;
    }

    const bucketExists = existingBuckets?.some(bucket => bucket.id === 'game-assets');

    if (bucketExists) {
      return new Response(
        JSON.stringify({ success: true, message: 'Bucket already exists' }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('game-assets', {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/svg+xml',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/webm'
      ]
    });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Bucket created successfully', data }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error setting up storage:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});