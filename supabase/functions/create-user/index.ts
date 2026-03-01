import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejo de CORS para que tu frontend web pueda llamar a la función sin bloqueos
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Iniciamos el cliente de Supabase con permisos de administrador (Service Role)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Obtenemos los datos que nos enviará tu frontend
    const { email, password, nombre, rol, formacion_lic, formacion_mtr, formacion_doc } = await req.json()

    // 3. Creamos el usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // Para que no pida confirmar el correo por ahora
    })

    if (authError) throw authError

    // 4. Insertamos su información en tu tabla pública 'perfiles'
    const { error: profileError } = await supabaseAdmin.from('perfiles').upsert({
      id: authData.user.id, // Vinculamos el ID secreto con tu tabla
      nombre: nombre,
      email: email,
      rol: rol,
      formacion_lic: formacion_lic,
      formacion_mtr: formacion_mtr,
      formacion_doc: formacion_doc
    })

    if (profileError) throw profileError

    // 5. Respondemos con éxito
    return new Response(JSON.stringify({ success: true, user: authData.user }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    // Si algo falla, devolvemos el error
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})