import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { apiUrl, login, password, token, year } = await req.json();

    if (!apiUrl || !login || !password || !token || !year) {
      return new Response(
        JSON.stringify({ error: "Parâmetros obrigatórios ausentes." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
    let body = "";
    body += `--${boundary}\r\nContent-Disposition: form-data; name="login"\r\n\r\n${login}\r\n`;
    body += `--${boundary}\r\nContent-Disposition: form-data; name="password"\r\n\r\n${password}\r\n`;
    body += `--${boundary}\r\nContent-Disposition: form-data; name="token"\r\n\r\n${token}\r\n`;
    body += `--${boundary}--\r\n`;

    const targetUrl = `${apiUrl}/api/centralapp/declaracao/quitacao/${year}/`;

    const sgpResponse = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body: body,
    });

    const contentType = sgpResponse.headers.get("content-type") || "";

    if (sgpResponse.ok && contentType.includes("application/pdf")) {
      const arrayBuffer = await sgpResponse.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < uint8Array.byteLength; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64 = btoa(binary);

      return new Response(
        JSON.stringify({
          success: true,
          pdfBase64: `data:application/pdf;base64,${base64}`,
          year,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      const text = await sgpResponse.text();
      return new Response(
        JSON.stringify({
          success: false,
          status: sgpResponse.status,
          message: text,
        }),
        { status: sgpResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
