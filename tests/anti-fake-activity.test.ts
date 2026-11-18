import { describe, it, expect, vi, afterEach } from 'vitest';
import { researchTopic } from '../server/topicResearchService';
import { triggerVideoRender, ASYNC_RENDER_TIMEOUT_MS } from '../src/services/pluginWebhookService';
import { routeSemanticPipeline } from '../src/services/semanticPipelineRouter';
import { runMultiAgentWritersRoom } from '../src/services/multiAgentWritersRoom';

describe('Anti-Fake Activity Suite (5 Core Principles)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Rejects blank topic query cleanly instead of silently injecting a default topic', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await expect(researchTopic('   ')).rejects.toThrow();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('2. Returns strictly empty arrays when Wikimedia/News find zero matches (zero Unsplash/stock padding)', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () =>
        new Response(JSON.stringify({ query: { pages: {}, search: [] } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
    );

    const res = await researchTopic('xyzqwert99887766nonexistent');
    expect(res.news).toEqual([]);
    expect(res.headlines).toEqual([]);
    expect(res.visuals).toEqual([]);
    expect(res.videos).toEqual([]);
    expect(res.wikiSummary).toBe('');
    expect(JSON.stringify(res)).not.toContain('images.unsplash.com');
  });

  it('3. Propagates real upstream HTTP failure instead of fabricating fallback headlines in catch', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () => new Response('Upstream Gateway Error', { status: 500 })
    );

    await expect(researchTopic('Giá vàng SJC hôm nay')).rejects.toThrow(/500|HTTP/i);
  });

  it('4. Rejects missing plugin token or blank prompt without returning fake completed video', async () => {
    await expect(
      triggerVideoRender({ prompt: 'Scene 1', pluginToken: '', endpointUrl: 'https://api.kling.example/v1' })
    ).rejects.toThrow();

    await expect(
      triggerVideoRender({ prompt: '   ', pluginToken: 'valid-token-12345', endpointUrl: 'https://api.kling.example/v1' })
    ).rejects.toThrow();
  });

  it('5. Enforces >= 60s async queue timeout and honest queued/failed render state without silent catch override', async () => {
    expect(ASYNC_RENDER_TIMEOUT_MS).toBeGreaterThanOrEqual(60000);

    const okFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({ jobId: 'job_real_999', status: 'queued', provider: 'comfyui-kaggle-t4' }),
        { status: 202, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const submitted = await triggerVideoRender({
      prompt: 'Pixar 3D fox exploring glowing cyber forest',
      pluginToken: 'valid-token-abcdef',
      endpointUrl: 'https://worker.trycloudflare.com/prompt',
      durationSec: 30,
    });

    expect(okFetch).toHaveBeenCalledTimes(1);
    expect(submitted.jobId).toBe('job_real_999');
    expect(submitted.status).toBe('queued');

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'GPU Worker overloaded' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await expect(
      triggerVideoRender({
        prompt: 'Pixar 3D fox exploring glowing cyber forest',
        token: 'valid-token-abcdef',
        endpoint: 'https://worker.trycloudflare.com/prompt',
      })
    ).rejects.toThrow(/502|overloaded/i);
  });

  it('6. Semantic Router locks Wikimedia search on 3D Animation Kids & Multi-Agent Room scores 0-100', async () => {
    const route = routeSemanticPipeline('Phim hoạt hình 3D chú thỏ và bác sĩ gấu cho trẻ em', '/storytelling', 60);
    expect(route.flowId).toBe('3d_animation_kids');
    expect(route.lockWikimediaSearch).toBe(true);
    expect(route.compliance.isMadeForKids).toBe(true);

    const room = await runMultiAgentWritersRoom({
      prompt: 'Phim hoạt hình 3D chú thỏ dũng cảm trong khu rừng mùa thu',
      route,
      targetDurationSec: 60,
    });
    expect(room.rubricCritic.totalScore).toBeGreaterThanOrEqual(75);
    expect(room.rubricCritic.totalScore).toBeLessThanOrEqual(100);
    expect(room.cinematographerSpecs.length).toBeGreaterThanOrEqual(4);
    expect(room.characterVault[0]?.fixedSeed).toBeGreaterThan(0);
  });
});
