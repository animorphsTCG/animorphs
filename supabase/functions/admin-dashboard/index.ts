
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const { action, data } = await req.json();
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token or user not found' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile || !profile.is_admin) {
      return new Response(
        JSON.stringify({ error: 'User is not an admin' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Admin authenticated, handle actions
    let result;
    
    switch (action) {
      case 'fetch_users':
        const { data: users, error: usersError } = await supabaseClient
          .from('profiles')
          .select('*');
          
        if (usersError) throw usersError;
        
        // Get emails separately using the service role
        const { data: emails, error: emailsError } = await supabaseClient
          .rpc('get_user_emails');
          
        if (emailsError) throw emailsError;
        
        const emailMap = new Map(emails.map((user: any) => [user.id, user.email]));
        
        // Get payment statuses
        const { data: paymentData, error: paymentError } = await supabaseClient
          .from('payment_status')
          .select('id, has_paid');
          
        if (paymentError) throw paymentError;
        
        const paymentMap = new Map(paymentData?.map((item: any) => [item.id, item.has_paid]) || []);
        
        result = users.map((profile: any) => ({
          ...profile,
          email: emailMap.get(profile.id) || 'Not available',
          has_paid: paymentMap.get(profile.id) || false
        }));
        break;
        
      case 'fetch_vip_codes':
        const { data: vipCodes, error: vipCodesError } = await supabaseClient
          .from('vip_codes')
          .select('*')
          .order('id', { ascending: true });
          
        if (vipCodesError) throw vipCodesError;
        
        result = vipCodes;
        break;
        
      case 'create_vip_code':
        const { code, max_uses } = data;
        
        const { data: newVipCode, error: createError } = await supabaseClient
          .from('vip_codes')
          .insert({
            code: code.trim(),
            max_uses: parseInt(max_uses),
            current_uses: 0
          })
          .select();
          
        if (createError) throw createError;
        
        result = newVipCode;
        break;
        
      case 'fetch_songs':
        const { data: songs, error: songsError } = await supabaseClient
          .from('songs')
          .select('*')
          .order('title');
          
        if (songsError) throw songsError;
        
        result = songs;
        break;
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    return new Response(
      JSON.stringify({ data: result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Admin dashboard function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
