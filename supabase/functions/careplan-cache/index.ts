// Edge Function: Care Plan Cache Maintenance
// This function is designed to be called by a cron job every ~15 days
// to regenerate expired care plans.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CarePlanRequest {
  action: 'regenerateExpired' | 'regeneratePlant' | 'getStats';
  plantId?: string;
  userId?: string;
  maxAgeDays?: number;
  batchSize?: number;
}

// Initialize Supabase client with service role for cron operations
const initSupabase = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: CarePlanRequest = await req.json();
    const { action } = body;
    
    const supabase = initSupabase();

    switch (action) {
      case 'regenerateExpired': {
        // Cron job: regenerate expired care plans in batch
        const maxAgeDays = body.maxAgeDays || 15;
        const batchSize = body.batchSize || 50;
        
        // Get plants with expired or missing care plans
        const { data: plants, error } = await supabase
          .from('botanica_plants')
          .select('id, name, description, care_needs, user_id, care_plan_generated_at')
          .or(`care_plan_generated_at.is.null,care_plan_generated_at.lt.${new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000).toISOString()}`)
          .limit(batchSize);
        
        if (error) throw error;
        
        if (!plants || plants.length === 0) {
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'No plants need regeneration',
            regenerated: 0 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // For now, we just mark them for regeneration
        // The actual regeneration happens when the user opens the plant detail
        // This is to avoid hitting Gemini API limits with batch operations
        const plantIds = plants.map(p => p.id);
        
        const { error: updateError } = await supabase
          .from('botanica_plants')
          .update({ 
            care_plan_needs_regeneration: true,
            cached_care_plan: null 
          })
          .in('id', plantIds);
        
        if (updateError) throw updateError;
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: `Marked ${plants.length} plants for regeneration`,
          regenerated: plants.length,
          plants: plants.map(p => ({ id: p.id, name: p.name }))
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      case 'regeneratePlant': {
        // Regenerate care plan for a specific plant
        const { plantId, userId } = body;
        
        if (!plantId) {
          return new Response(JSON.stringify({ error: "plantId is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // Mark the plant for regeneration
        const { error } = await supabase
          .from('botanica_plants')
          .update({ 
            care_plan_needs_regeneration: true,
            cached_care_plan: null,
            care_plan_generated_at: null
          })
          .eq('id', plantId)
          .eq('user_id', userId);
        
        if (error) throw error;
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Plant marked for regeneration',
          plantId 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      case 'getStats': {
        // Get statistics about care plan cache
        const { data: stats, error } = await supabase
          .from('botanica_plants')
          .select('care_plan_generated_at, care_plan_needs_regeneration, cached_care_plan', { count: 'exact' });
        
        if (error) throw error;
        
        const total = stats?.length || 0;
        const withCache = stats?.filter(p => p.cached_care_plan !== null).length || 0;
        const needsRegeneration = stats?.filter(p => p.care_plan_needs_regeneration).length || 0;
        const expired = stats?.filter(p => {
          if (!p.care_plan_generated_at) return true;
          const generatedAt = new Date(p.care_plan_generated_at);
          const daysSince = Math.floor((Date.now() - generatedAt.getTime()) / (1000 * 60 * 60 * 24));
          return daysSince > 15;
        }).length || 0;
        
        return new Response(JSON.stringify({
          success: true,
          stats: {
            total,
            withCache,
            needsRegeneration,
            expired,
            upToDate: total - expired - needsRegeneration
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
