async function main() {
  const API_KEY = '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';
  const MODEL = 'nvidia/llama-3.1-nemotron-70b-instruct';
  
  const url = 'https://integrate.api.nvidia.com/v1/chat/completions';
  
  console.log('Testing URL:', url);
  console.log('Model:', MODEL);

  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: 'Say LIVE in one word.' }],
      max_tokens: 10,
      temperature: 0.1,
      stream: false
    })
  });

  console.log('HTTP Status:', r.status, r.statusText);
  const text = await r.text();
  console.log('Response:', text.substring(0, 500));
}
main();
