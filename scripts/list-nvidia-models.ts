async function main() {
  const r = await fetch('https://integrate.api.nvidia.com/v1/models', {
    headers: { Authorization: 'Bearer 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' }
  });
  const d: any = await r.json();
  console.log('STATUS:', r.status);
  const models: string[] = d.data?.map((m: any) => m.id) || [];
  // Filter to Nemotron models
  const nemotron = models.filter(m => m.includes('nemotron') || m.includes('llama'));
  console.log('\nNEMOTRON/LLAMA MODELS AVAILABLE:');
  nemotron.forEach(m => console.log(' -', m));
  console.log('\nALL MODELS (first 30):');
  models.slice(0, 30).forEach(m => console.log(' -', m));
}
main();
