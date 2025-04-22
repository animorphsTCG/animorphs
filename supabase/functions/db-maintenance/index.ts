
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key (need admin powers)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Parse request to get parameters
    const { action, days_threshold = 30, limit = 500 } = await req.json();
    
    // Execute the maintenance action based on the request
    let result;
    
    switch (action) {
      case 'archive_battles':
        // Archive old battle data
        const { data: archivedCount, error: archiveError } = await supabaseAdmin.rpc(
          'archive_old_battles',
          { days_threshold }
        );
        
        if (archiveError) throw archiveError;
        result = { action, archived_count: archivedCount };
        break;
        
      case 'db_size':
        // Get database size information
        const { data: sizeData, error: sizeError } = await supabaseAdmin.rpc(
          'get_db_size'
        );
        
        if (sizeError) throw sizeError;
        result = { action, size_info: sizeData };
        break;
        
      default:
        throw new Error('Invalid action specified');
    }
    
    // Return success response with results
    return new Response(
      JSON.stringify({ success: true, ...result }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
    
  } catch (error) {
    console.error('DB maintenance error:', error);
    
    // Return error response
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
