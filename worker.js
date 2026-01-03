/* 
NOTE : REPLACE THE SECRET AND WORKER URLS IN THE EXTENSION FILES BEFORE DEPLOYMENT
Deploy this worker code to Cloudflare Workers and set the WORKER_URL in background.js of the extension.
Also, set the WORKER_PASSWORD in content.js of the extension to match the MY_SECRET below.
and add your Gemini API keys in the Worker environment variables.
*/

export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

    const { question, context, accessCode } = await request.json();

    const MY_SECRET = "example_access_password"; //example access password

    if (accessCode !== MY_SECRET) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    //  COLLECT KEYS
    const keys = [];
    if (env.GEMINI_API_KEY) keys.push(env.GEMINI_API_KEY);
    if (env.GEMINI_KEY_1) keys.push(env.GEMINI_KEY_1);
    if (env.GEMINI_KEY_2) keys.push(env.GEMINI_KEY_2);
    if (env.GEMINI_KEY_3) keys.push(env.GEMINI_KEY_3);
    if (env.GEMINI_KEY_4) keys.push(env.GEMINI_KEY_4);


    if (keys.length === 0) return jsonResponse({ error: "No API Keys found." }, corsHeaders);

    //  TIERS (Model-First Priority)
    const priorityTiers = [
      // TIER 1: GEMINI 3 (Smartest, ~100 reqs/day total)
      ["gemini-3-flash-preview", "gemini-3.0-flash-preview"],
      
      // TIER 2: GEMINI 2.5 (Stable Fallback)
      ["gemini-2.5-flash", "gemini-2.5-flash-lite"],

      // TIER 3: LEGACY
      ["gemini-2.0-flash"],

      // TIER 4: INFINITE BACKUP (Unlimited Quota)
      ["gemma-3-12b-it", "gemma-3-12b"]
    ];

    let lastError = "";


    for (const tierModels of priorityTiers) {
      for (const model of tierModels) {
        for (const apiKey of keys) {
          
          if (lastError.includes("API key not valid")) continue;

          const result = await generateAnswer(apiKey, model, question, context);

          if (result.success) {
            
            if (model.includes("gemma")) {
              result.data.answer = "**(Note: Premium Quota Reached. Using Unlimited Backup)**\n\n" + result.data.answer;
            }
            return jsonResponse(result.data, corsHeaders);
          }

          const err = result.error.toLowerCase();
          lastError = result.error;

       
          if (err.includes("quota") || err.includes("429") || err.includes("limit") || err.includes("exhausted")) {
            console.log(`Key ending in ...${apiKey.slice(-4)} exhausted on ${model}. Switching key...`);
            continue; 
          }

         
          if (err.includes("not found")) {
            continue; 
          }
        }
      }
    }

    return jsonResponse({ error: `All Tiers & Keys Exhausted. (${lastError})` }, corsHeaders);
  }
};

// HELPER
async function generateAnswer(key, model, question, context) {
  const cleanModel = model.startsWith("models/") ? model.replace("models/", "") : model;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${key}`;

  const isGemma = model.includes("gemma");

  const payload = {
    contents: [{ parts: [{ text: context ? `Context: ${context}\n\nQuestion: ${question}` : question }] }],
    generationConfig: { 
        maxOutputTokens: 8192,
        temperature: 0.3 
    }
  };

  if (isGemma) {
    payload.contents[0].parts[0].text = `Instructions: You are an expert tutor. Be precise, concise, and factual. Use Markdown. Use > for definitions. Use **bold** for key terms.\n\n${payload.contents[0].parts[0].text}`;
  } else {
    payload.system_instruction = {
      parts: [{ text: "You are an expert tutor. Be precise, concise, and factual. Use Markdown. Use > for definitions. Use **bold** for key terms." }]
    };
  }

  try {
    const response = await fetch(url, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (data.error) return { success: false, error: data.error.message };
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!answer) return { success: false, error: "Empty Response" };

    return { success: true, data: { answer } };

  } catch (e) {
    return { success: false, error: e.message };
  }
}

function jsonResponse(data, headers) {
  return new Response(JSON.stringify(data), { headers: { ...headers, "Content-Type": "application/json" } });
}