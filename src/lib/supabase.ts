
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://orrmjadspjsbdfnhnkgu.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ycm1qYWRzcGpzYmRmbmhua2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1ODQ0MTksImV4cCI6MjA1OTE2MDQxOX0.p8Du23Cz-I-ja9yc0howqrtboJxBZp9muuFY4xVSPoU";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
