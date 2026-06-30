/**
 * Cloudflare Pages Function
 * Route: /api/portfolio/:teacherId
 *
 * GET  /api/portfolio/miss-amy  → returns saved portfolio JSON
 * PUT  /api/portfolio/miss-amy  → saves portfolio JSON
 *
 * Binds to a KV namespace called PORTFOLIOS
 * Set this up in your Cloudflare Pages > Settings > Functions > KV namespace bindings
 * Variable name: PORTFOLIOS
 */

export async function onRequestGet({ params, env }) {
  const { teacherId } = params;

  if (!teacherId) {
    return new Response(JSON.stringify({ error: "No teacher ID" }), {
      status: 400,
      headers: corsHeaders("application/json"),
    });
  }

  try {
    const value = await env.PORTFOLIOS.get(`portfolio:${teacherId}`);
    if (!value) {
      // Return empty object for new teachers (not a 404 - form just starts blank)
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: corsHeaders("application/json"),
      });
    }
    return new Response(value, {
      status: 200,
      headers: corsHeaders("application/json"),
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to load" }), {
      status: 500,
      headers: corsHeaders("application/json"),
    });
  }
}

export async function onRequestPut({ params, request, env }) {
  const { teacherId } = params;

  if (!teacherId) {
    return new Response(JSON.stringify({ error: "No teacher ID" }), {
      status: 400,
      headers: corsHeaders("application/json"),
    });
  }

  try {
    const body = await request.json();

    // Add a last-saved timestamp
    body._lastSaved = new Date().toISOString();
    body._teacherId = teacherId;

    await env.PORTFOLIOS.put(
      `portfolio:${teacherId}`,
      JSON.stringify(body),
      { expirationTtl: 60 * 60 * 24 * 365 } // keep for 1 year
    );

    return new Response(JSON.stringify({ ok: true, savedAt: body._lastSaved }), {
      status: 200,
      headers: corsHeaders("application/json"),
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to save" }), {
      status: 500,
      headers: corsHeaders("application/json"),
    });
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

function corsHeaders(contentType) {
  const h = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (contentType) h["Content-Type"] = contentType;
  return h;
}
